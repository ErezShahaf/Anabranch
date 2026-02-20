import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { Repository } from "../providers/source-control/types.js";
import type { SourceControlProvider } from "../providers/source-control/base.js";
import { SOURCE_CONTROL_PROVIDER } from "../providers/source-control/tokens.js";
import { ConfigurationService } from "../core/configuration/configuration.service.js";

const execFileAsync = promisify(execFile);

const WORKTREE_ADD_TIMEOUT_MS = 60_000;
const WORKTREE_REMOVE_TIMEOUT_MS = 30_000;

@Injectable()
export class WorkspaceManager implements OnModuleInit {
  private readonly basePath: string;
  private readonly sourceControl: SourceControlProvider;

  private readonly logger = new Logger(WorkspaceManager.name);

  constructor(
    configService: ConfigurationService,
    @Inject(SOURCE_CONTROL_PROVIDER) sourceControl: SourceControlProvider,
  ) {
    this.basePath = configService.config.workspace.basePath;
    this.sourceControl = sourceControl;
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    this.ensureDirectoryExists(this.basePath);
    this.ensureDirectoryExists(this.repositoriesDirectory());
    this.ensureDirectoryExists(this.worktreesDirectory());

    const repositories = await this.sourceControl.listRepositories();
    this.logger.log(
      `syncing ${repositories.length} repositories to local workspace`,
    );

    for (const repository of repositories) {
      await this.ensureRepositoryCloned(repository);
    }

    this.logger.log("workspace initialization complete");
  }

  async ensureCleanWorktree(
    repository: Repository,
    ticketId: string
  ): Promise<void> {
    const worktreePath = this.worktreePath(repository, ticketId);
    if (existsSync(worktreePath)) {
      this.logger.log(
        `worktree already exists for ${repository.fullName}, removing before re-creating`,
      );
      await this.cleanupWorkspace(worktreePath);
    }
  }

  async prepareWorkspace(
    repository: Repository,
    ticketId: string
  ): Promise<string> {
    await this.ensureCleanWorktree(repository, ticketId);

    const repositoryPath = this.repositoryPath(repository);
    await this.pullLatestSafely(repositoryPath);

    const branchName = `anabranch/${ticketId}`;
    const worktreePath = this.worktreePath(repository, ticketId);

    await execFileAsync(
      "git",
      [
        "worktree",
        "add",
        "-b",
        branchName,
        worktreePath,
        repository.defaultBranch,
      ],
      { cwd: repositoryPath, timeout: WORKTREE_ADD_TIMEOUT_MS }
    );

    this.logger.log(
      `worktree created for ${repository.fullName} (${branchName})`,
    );

    return worktreePath;
  }

  async cleanupWorkspace(worktreePath: string): Promise<void> {
    const parentRepositoryPath = await this.findParentRepository(worktreePath);

    await execFileAsync(
      "git",
      ["worktree", "remove", worktreePath, "--force"],
      { cwd: parentRepositoryPath, timeout: WORKTREE_REMOVE_TIMEOUT_MS }
    );

    this.logger.debug(`worktree removed: ${worktreePath}`);
  }

  async hasUncommittedChanges(worktreePath: string): Promise<boolean> {
    const result = await execFileAsync(
      "git",
      ["status", "--porcelain"],
      { cwd: worktreePath }
    );

    return result.stdout.trim().length > 0;
  }

  async commitChanges(
    worktreePath: string,
    message: string
  ): Promise<void> {
    await execFileAsync("git", ["add", "-A"], { cwd: worktreePath });
    await execFileAsync(
      "git",
      ["-c", "user.name=Anabranch", "-c", "user.email=anabranch@local", "commit", "-m", message],
      { cwd: worktreePath }
    );
    this.logger.debug(`committed changes in ${worktreePath}`);
  }

  async hasBranchDiverged(worktreePath: string, baseBranch: string): Promise<boolean> {
    const result = await execFileAsync(
      "git",
      ["log", `${baseBranch}..HEAD`, "--oneline"],
      { cwd: worktreePath }
    );

    return result.stdout.trim().length > 0;
  }

  async commitAndGetRepositoriesWithChanges(
    repositories: Repository[],
    worktreePaths: Map<string, string>,
    commitMessage: string,
  ): Promise<Repository[]> {
    const reposWithChanges: Repository[] = [];

    for (const repository of repositories) {
      const worktreePath = worktreePaths.get(repository.fullName);
      if (!worktreePath) {
        throw new Error(`No worktree path for ${repository.fullName}`);
      }

      const hasUncommitted = await this.hasUncommittedChanges(worktreePath);
      if (hasUncommitted) {
        await this.commitChanges(worktreePath, commitMessage);
      }

      const hasChanges = await this.hasBranchDiverged(
        worktreePath,
        repository.defaultBranch,
      );
      if (hasChanges) {
        reposWithChanges.push(repository);
      }
    }

    return reposWithChanges;
  }

  private async ensureRepositoryCloned(repository: Repository): Promise<void> {
    const repositoryPath = this.repositoryPath(repository);

    if (existsSync(repositoryPath)) {
      this.logger.debug(
        `repository ${repository.fullName} already cloned, pulling latest`,
      );
      await this.pullLatestSafely(repositoryPath);
      return;
    }

    const ownerDirectory = join(this.repositoriesDirectory(), repository.fullName.split("/")[0]!);
    this.ensureDirectoryExists(ownerDirectory);

    await this.sourceControl.cloneRepository(repository, repositoryPath);
  }

  private async pullLatestSafely(repositoryPath: string): Promise<void> {
    try {
      await this.sourceControl.pullLatest(repositoryPath);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `failed to pull latest for ${repositoryPath}: ${message}, continuing with existing state`,
      );
    }
  }

  private async findParentRepository(worktreePath: string): Promise<string> {
    const result = await execFileAsync(
      "git",
      ["rev-parse", "--git-common-dir"],
      { cwd: worktreePath }
    );

    const gitCommonDirectory = result.stdout.trim();

    if (gitCommonDirectory.endsWith("/.git") || gitCommonDirectory.endsWith("\\.git")) {
      return gitCommonDirectory.slice(0, -5);
    }

    return gitCommonDirectory;
  }

  private repositoriesDirectory(): string {
    return join(this.basePath, "repositories");
  }

  private worktreesDirectory(): string {
    return join(this.basePath, "worktrees");
  }

  private repositoryPath(repository: Repository): string {
    return join(this.repositoriesDirectory(), repository.fullName);
  }

  getWorktreePath(repository: Repository, ticketId: string): string {
    const safeTicketId = ticketId.replace(/[^a-zA-Z0-9\-_]/g, "-");
    const safeRepoName = repository.fullName.replace("/", "--");
    return join(this.worktreesDirectory(), `${safeRepoName}--${safeTicketId}`);
  }

  private worktreePath(repository: Repository, ticketId: string): string {
    return this.getWorktreePath(repository, ticketId);
  }

  private ensureDirectoryExists(directoryPath: string): void {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }
}

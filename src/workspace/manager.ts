import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Repository } from "../providers/source-control/types.js";
import { SourceControlProvider } from "../providers/source-control/base.js";
import { ConfigurationService } from "../core/configuration/configuration.service.js";

const execFileAsync = promisify(execFile);

@Injectable()
export class WorkspaceManager implements OnModuleInit {
  private readonly basePath: string;
  private readonly sourceControl: SourceControlProvider;

  constructor(
    configService: ConfigurationService,
    sourceControl: SourceControlProvider,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("workspace-manager");
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
    this.logger.info(
      { count: repositories.length },
      "syncing repositories to local workspace"
    );

    for (const repository of repositories) {
      await this.ensureRepositoryCloned(repository);
    }

    this.logger.info("workspace initialization complete");
  }

  async prepareWorkspace(
    repository: Repository,
    ticketId: string
  ): Promise<string> {
    const repositoryPath = this.repositoryPath(repository);
    await this.pullLatestSafely(repositoryPath);

    const branchName = `anabranch/${ticketId}`;
    const worktreePath = this.worktreePath(repository, ticketId);

    if (existsSync(worktreePath)) {
      this.logger.warn(
        { repository: repository.fullName, ticketId, path: worktreePath },
        "worktree already exists, removing before re-creating"
      );
      await this.cleanupWorkspace(worktreePath);
    }

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
      { cwd: repositoryPath, timeout: 60_000 }
    );

    this.logger.info(
      { repository: repository.fullName, ticketId, branch: branchName },
      "worktree created"
    );

    return worktreePath;
  }

  async cleanupWorkspace(worktreePath: string): Promise<void> {
    const parentRepositoryPath = await this.findParentRepository(worktreePath);

    await execFileAsync(
      "git",
      ["worktree", "remove", worktreePath, "--force"],
      { cwd: parentRepositoryPath, timeout: 30_000 }
    );

    this.logger.debug({ path: worktreePath }, "worktree removed");
  }

  async hasUncommittedChanges(worktreePath: string): Promise<boolean> {
    const result = await execFileAsync(
      "git",
      ["status", "--porcelain"],
      { cwd: worktreePath }
    );

    return result.stdout.trim().length > 0;
  }

  async hasBranchDiverged(worktreePath: string, baseBranch: string): Promise<boolean> {
    const result = await execFileAsync(
      "git",
      ["log", `${baseBranch}..HEAD`, "--oneline"],
      { cwd: worktreePath }
    );

    return result.stdout.trim().length > 0;
  }

  private async ensureRepositoryCloned(repository: Repository): Promise<void> {
    const repositoryPath = this.repositoryPath(repository);

    if (existsSync(repositoryPath)) {
      this.logger.debug(
        { repository: repository.fullName },
        "repository already cloned, pulling latest"
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
        { path: repositoryPath, error: message },
        "failed to pull latest, continuing with existing state"
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

    // git-common-dir returns the .git directory of the parent repository
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

  private worktreePath(repository: Repository, ticketId: string): string {
    const safeTicketId = ticketId.replace(/[^a-zA-Z0-9\-_]/g, "-");
    const safeRepoName = repository.fullName.replace("/", "--");
    return join(this.worktreesDirectory(), `${safeRepoName}--${safeTicketId}`);
  }

  private ensureDirectoryExists(directoryPath: string): void {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }
}

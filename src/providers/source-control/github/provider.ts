import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import type pino from "pino";
import type { GitHubSourceControlConfiguration } from "../../../core/configuration/types.js";
import type {
  Repository,
  CreatePullRequestParameters,
  PullRequest,
} from "../types.js";
import { SourceControlProvider } from "../base.js";

const execFileAsync = promisify(execFile);

const MAX_PAGE_SIZE = 100;
const CLONE_TIMEOUT_MS = 300_000; // 5 minutes
const FETCH_TIMEOUT_MS = 120_000; // 2 minutes
const PULL_TIMEOUT_MS = 120_000; // 2 minutes
const PUSH_TIMEOUT_MS = 120_000; // 2 minutes

export class GitHubProvider extends SourceControlProvider {
  readonly name = "github";
  private readonly octokit: Octokit;
  private readonly configuration: GitHubSourceControlConfiguration;
  private readonly logger: pino.Logger;

  constructor(
    configuration: GitHubSourceControlConfiguration,
    logger: pino.Logger
  ) {
    super();
    this.configuration = configuration;
    this.logger = logger.child({ component: "github-provider" });

    const privateKey = readFileSync(configuration.privateKeyPath, "utf-8");

    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: configuration.appId,
        privateKey,
        installationId: Number(configuration.installationId),
      },
    });
  }

  async listRepositories(): Promise<Repository[]> {
    const repositories: Repository[] = [];

    for (let page = 1; ; page++) {
      const response =
        await this.octokit.apps.listReposAccessibleToInstallation({
          per_page: MAX_PAGE_SIZE,
          page,
        });

      const batch = response.data.repositories ?? [];
      if (batch.length === 0) {
        break;
      }

      for (const githubRepository of batch) {
        repositories.push({
          name: githubRepository.name,
          fullName: githubRepository.full_name,
          cloneUrl: githubRepository.clone_url,
          defaultBranch:
            githubRepository.default_branch ?? this.configuration.baseBranch,
          description: githubRepository.description ?? null,
          private: githubRepository.private,
        });
      }

      if (batch.length < MAX_PAGE_SIZE) {
        break;
      }
    }

    this.logger.info(
      { repositoryCount: repositories.length },
      "discovered repositories from GitHub App installation"
    );

    return repositories;
  }

  async cloneRepository(
    repository: Repository,
    targetPath: string
  ): Promise<void> {
    const cloneUrl = await this.getAuthenticatedCloneUrl(repository);

    await execFileAsync("git", ["clone", cloneUrl, targetPath], {
      timeout: CLONE_TIMEOUT_MS,
    });

    this.logger.info(
      { repository: repository.fullName, path: targetPath },
      "repository cloned"
    );
  }

  async pullLatest(repositoryPath: string): Promise<void> {
    await execFileAsync("git", ["fetch", "--all", "--prune"], {
      cwd: repositoryPath,
      timeout: FETCH_TIMEOUT_MS,
    });

    await execFileAsync("git", ["pull", "--ff-only"], {
      cwd: repositoryPath,
      timeout: PULL_TIMEOUT_MS,
    });

    this.logger.debug({ path: repositoryPath }, "pulled latest changes");
  }

  async pushBranch(
    repositoryPath: string,
    branchName: string
  ): Promise<void> {
    await execFileAsync(
      "git",
      ["push", "origin", branchName, "--force-with-lease"],
      { cwd: repositoryPath, timeout: PUSH_TIMEOUT_MS }
    );

    this.logger.info(
      { path: repositoryPath, branch: branchName },
      "branch pushed"
    );
  }

  async createPullRequest(
    parameters: CreatePullRequestParameters
  ): Promise<PullRequest> {
    const response = await this.octokit.pulls.create({
      owner: parameters.owner,
      repo: parameters.repositoryName,
      title: parameters.title,
      body: parameters.body,
      head: parameters.headBranch,
      base: parameters.baseBranch,
    });

    const pullRequest: PullRequest = {
      number: response.data.number,
      url: response.data.html_url,
      title: response.data.title,
      headBranch: parameters.headBranch,
      baseBranch: parameters.baseBranch,
    };

    this.logger.info(
      { pullRequestNumber: pullRequest.number, url: pullRequest.url },
      "pull request created"
    );

    return pullRequest;
  }

  async getAuthenticatedCloneUrl(repository: Repository): Promise<string> {
    const authResponse = await this.octokit.auth({
      type: "installation",
    }) as { token: string };

    const urlWithToken = repository.cloneUrl.replace(
      "https://",
      `https://x-access-token:${authResponse.token}@`
    );

    return urlWithToken;
  }
}

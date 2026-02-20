import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { ApplicationConfiguration } from "../configuration/types.js";
import type { AssessedTicketTask } from "../queue/types.js";
import type { Repository } from "../../providers/source-control/types.js";
import type { PullRequest } from "../../providers/source-control/types.js";
import type { AgentResult } from "../../providers/agents/types.js";
import type { CodingAgent } from "../../providers/agents/base.js";
import { CODING_AGENT } from "../../providers/agents/tokens.js";
import type { WorkspaceManager } from "../../workspace/manager.js";
import { WORKSPACE_MANAGER } from "../../workspace/tokens.js";
import { PullRequestService } from "./pull-request.service.js";
import { ConfigurationService } from "../configuration/configuration.service.js";
import { Retry } from "../../common/decorators/retry.decorator.js";

@Injectable()
export class ExecutionService {
  readonly configuration: ApplicationConfiguration;
  readonly logger = new Logger(ExecutionService.name);

  constructor(
    @Inject(CODING_AGENT) private readonly codingAgent: CodingAgent,
    @Inject(WORKSPACE_MANAGER) private readonly workspaceManager: WorkspaceManager,
    private readonly pullRequestService: PullRequestService,
    @Inject(ConfigurationService) configService: ConfigurationService,
  ) {
    this.configuration = configService.config;
  }

  @Retry({
    maxRetries: (self: ExecutionService) => self.configuration.agent.execution.retries,
    onRetry: (self: ExecutionService, attempt: number, error: Error) => {
      self.logger.warn(
        `execution attempt ${attempt} failed, retrying: ${error.message}`,
      );
    },
  })
  async execute(
    task: AssessedTicketTask,
    allRepositories: Repository[],
  ): Promise<{ result: AgentResult; pullRequests: PullRequest[] }> {
    const ticketId = task.ticket.externalId;
    const worktreePaths: Map<string, string> = new Map();

    try {
      for (const repository of allRepositories) {
        const worktreePath = await this.workspaceManager.prepareWorkspace(
          repository,
          ticketId,
        );
        worktreePaths.set(repository.fullName, worktreePath);
      }

      const workDirectories = Array.from(worktreePaths.values());
      const agentResult = await this.codingAgent.execute(
        task.ticket,
        workDirectories,
        task.assessment,
        this.configuration.agent,
      );

      if (!agentResult.shouldCreatePR) {
        this.logger.log(
          `skipping PR creation for ${ticketId}: ${agentResult.skipReason ?? "task was too ambiguous"}`,
        );
        return { result: agentResult, pullRequests: [] };
      }

      const repositoriesWithChanges =
        await this.workspaceManager.commitAndGetRepositoriesWithChanges(
          allRepositories,
          worktreePaths,
          `[Anabranch] ${task.ticket.title}`,
        );

      const pullRequests =
        await this.pullRequestService.createPullRequestsForRepositories(
          task,
          repositoriesWithChanges,
          worktreePaths,
        );

      if (pullRequests.length > 0) {
        this.logger.log(
          `created ${pullRequests.length} pull request(s) for ${ticketId}`,
        );
      } else {
        this.logger.log(`no pull requests created for ${ticketId} (no changes to push)`);
      }

      return { result: agentResult, pullRequests };
    } finally {
      for (const repository of allRepositories) {
        try {
          await this.workspaceManager.ensureCleanWorktree(repository, ticketId);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `failed to clean up worktree for ${repository.fullName}: ${message}`,
          );
        }
      }
    }
  }
}

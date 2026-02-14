import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { ApplicationConfiguration } from "../configuration/types.js";
import type { AssessedTicketTask } from "../queue/types.js";
import type { Repository } from "../../providers/source-control/types.js";
import type { CodingAgent } from "../../providers/agents/base.js";
import { CODING_AGENT } from "../../providers/agents/tokens.js";
import { WorkspaceManager } from "../../workspace/manager.js";
import { PullRequestService } from "./pull-request.service.js";
import { ConfigurationService } from "../configuration/configuration.service.js";
import { Retry } from "../../common/decorators/retry.decorator.js";

@Injectable()
export class ExecutionService {
  readonly configuration: ApplicationConfiguration;
  readonly logger: PinoLogger;

  constructor(
    @Inject(CODING_AGENT) private readonly codingAgent: CodingAgent,
    private readonly workspaceManager: WorkspaceManager,
    private readonly pullRequestService: PullRequestService,
    @Inject(ConfigurationService) configService: ConfigurationService,
    logger: PinoLogger,
  ) {
    this.configuration = configService.config;
    this.logger = logger;
  }

  @Retry({
    maxRetries: (self: ExecutionService) => self.configuration.agent.execution.retries,
    onRetry: (self: ExecutionService, attempt: number, error: Error) => {
      self.logger.warn(
        { attempt, error: error.message },
        "execution attempt failed, retrying",
      );
    },
  })
  async execute(task: AssessedTicketTask, allRepositories: Repository[]): Promise<void> {
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
      task.result = agentResult;

      if (!agentResult.success) {
        this.logger.error(
          { ticketId, error: agentResult.summary },
          "agent execution failed",
        );
        throw new Error(`Agent execution failed: ${agentResult.summary}`);
      }

      // TODO ask the agent for assessment on the success of the task before creating pull requests(?)

      const repositoriesWithChanges: Repository[] = [];
      for (const repository of allRepositories) {
        const worktreePath = worktreePaths.get(repository.fullName)!;
        const hasChanges = await this.workspaceManager.hasBranchDiverged(
          worktreePath,
          repository.defaultBranch,
        );
        if (hasChanges) {
          repositoriesWithChanges.push(repository);
        }
      }

      task.pullRequests = await this.pullRequestService.createPullRequestsForRepositories(
        task,
        repositoriesWithChanges,
        worktreePaths,
      );
    } finally {
      for (const [repositoryFullName, worktreePath] of worktreePaths) {
        try {
          await this.workspaceManager.cleanupWorkspace(worktreePath);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            { ticketId, repository: repositoryFullName, error: message },
            "failed to clean up worktree",
          );
        }
      }
    }
  }
}

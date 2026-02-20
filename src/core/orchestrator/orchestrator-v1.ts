import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { TicketTask, AssessedTicketTask } from "../queue/types.js";
import { TaskOrchestrator } from "./base.js";
import type { AssessmentService } from "./assessment.service.js";
import type { ExecutionService } from "./execution.service.js";
import { ASSESSMENT_SERVICE, EXECUTION_SERVICE } from "./tokens.js";
import { ConfigurationService } from "../configuration/configuration.service.js";

@Injectable()
export class OrchestratorV1 extends TaskOrchestrator {
  readonly name = "v1";
  private readonly logger = new Logger(OrchestratorV1.name);

  constructor(
    @Inject(ASSESSMENT_SERVICE) private readonly assessmentService: AssessmentService,
    @Inject(EXECUTION_SERVICE) private readonly executionService: ExecutionService,
    @Inject(ConfigurationService) private readonly configService: ConfigurationService,
  ) {
    super();
  }

  async handleTask(task: TicketTask): Promise<void> {
    const ticketId = task.ticket.externalId;
    this.logger.log(`beginning task processing for ${ticketId}`);

    try {
      const repositories = await this.assessmentService.listRepositories();
      const skipAssessment = this.configService.config.agent.assessment.skipAssessment ?? false;

      if (skipAssessment) {
        // Skip assessment, go directly to execution
        this.logger.log(`skipping assessment for ${ticketId} (skipAssessment: true)`);
        task.status = "executing";
        task.assessment = null;

        const assessedTask: AssessedTicketTask = { ...task, assessment: null };
        const { result, pullRequests } = await this.executionService.execute(
          assessedTask,
          repositories,
        );
        task.result = result;
        task.pullRequests = pullRequests;

        // Check if agent decided to skip PR creation due to ambiguity
        if (!result.shouldCreatePR) {
          task.status = "skipped";
          this.logger.log(
            `task skipped: ${result.skipReason ?? "task was too ambiguous"} (${ticketId})`,
          );
          return;
        }

        task.status = "succeeded";
      } else {
        // Run assessment as before
        task.status = "assessing";

        const assessment = await this.assessmentService.assess(task, repositories);

        if (!this.assessmentService.passesConfidenceGate(assessment.confidence, assessment.scope)) {
          task.status = "skipped";
          this.logger.log(
            `task skipped: did not pass confidence gate (${ticketId}, confidence: ${assessment.confidence}, scope: ${assessment.scope})`,
          );
          return;
        }

        if (assessment.affectedRepositories.length === 0) {
          task.status = "skipped";
          this.logger.log(`task skipped: no affected repositories identified (${ticketId})`);
          return;
        }

        task.status = "executing";

        const assessedTask: AssessedTicketTask = { ...task, assessment };
        const { result, pullRequests } = await this.executionService.execute(
          assessedTask,
          repositories,
        );
        task.result = result;
        task.pullRequests = pullRequests;

        // Check if agent decided to skip PR creation
        if (!result.shouldCreatePR) {
          task.status = "skipped";
          this.logger.log(
            `task skipped: ${result.skipReason ?? "task was too ambiguous"} (${ticketId})`,
          );
          return;
        }

        task.status = "succeeded";
      }
    } catch (error: unknown) {
      task.status = "failed";
      task.errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`task failed: ${ticketId} - ${task.errorMessage}`);
    }
  }
}

import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TicketTask, AssessedTicketTask } from "../queue/types.js";
import { TaskOrchestrator } from "./base.js";
import { AssessmentService } from "./assessment.service.js";
import { ExecutionService } from "./execution.service.js";

@Injectable()
export class OrchestratorV1 extends TaskOrchestrator {
  readonly name = "v1";

  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly executionService: ExecutionService,
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async handleTask(task: TicketTask): Promise<void> {
    const ticketId = task.ticket.externalId;
    this.logger.info({ ticketId }, "beginning task processing");

    try {
      task.status = "assessing";

      const repositories = await this.assessmentService.listRepositories();
      const assessment = await this.assessmentService.assess(task, repositories);

      if (!this.assessmentService.passesConfidenceGate(assessment.confidence, assessment.scope)) {
        task.status = "skipped";
        this.logger.info(
          { ticketId, confidence: assessment.confidence, scope: assessment.scope },
          "task skipped: did not pass confidence gate",
        );
        return;
      }

      if (assessment.affectedRepositories.length === 0) {
        task.status = "skipped";
        this.logger.info({ ticketId }, "task skipped: no affected repositories identified");
        return;
      }

      task.status = "executing";
  
      await this.executionService.execute(task as AssessedTicketTask, repositories);
      task.status = "succeeded";
    } catch (error: unknown) {
      task.status = "failed";
      task.errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { ticketId, error: task.errorMessage },
        "task failed",
      );
    }
  }
}

import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TicketTask } from "../queue/types.js";
import type { AssessmentResult, TaskScope } from "./types.js";
import type { Repository } from "../../providers/source-control/types.js";
import { CodingAgent } from "../../providers/agents/base.js";
import { SourceControlProvider } from "../../providers/source-control/base.js";
import { ConfigurationService } from "../configuration/configuration.service.js";

const SCOPE_SEVERITY_ORDER: TaskScope[] = [
  "trivial",
  "small",
  "medium",
  "large",
  "architectural",
];

@Injectable()
export class AssessmentService {
  constructor(
    private readonly codingAgent: CodingAgent,
    private readonly sourceControl: SourceControlProvider,
    private readonly configService: ConfigurationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("assessment");
  }

  async listRepositories(): Promise<Repository[]> {
    return this.sourceControl.listRepositories();
  }

  async assess(
    task: TicketTask,
    repositories: Repository[],
  ): Promise<AssessmentResult> {
    const assessment = await this.codingAgent.assess(task.ticket, repositories);
    task.assessment = assessment;

    this.logger.info(
      {
        ticketId: task.ticket.externalId,
        confidence: assessment.confidence,
        scope: assessment.scope,
        affectedRepositories: assessment.affectedRepositories,
      },
      "assessment complete",
    );

    return assessment;
  }

  passesConfidenceGate(confidence: number, scope: TaskScope): boolean {
    const threshold = this.configService.config.agent.assessment.confidenceThreshold;
    if (confidence < threshold) {
      return false;
    }

    const maxScope = this.configService.config.agent.assessment.maxScope;
    const scopeIndex = SCOPE_SEVERITY_ORDER.indexOf(scope);
    const maxScopeIndex = SCOPE_SEVERITY_ORDER.indexOf(maxScope);

    return scopeIndex <= maxScopeIndex;
  }
}

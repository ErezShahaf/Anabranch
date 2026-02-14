import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TicketTask } from "../queue/types.js";
import type { AssessmentResult, TaskScope } from "./types.js";
import type { Repository } from "../../providers/source-control/types.js";
import type { CodingAgent } from "../../providers/agents/base.js";
import type { SourceControlProvider } from "../../providers/source-control/base.js";
import { CODING_AGENT } from "../../providers/agents/tokens.js";
import { SOURCE_CONTROL_PROVIDER } from "../../providers/source-control/tokens.js";
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
    @Inject(CODING_AGENT) private readonly codingAgent: CodingAgent,
    @Inject(SOURCE_CONTROL_PROVIDER) private readonly sourceControl: SourceControlProvider,
    private readonly configService: ConfigurationService,
    private readonly logger: PinoLogger,
  ) {}

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

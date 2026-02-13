import type { Ticket } from "../ticketing/types.js";
import type { AssessmentResult } from "../../core/orchestrator/types.js";
import type { AgentResult } from "./types.js";
import type { AgentConfiguration } from "../../core/configuration/types.js";
import type { Repository } from "../source-control/types.js";

export abstract class CodingAgent {
  abstract readonly name: string;

  abstract healthCheck(): Promise<boolean>;

  abstract assess(
    ticket: Ticket,
    repositories: Repository[]
  ): Promise<AssessmentResult>;

  abstract execute(
    ticket: Ticket,
    workDirectories: string[],
    assessment: AssessmentResult,
    configuration: AgentConfiguration
  ): Promise<AgentResult>;
}

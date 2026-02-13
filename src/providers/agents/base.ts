import type {
  Ticket,
  AssessmentResult,
  AgentResult,
  AgentConfiguration,
  Repository,
} from "../../core/types.js";

export abstract class CodingAgent {
  abstract readonly name: string;

  abstract isAvailable(): Promise<boolean>;

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

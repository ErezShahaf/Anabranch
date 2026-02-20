import type { Ticket } from "../../providers/ticketing/types.js";
import type { AssessmentResult } from "../orchestrator/types.js";
import type { AgentResult } from "../../providers/agents/types.js";
import type { PullRequest } from "../../providers/source-control/types.js";

export type TaskStatus =
  | "queued"
  | "assessing"
  | "executing"
  | "succeeded"
  | "failed"
  | "skipped";

export interface TicketTask {
  id: string;
  ticket: Ticket;
  status: TaskStatus;
  createdAt: Date;
  assessment: AssessmentResult | null;
  result: AgentResult | null;
  pullRequests: PullRequest[];
  retriesRemaining: number;
  errorMessage: string | null;
}

export interface AssessedTicketTask extends TicketTask {
  assessment: AssessmentResult | null;
}

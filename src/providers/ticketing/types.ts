export type TicketEventType = "created" | "updated" | "commented";

export interface Ticket {
  id: string;
  externalId: string;
  title: string;
  description: string;
  labels: string[];
  assignee: string | null;
  priority: string | null;
  issueType: string | null;
  project: string;
  url: string;
  provider: string;
  metadata: Record<string, unknown>;
}

export interface TicketEvent {
  type: TicketEventType;
  ticket: Ticket;
  rawPayload: unknown;
}

export interface TicketFilterConfiguration {
  projects: string[];
  labels: string[];
  excludeLabels: string[];
  issueTypes: string[];
  assignees: string[];
}

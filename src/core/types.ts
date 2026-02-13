// ---------------------------------------------------------------------------
// Ticketing
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Ticket Filtering
// ---------------------------------------------------------------------------

export interface TicketFilterConfiguration {
  projects: string[];
  labels: string[];
  excludeLabels: string[];
  issueTypes: string[];
  assignees: string[];
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export type TaskScope =
  | "trivial"
  | "small"
  | "medium"
  | "large"
  | "architectural";

export interface AssessmentResult {
  confidence: number;
  scope: TaskScope;
  riskFactors: string[];
  decisionsRequired: string[];
  estimatedFiles: number;
  affectedRepositories: string[];
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Agent Execution
// ---------------------------------------------------------------------------

export interface AgentResult {
  success: boolean;
  filesChanged: string[];
  summary: string;
  testsPassed: boolean | null;
  costInDollars: number | null;
}

export interface TestResult {
  passed: boolean;
  output: string;
  exitCode: number;
}

// ---------------------------------------------------------------------------
// Source Control
// ---------------------------------------------------------------------------

export interface Repository {
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  description: string | null;
  private: boolean;
}

export interface CreatePullRequestParameters {
  owner: string;
  repositoryName: string;
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
}

export interface PullRequest {
  number: number;
  url: string;
  title: string;
  headBranch: string;
  baseBranch: string;
}

// ---------------------------------------------------------------------------
// Task Queue
// ---------------------------------------------------------------------------

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
  assessment: AssessmentResult;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type AgentProviderName = "claude-code" | "cursor";

export type OrchestratorName = "default";

export interface AgentConfiguration {
  provider: AgentProviderName;
  assessment: {
    confidenceThreshold: number;
    maxScope: TaskScope;
  };
  execution: {
    maxFileChanges: number;
    timeoutMinutes: number;
    retries: number;
  };
}

export interface JiraTicketingConfiguration {
  enabled: boolean;
  webhookSecret: string;
  filters: TicketFilterConfiguration;
}

export interface TicketingConfiguration {
  jira: JiraTicketingConfiguration;
}

export interface GitHubSourceControlConfiguration {
  appId: string;
  privateKeyPath: string;
  installationId: string;
  baseBranch: string;
}

export interface SourceControlConfiguration {
  github: GitHubSourceControlConfiguration;
}

export interface WorkspaceConfiguration {
  basePath: string;
}

export interface LoggingConfiguration {
  level: string;
  format: string;
}

export interface ServerConfiguration {
  port: number;
  host: string;
}

export interface OrchestratorConfiguration {
  provider: OrchestratorName;
}

export interface ApplicationConfiguration {
  server: ServerConfiguration;
  agent: AgentConfiguration;
  orchestrator: OrchestratorConfiguration;
  ticketing: TicketingConfiguration;
  sourceControl: SourceControlConfiguration;
  workspace: WorkspaceConfiguration;
  logging: LoggingConfiguration;
}

import type { TicketFilterConfiguration } from "../../providers/ticketing/types.js";
import type { TaskScope } from "../orchestrator/types.js";

export type AgentProviderName = "claude-code" | "cursor";

export type OrchestratorName = "default";

export interface AgentConfiguration {
  provider: AgentProviderName;
  apiKey: string;
  assessment: {
    skipAssessment?: boolean;
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
  privateKey: string;
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

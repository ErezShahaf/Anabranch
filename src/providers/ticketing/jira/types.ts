export interface JiraWebhookPayload {
  webhookEvent: string;
  issue: JiraIssue;
  user: JiraUser;
  timestamp: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraIssueFields {
  summary: string;
  description: string | null;
  issuetype: JiraIssueType;
  project: JiraProject;
  labels: string[];
  priority: JiraPriority | null;
  assignee: JiraUser | null;
  status: JiraStatus;
}

export interface JiraIssueType {
  name: string;
}

export interface JiraProject {
  key: string;
  name: string;
}

export interface JiraPriority {
  name: string;
}

export interface JiraUser {
  displayName: string;
  accountId: string;
  emailAddress?: string;
}

export interface JiraStatus {
  name: string;
}

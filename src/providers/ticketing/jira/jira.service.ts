import { createHmac } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type {
  Ticket,
  TicketEvent,
  TicketFilterConfiguration,
} from "../types.js";
import type { TaskQueue } from "../../../core/queue/task-queue.js";
import { TASK_QUEUE } from "../../../core/queue/tokens.js";
import { TicketProvider } from "../base.js";
import { ConfigurationService } from "../../../core/configuration/configuration.service.js";
import type { JiraWebhookPayload, JiraIssue } from "./types.js";

@Injectable()
export class JiraService extends TicketProvider {
  readonly name = "jira";
  private readonly webhookSecret: string;
  private readonly filters: TicketFilterConfiguration;

  constructor(
    configService: ConfigurationService,
    @Inject(TASK_QUEUE) private readonly taskQueue: TaskQueue,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext("jira-provider");
    const config = configService.config.ticketing.jira;
    this.webhookSecret = config.webhookSecret;
    this.filters = config.filters;
  }

  async handleWebhookRequest(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<void> {
    const rawBody = JSON.stringify(body);

    if (this.webhookSecret) {
      const signature = headers["x-hub-signature"];
      if (!signature) {
        this.logger.warn("received webhook without required x-hub-signature header");
        return;
      }
      if (!this.isValidWebhookSignature(signature, rawBody)) {
        this.logger.warn("received webhook with invalid signature");
        return;
      }
    }

    const event = this.parseWebhookPayload(body);

    if (!event) {
      return;
    }

    if (!this.passesFilters(event.ticket)) {
      this.logger.info(
        { ticketId: event.ticket.externalId },
        "ticket did not pass filters",
      );
      return;
    }

    this.logger.info(
      { ticketId: event.ticket.externalId, title: event.ticket.title },
      "accepted new ticket from Jira",
    );

    const task = {
      id: `jira-${event.ticket.externalId}-${Date.now()}`,
      ticket: event.ticket,
      status: "queued" as const,
      createdAt: new Date(),
      assessment: null,
      result: null,
      pullRequests: [],
      retriesRemaining: 0,
      errorMessage: null,
    };

    try {
      await this.taskQueue.enqueue(task);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "failed to enqueue task");
    }
  }

  async getTicket(_ticketId: string): Promise<Ticket> {
    // Future: call Jira REST API to fetch full ticket details
    throw new Error("Direct Jira ticket fetching is not yet implemented");
  }

  async addComment(_ticketId: string, _comment: string): Promise<void> {
    // Future: call Jira REST API to post a comment
    throw new Error("Jira comment posting is not yet implemented");
  }

  protected parseWebhookPayload(body: unknown): TicketEvent | null {
    const payload = body as JiraWebhookPayload;

    if (!payload.webhookEvent || !payload.issue) {
      this.logger.warn("received malformed Jira webhook payload");
      return null;
    }

    if (payload.webhookEvent !== "jira:issue_created") {
      this.logger.debug(
        { event: payload.webhookEvent },
        "ignoring non-creation Jira event",
      );
      return null;
    }

    const ticket = this.normalizeIssue(payload.issue);

    return {
      type: "created",
      ticket,
      rawPayload: body,
    };
  }

  protected isValidWebhookSignature(signature: string, body: string): boolean {
    const expectedSignature = createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");

    return signature === expectedSignature;
  }

  private normalizeIssue(issue: JiraIssue): Ticket {
    const fields = issue.fields;
    const baseUrl = issue.self.split("/rest/")[0] ?? "";

    return {
      id: issue.id,
      externalId: issue.key,
      title: fields.summary,
      description: fields.description ?? "",
      labels: fields.labels,
      assignee: fields.assignee?.displayName ?? null,
      priority: fields.priority?.name ?? null,
      issueType: fields.issuetype?.name ?? null,
      project: fields.project.key,
      url: `${baseUrl}/browse/${issue.key}`,
      provider: "jira",
      metadata: {
        jiraId: issue.id,
        statusName: fields.status?.name,
      },
    };
  }

  private passesFilters(ticket: Ticket): boolean {
    if (this.filters.projects.length > 0) {
      if (!this.filters.projects.includes(ticket.project)) {
        return false;
      }
    }

    if (this.filters.labels.length > 0) {
      const hasAllRequiredLabels = this.filters.labels.every((label) =>
        ticket.labels.includes(label)
      );
      if (!hasAllRequiredLabels) {
        return false;
      }
    }

    if (this.filters.excludeLabels.length > 0) {
      const hasExcludedLabel = this.filters.excludeLabels.some((label) =>
        ticket.labels.includes(label)
      );
      if (hasExcludedLabel) {
        return false;
      }
    }

    if (this.filters.issueTypes.length > 0) {
      if (ticket.issueType && !this.filters.issueTypes.includes(ticket.issueType)) {
        return false;
      }
    }

    if (this.filters.assignees.length > 0) {
      if (!ticket.assignee || !this.filters.assignees.includes(ticket.assignee)) {
        return false;
      }
    }

    return true;
  }
}

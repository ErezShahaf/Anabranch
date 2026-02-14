import { createHmac } from "node:crypto";
import { Inject, Injectable, NotImplementedException } from "@nestjs/common";
import { Logger } from "@nestjs/common";
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

  private readonly logger = new Logger(JiraService.name);

  constructor(
    configService: ConfigurationService,
    @Inject(TASK_QUEUE) private readonly taskQueue: TaskQueue,
  ) {
    super();
    const config = configService.config.ticketing.jira;
    this.webhookSecret = config.webhookSecret;
    this.filters = config.filters;
  }

  async handleWebhookRequest(
    _headers: Record<string, string>,
    body: JiraWebhookPayload,
  ): Promise<void> {
    const event = this.parseWebhookPayload(body);

    if (!event) {
      return;
    }

    this.logger.log(
      `accepted new ticket from Jira: ${event.ticket.externalId } - ${event.ticket.title}`,
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
      this.logger.error(`failed to enqueue task: ${message}`);
    }
  }

  async getTicket(_ticketId: string): Promise<Ticket> {
    // Could call Jira REST API GET /rest/api/3/issue/{id} for full issue.
    // Extra data vs webhook: full description, comments, attachments, custom fields, history, watchers.
    throw new NotImplementedException(
      "Direct Jira ticket fetching is not yet implemented",
    );
  }

  async addComment(_ticketId: string, _comment: string): Promise<void> {
    // Could POST to Jira REST API to add a comment (e.g. execution summary, assessment, PR links).
    throw new NotImplementedException(
      "Jira comment posting is not yet implemented",
    );
  }

  protected parseWebhookPayload(body: JiraWebhookPayload): TicketEvent | null {
    if (body.webhookEvent !== "jira:issue_created") {
      this.logger.debug(
        `ignoring non-creation Jira event: ${body.webhookEvent}`,
      );
      return null;
    }
    const ticket = this.normalizeIssue(body.issue);
    return { type: "created", ticket, rawPayload: body };
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
      title: fields.summary ?? "",
      description: fields.description ?? "",
      labels: fields.labels ?? [],
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
}

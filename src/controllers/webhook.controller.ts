import { Controller, Post, Headers, Body, UseGuards, Inject } from "@nestjs/common";
import { JiraWebhookGuard } from "../providers/ticketing/jira/jira-webhook.guard.js";
import type { JiraWebhookPayload } from "../providers/ticketing/jira/types.js";
import type { TicketProvider } from "../providers/ticketing/base.js";
import { TICKET_PROVIDER } from "../providers/ticketing/tokens.js";

@Controller("webhooks")
export class WebhookController {
  constructor(
    @Inject(TICKET_PROVIDER) private readonly ticketProvider: TicketProvider,
  ) {}

  @Post("jira")
  @UseGuards(JiraWebhookGuard)
  async handleJiraWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: JiraWebhookPayload,
  ): Promise<void> {
    await this.ticketProvider.handleWebhookRequest(headers, body);
    return;
  }
}

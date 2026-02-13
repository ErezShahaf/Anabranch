import { Controller, Post, Headers, Body } from "@nestjs/common";
import { JiraService } from "../providers/ticketing/jira/jira.service.js";

@Controller("webhooks")
export class WebhookController {
  constructor(private readonly jiraService: JiraService) {}

  @Post("jira")
  async handleJiraWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ): Promise<void> {
    await this.jiraService.handleWebhookRequest(headers, body);
    return;
  }
}

import { Module } from "@nestjs/common";
import { ConfigurationModule } from "../../core/configuration/configuration.module.js";
import { JiraService } from "./jira/jira.service.js";
import { JiraWebhookGuard } from "./jira/jira-webhook.guard.js";
import { TICKET_PROVIDER } from "./tokens.js";
import { QueueModule } from "../../core/queue/queue.module.js";

@Module({
  imports: [ConfigurationModule, QueueModule],
  providers: [
    { provide: TICKET_PROVIDER, useClass: JiraService },
    JiraWebhookGuard,
  ],
  exports: [TICKET_PROVIDER, JiraWebhookGuard],
})
export class TicketingModule {}

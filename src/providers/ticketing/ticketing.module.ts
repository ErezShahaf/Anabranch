import { Module } from "@nestjs/common";
import type { TaskQueue } from "../../core/queue/task-queue.js";
import { TASK_QUEUE } from "../../core/queue/tokens.js";
import { ConfigurationModule } from "../../core/configuration/configuration.module.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";
import { QueueModule } from "../../core/queue/queue.module.js";
import { WebhookController } from "../../controllers/webhook.controller.js";
import { JiraService } from "./jira/jira.service.js";
import { JiraWebhookGuard } from "./jira/jira-webhook.guard.js";
import { TICKET_PROVIDER } from "./tokens.js";

@Module({
  imports: [ConfigurationModule, QueueModule],
  controllers: [WebhookController],
  providers: [
    {
      provide: TICKET_PROVIDER,
      useFactory: (
        configService: ConfigurationService,
        taskQueue: TaskQueue,
      ) => new JiraService(configService, taskQueue),
      inject: [ConfigurationService, TASK_QUEUE],
    },
    JiraWebhookGuard,
  ],
  exports: [TICKET_PROVIDER, JiraWebhookGuard],
})
export class TicketingModule {}

import { Module } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TaskQueue } from "../../core/queue/task-queue.js";
import { TASK_QUEUE } from "../../core/queue/tokens.js";
import { ConfigurationModule } from "../../core/configuration/configuration.module.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";
import { LoggerModule } from "../../core/logger/logger.module.js";
import { QueueModule } from "../../core/queue/queue.module.js";
import { JiraService } from "./jira/jira.service.js";
import { JiraWebhookGuard } from "./jira/jira-webhook.guard.js";
import { TICKET_PROVIDER } from "./tokens.js";

@Module({
  imports: [ConfigurationModule, LoggerModule, QueueModule],
  providers: [
    {
      provide: TICKET_PROVIDER,
      useFactory: (
        configService: ConfigurationService,
        taskQueue: TaskQueue,
        logger: PinoLogger,
      ) => new JiraService(configService, taskQueue, logger),
      inject: [ConfigurationService, TASK_QUEUE, PinoLogger],
    },
    JiraWebhookGuard,
  ],
  exports: [TICKET_PROVIDER, JiraWebhookGuard],
})
export class TicketingModule {}

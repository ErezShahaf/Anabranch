import { Module } from "@nestjs/common";
import { ConfigurationModule } from "./core/configuration/configuration.module.js";
import { LoggerModule } from "./core/logger/logger.module.js";
import { QueueModule } from "./core/queue/queue.module.js";
import { TaskProcessorModule } from "./core/task-processor/task-processor.module.js";
import { TicketingModule } from "./providers/ticketing/ticketing.module.js";
import { HealthController } from "./controllers/health.controller.js";
import { WebhookController } from "./controllers/webhook.controller.js";

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    QueueModule,
    TaskProcessorModule,
    TicketingModule,
  ],
  controllers: [HealthController, WebhookController],
})
export class AppModule {}

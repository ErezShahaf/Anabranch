import { Module } from "@nestjs/common";
import { JiraService } from "./jira/jira.service.js";
import { QueueModule } from "../../core/queue/queue.module.js";

@Module({
  imports: [QueueModule],
  providers: [JiraService],
  exports: [JiraService],
})
export class TicketingModule {}

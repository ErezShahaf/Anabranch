import { Module } from "@nestjs/common";
import { TaskProcessorService } from "./task-processor.service.js";
import { QueueModule } from "../queue/queue.module.js";
import { OrchestratorModule } from "../orchestrator/orchestrator.module.js";
import { LoggerModule } from "../logger/logger.module.js";

@Module({
  imports: [LoggerModule, QueueModule, OrchestratorModule],
  providers: [TaskProcessorService],
})
export class TaskProcessorModule {}

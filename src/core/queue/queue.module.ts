import { Module } from "@nestjs/common";
import { LoggerModule } from "../logger/logger.module.js";
import { InMemoryTaskQueue } from "./in-memory-task-queue.js";
import { TASK_QUEUE } from "./tokens.js";

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: TASK_QUEUE,
      useClass: InMemoryTaskQueue,
    },
  ],
  exports: [TASK_QUEUE],
})
export class QueueModule {}

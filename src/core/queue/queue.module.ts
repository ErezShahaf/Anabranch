import { Module } from "@nestjs/common";
import { InMemoryTaskQueue } from "./in-memory-task-queue.js";
import { TASK_QUEUE } from "./tokens.js";

@Module({
  imports: [],
  providers: [
    {
      provide: TASK_QUEUE,
      useClass: InMemoryTaskQueue,
    },
  ],
  exports: [TASK_QUEUE],
})
export class QueueModule {}

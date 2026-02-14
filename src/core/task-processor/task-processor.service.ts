import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TaskQueue } from "../queue/task-queue.js";
import { TASK_QUEUE } from "../queue/tokens.js";
import { TaskOrchestrator } from "../orchestrator/base.js";

@Injectable()
export class TaskProcessorService implements OnModuleInit {
  private processing = false;

  constructor(
    @Inject(TASK_QUEUE) private readonly taskQueue: TaskQueue,
    private readonly orchestrator: TaskOrchestrator,
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit(): void {
    this.taskQueue.registerOnEnqueuedCallback(() => this.processNext());
    this.logger.info(
      { orchestrator: this.orchestrator.name },
      "task processor started, listening for tasks",
    );
  }

  private async processNext(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      let task = this.taskQueue.dequeue();

      while (task !== null) {
        this.logger.info(
          { taskId: task.id, ticketId: task.ticket.externalId },
          "processing task",
        );

        try {
          await this.orchestrator.handleTask(task);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(
            { taskId: task.id, error: message },
            "task processing failed with unexpected error",
          );
        }

        task = this.taskQueue.dequeue();
      }
    } finally {
      this.processing = false;
    }
  }
}

import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { TaskQueue } from "../queue/task-queue.js";
import { TASK_QUEUE } from "../queue/tokens.js";
import type { TaskOrchestrator } from "../orchestrator/base.js";
import { TASK_ORCHESTRATOR } from "../orchestrator/tokens.js";

@Injectable()
export class TaskProcessorService implements OnModuleInit {
  private processing = false;
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(
    @Inject(TASK_QUEUE) private readonly taskQueue: TaskQueue,
    @Inject(TASK_ORCHESTRATOR) private readonly orchestrator: TaskOrchestrator,
  ) {}

  onModuleInit(): void {
    this.taskQueue.registerOnEnqueuedCallback(() => this.processNext());
    this.logger.log(
      `task processor started, listening for tasks`,
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
        this.logger.log(
          `processing task ${task.id} (ticket: ${task.ticket.externalId})`,
        );

        try {
          await this.orchestrator.handleTask(task);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `task processing failed for ${task.id}: ${message}`,
          );
        }

        task = this.taskQueue.dequeue();
      }
    } finally {
      this.processing = false;
    }
  }
}

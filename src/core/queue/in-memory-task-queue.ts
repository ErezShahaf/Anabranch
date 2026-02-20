import { Injectable, Logger } from "@nestjs/common";
import type { TicketTask } from "./types.js";
import type { TaskQueue } from "./task-queue.js";

@Injectable()
export class InMemoryTaskQueue implements TaskQueue {
  private readonly logger = new Logger("task-queue");
  private readonly pendingTasks: TicketTask[] = [];
  private enqueuedCallback: (() => void) | null = null;

  async enqueue(task: TicketTask): Promise<void> {
    this.pendingTasks.push(task);
    this.logger.log(
      { taskId: task.id, ticketId: task.ticket.externalId },
      "task enqueued"
    );
    this.enqueuedCallback?.();
  }

  dequeue(): TicketTask | null {
    return this.pendingTasks.shift() ?? null;
  }

  registerOnEnqueuedCallback(callback: () => void): void {
    this.enqueuedCallback = callback;
  }
}

import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { TicketTask } from "./types.js";
import type { TaskQueue } from "./task-queue.js";

// temporary until a real task queue is implemented for horizontal scaling support
@Injectable()
export class InMemoryTaskQueue implements TaskQueue {
  private readonly pendingTasks: TicketTask[] = [];
  private enqueuedCallback: (() => void) | null = null;

  constructor(private readonly logger: PinoLogger) {}

  async enqueue(task: TicketTask): Promise<void> {
    this.pendingTasks.push(task);
    this.logger.info(
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

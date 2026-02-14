import { Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { TicketTask } from "./types.js";
import type { TaskQueue } from "./task-queue.js";

// temporary until a real task queue is implemented for horizontal scaling support
@Injectable()
export class InMemoryTaskQueue implements TaskQueue {
  private readonly pendingTasks: TicketTask[] = [];
  private enqueuedCallback: (() => void) | null = null;
  private readonly logger = new Logger(InMemoryTaskQueue.name);

  async enqueue(task: TicketTask): Promise<void> {
    this.pendingTasks.push(task);
    this.logger.log(`task enqueued: ${task.id} (ticket: ${task.ticket.externalId})`);
    this.enqueuedCallback?.();
  }

  dequeue(): TicketTask | null {
    return this.pendingTasks.shift() ?? null;
  }

  registerOnEnqueuedCallback(callback: () => void): void {
    this.enqueuedCallback = callback;
  }
}

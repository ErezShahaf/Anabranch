import type { TicketTask } from "../types.js";

export interface TaskQueue {
  enqueue(task: TicketTask): Promise<void>;
  dequeue(): TicketTask | null;
  onEnqueued(callback: () => void): void;
}

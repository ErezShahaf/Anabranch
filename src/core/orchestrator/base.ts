import type { TicketTask } from "../types.js";

export abstract class TaskOrchestrator {
  abstract readonly name: string;
  abstract handleTask(task: TicketTask): Promise<void>;
}

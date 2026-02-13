import type { TicketTask } from "../queue/types.js";

export abstract class TaskOrchestrator {
  abstract readonly name: string;
  abstract handleTask(task: TicketTask): Promise<void>;
}

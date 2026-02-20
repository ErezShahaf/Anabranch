import type { TicketEvent, Ticket } from "./types.js";

export abstract class TicketProvider {
  abstract readonly name: string;

  abstract handleWebhookRequest(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<void>;

  abstract getTicket(ticketId: string): Promise<Ticket>;

  abstract addComment(ticketId: string, comment: string): Promise<void>;

  protected abstract parseWebhookPayload(body: unknown): TicketEvent | null;

  protected abstract isValidWebhookSignature(
    signature: string,
    body: string
  ): boolean;
}

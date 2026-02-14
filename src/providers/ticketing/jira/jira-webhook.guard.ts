import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac } from "node:crypto";

function isJiraWebhookValid(
  signature: string,
  rawBody: string,
  webhookSecret: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return signature === `sha256=${expected}`;
}

@Injectable()
export class JiraWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      body: unknown;
      headers: Record<string, string>;
    }>();
    const body = request.body;
    const rawBody = JSON.stringify(body);
    const signature = request.headers["x-hub-signature"] ?? "";
    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET ?? "";

    if (!isJiraWebhookValid(signature, rawBody, webhookSecret)) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    return true;
  }
}

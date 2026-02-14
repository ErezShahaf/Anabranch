import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac } from "node:crypto";
import { ConfigurationService } from "../../../core/configuration/configuration.service.js";

function isJiraWebhookValid(
  signature: string,
  rawBody: string,
  webhookSecret: string,
): boolean {
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return signature === expected;
}

@Injectable()
export class JiraWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigurationService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      body: unknown;
      headers: Record<string, string>;
    }>();
    const body = request.body;
    const rawBody = JSON.stringify(body);
    const signature = request.headers["x-hub-signature"] ?? "";
    const webhookSecret = this.configService.config.ticketing.jira.webhookSecret;

    if (!isJiraWebhookValid(signature, rawBody, webhookSecret)) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    return true;
  }
}

import { Module } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { CodingAgent } from "./base.js";
import { ClaudeCodeAgent } from "./claude-code/agent.js";
import { CursorAgent } from "./cursor/agent.js";
import { AnthropicService } from "./claude-code/anthropic.service.js";
import { CODING_AGENT } from "./tokens.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";

@Module({
  providers: [
    {
      provide: CODING_AGENT,
      useFactory: (configService: ConfigurationService): CodingAgent => {
        switch (configService.config.agent.provider) {
          case "claude-code": {
            const anthropic = new AnthropicService(
              configService.config.agent.apiKey,
            );
            return new ClaudeCodeAgent(anthropic, new Logger("ClaudeCodeAgent"));
          }
          case "cursor":
            return new CursorAgent(
              new Logger("CursorAgent"),
              configService.config.agent.apiKey,
            );
          default: {
            const exhaustiveCheck: never = configService.config.agent.provider;
            throw new Error(`Unknown agent provider: ${exhaustiveCheck}`);
          }
        }
      },
      inject: [ConfigurationService],
    },
  ],
  exports: [CODING_AGENT],
})
export class AgentsModule {}

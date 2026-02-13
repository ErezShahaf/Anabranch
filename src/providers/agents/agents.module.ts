import { Module } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { CodingAgent } from "./base.js";
import { ClaudeCodeAgent } from "./claude-code/agent.js";
import { CursorAgent } from "./cursor/agent.js";
import { AnthropicService } from "./claude-code/anthropic.service.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";

@Module({
  providers: [
    {
      provide: CodingAgent,
      useFactory: (configService: ConfigurationService, logger: PinoLogger) => {
        switch (configService.config.agent.provider) {
          case "claude-code": {
            const anthropic = new AnthropicService(configService.config.agent.apiKey);
            return new ClaudeCodeAgent(anthropic, logger.logger);
          }
          case "cursor":
            return new CursorAgent(logger.logger, configService.config.agent.apiKey);
          default: {
            const exhaustiveCheck: never = configService.config.agent.provider;
            throw new Error(`Unknown agent provider: ${exhaustiveCheck}`);
          }
        }
      },
      inject: [ConfigurationService, PinoLogger],
    },
  ],
  exports: [CodingAgent],
})
export class AgentsModule {}

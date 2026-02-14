import { Module } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { SourceControlProvider } from "./base.js";
import { GitHubProvider } from "./github/provider.js";
import { SOURCE_CONTROL_PROVIDER } from "./tokens.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";

@Module({
  providers: [
    {
      provide: SOURCE_CONTROL_PROVIDER,
      useFactory: (
        configService: ConfigurationService,
        logger: PinoLogger,
      ): SourceControlProvider => {
        return new GitHubProvider(
          configService.config.sourceControl.github,
          logger.logger,
        );
      },
      inject: [ConfigurationService, PinoLogger],
    },
  ],
  exports: [SOURCE_CONTROL_PROVIDER],
})
export class SourceControlModule {}

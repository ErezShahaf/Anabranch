import { Module } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { SourceControlProvider } from "./base.js";
import { GitHubProvider } from "./github/provider.js";
import { ConfigurationService } from "../../core/configuration/configuration.service.js";

@Module({
  providers: [
    {
      provide: SourceControlProvider,
      useFactory: (configService: ConfigurationService, logger: PinoLogger) => {
        return new GitHubProvider(
          configService.config.sourceControl.github,
          logger.logger,
        );
      },
      inject: [ConfigurationService, PinoLogger],
    },
  ],
  exports: [SourceControlProvider],
})
export class SourceControlModule {}

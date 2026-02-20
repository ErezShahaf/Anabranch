import { Module } from "@nestjs/common";
import { Logger } from "@nestjs/common";
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
      ): SourceControlProvider => {
        return new GitHubProvider(
          configService.config.sourceControl.github,
          new Logger("GitHubProvider"),
        );
      },
      inject: [ConfigurationService],
    },
  ],
  exports: [SOURCE_CONTROL_PROVIDER],
})
export class SourceControlModule {}

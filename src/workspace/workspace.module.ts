import { Module } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { WorkspaceManager } from "./manager.js";
import type { SourceControlProvider } from "../providers/source-control/base.js";
import { SourceControlModule } from "../providers/source-control/source-control.module.js";
import { SOURCE_CONTROL_PROVIDER } from "../providers/source-control/tokens.js";
import { LoggerModule } from "../core/logger/logger.module.js";
import { ConfigurationModule } from "../core/configuration/configuration.module.js";
import { ConfigurationService } from "../core/configuration/configuration.service.js";

@Module({
  imports: [ConfigurationModule, LoggerModule, SourceControlModule],
  providers: [
    {
      provide: WorkspaceManager,
      useFactory: (
        configService: ConfigurationService,
        sourceControl: SourceControlProvider,
        logger: PinoLogger,
      ) => new WorkspaceManager(configService, sourceControl, logger),
      inject: [ConfigurationService, SOURCE_CONTROL_PROVIDER, PinoLogger],
    },
  ],
  exports: [WorkspaceManager],
})
export class WorkspaceModule {}

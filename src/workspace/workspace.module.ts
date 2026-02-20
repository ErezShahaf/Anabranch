import { Module } from "@nestjs/common";
import { WorkspaceManager } from "./manager.js";
import { WORKSPACE_MANAGER } from "./tokens.js";
import type { SourceControlProvider } from "../providers/source-control/base.js";
import { SourceControlModule } from "../providers/source-control/source-control.module.js";
import { SOURCE_CONTROL_PROVIDER } from "../providers/source-control/tokens.js";
import { ConfigurationModule } from "../core/configuration/configuration.module.js";
import { ConfigurationService } from "../core/configuration/configuration.service.js";

@Module({
  imports: [ConfigurationModule, SourceControlModule],
  providers: [
    {
      provide: WorkspaceManager,
      useFactory: (
        configService: ConfigurationService,
        sourceControl: SourceControlProvider,
      ) => new WorkspaceManager(configService, sourceControl),
      inject: [ConfigurationService, SOURCE_CONTROL_PROVIDER],
    },
    { provide: WORKSPACE_MANAGER, useExisting: WorkspaceManager },
  ],
  exports: [WorkspaceManager, WORKSPACE_MANAGER],
})
export class WorkspaceModule {}

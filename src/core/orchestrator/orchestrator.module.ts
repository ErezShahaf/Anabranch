import { Module } from "@nestjs/common";
import { TaskOrchestrator } from "./base.js";
import { OrchestratorV1 } from "./orchestrator-v1.js";
import { AssessmentService } from "./assessment.service.js";
import { ExecutionService } from "./execution.service.js";
import { PullRequestService } from "./pull-request.service.js";
import { AgentsModule } from "../../providers/agents/agents.module.js";
import { SourceControlModule } from "../../providers/source-control/source-control.module.js";
import { WorkspaceModule } from "../../workspace/workspace.module.js";
import { ConfigurationService } from "../configuration/configuration.service.js";

@Module({
  imports: [AgentsModule, SourceControlModule, WorkspaceModule],
  providers: [
    AssessmentService,
    ExecutionService,
    PullRequestService,
    OrchestratorV1,
    {
      provide: TaskOrchestrator,
      useFactory: (configService: ConfigurationService, defaultOrchestrator: OrchestratorV1) => {
        switch (configService.config.orchestrator.provider) {
          case "default":
            return defaultOrchestrator;
          default: {
            const exhaustiveCheck: never = configService.config.orchestrator.provider;
            throw new Error(`Unknown orchestrator provider: ${exhaustiveCheck}`);
          }
        }
      },
      inject: [ConfigurationService, OrchestratorV1],
    },
  ],
  exports: [TaskOrchestrator],
})
export class OrchestratorModule {}

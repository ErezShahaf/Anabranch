import { Module } from "@nestjs/common";
import type { CodingAgent } from "../../providers/agents/base.js";
import { CODING_AGENT } from "../../providers/agents/tokens.js";
import { ASSESSMENT_SERVICE, EXECUTION_SERVICE, TASK_ORCHESTRATOR } from "./tokens.js";
import { OrchestratorV1 } from "./orchestrator-v1.js";
import { AssessmentService } from "./assessment.service.js";
import { ExecutionService } from "./execution.service.js";
import { PullRequestService } from "./pull-request.service.js";
import { AgentsModule } from "../../providers/agents/agents.module.js";
import { SourceControlModule } from "../../providers/source-control/source-control.module.js";
import { WorkspaceModule } from "../../workspace/workspace.module.js";
import { ConfigurationModule } from "../configuration/configuration.module.js";
import { ConfigurationService } from "../configuration/configuration.service.js";
import { WorkspaceManager } from "../../workspace/manager.js";

@Module({
  imports: [
    ConfigurationModule,
    AgentsModule,
    SourceControlModule,
    WorkspaceModule,
  ],
  providers: [
    {
      provide: ASSESSMENT_SERVICE,
      useClass: AssessmentService,
    },
    {
      provide: EXECUTION_SERVICE,
      useFactory: (
        codingAgent: CodingAgent,
        workspaceManager: WorkspaceManager,
        pullRequestService: PullRequestService,
        configService: ConfigurationService,
      ) =>
        new ExecutionService(
          codingAgent,
          workspaceManager,
          pullRequestService,
          configService,
        ),
      inject: [CODING_AGENT, WorkspaceManager, PullRequestService, ConfigurationService],
    },
    PullRequestService,
    OrchestratorV1,
    {
      provide: TASK_ORCHESTRATOR,
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
  exports: [TASK_ORCHESTRATOR],
})
export class OrchestratorModule {}

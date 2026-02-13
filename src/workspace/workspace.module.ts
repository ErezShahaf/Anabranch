import { Module } from "@nestjs/common";
import { WorkspaceManager } from "./manager.js";
import { SourceControlModule } from "../providers/source-control/source-control.module.js";

@Module({
  imports: [SourceControlModule],
  providers: [WorkspaceManager],
  exports: [WorkspaceManager],
})
export class WorkspaceModule {}

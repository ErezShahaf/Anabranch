import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { AssessedTicketTask } from "../queue/types.js";
import type { Repository, PullRequest } from "../../providers/source-control/types.js";
import { SourceControlProvider } from "../../providers/source-control/base.js";
import { WorkspaceManager } from "../../workspace/manager.js";

@Injectable()
export class PullRequestService {
  constructor(
    private readonly sourceControl: SourceControlProvider,
    private readonly workspaceManager: WorkspaceManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("pull-request");
  }

  async createPullRequestsForRepositories(
    task: AssessedTicketTask,
    repositories: Repository[],
    worktreePaths: Map<string, string>,
  ): Promise<PullRequest[]> {
    const ticketId = task.ticket.externalId;
    const branchName = `anabranch/${ticketId}`;
    const createdPullRequests: PullRequest[] = [];

    for (const repository of repositories) {
      const worktreePath = worktreePaths.get(repository.fullName)!;
      const hasChanges = await this.workspaceManager.hasBranchDiverged(
        worktreePath,
        repository.defaultBranch,
      );

      if (!hasChanges) {
        continue;
      }

      await this.sourceControl.pushBranch(worktreePath, branchName);

      const [owner, repositoryName] = repository.fullName.split("/") as [string, string];
      const pullRequest = await this.sourceControl.createPullRequest({
        owner,
        repositoryName,
        title: `[Anabranch] ${task.ticket.title}`,
        body: this.buildPullRequestBody(task, createdPullRequests),
        headBranch: branchName,
        baseBranch: repository.defaultBranch,
      });

      createdPullRequests.push(pullRequest);
      this.logger.info(
        { ticketId, repository: repository.fullName, pullRequestUrl: pullRequest.url },
        "pull request created",
      );
    }

    return createdPullRequests;
  }

  buildPullRequestBody(
    task: AssessedTicketTask,
    siblingPullRequests: PullRequest[],
  ): string {
    const assessment = task.assessment;
    const sections: string[] = [];

    sections.push(`## Ticket`);
    sections.push(`- **ID**: ${task.ticket.externalId}`);
    sections.push(`- **Title**: ${task.ticket.title}`);
    if (task.ticket.url) {
      sections.push(`- **Link**: ${task.ticket.url}`);
    }

    sections.push("");
    sections.push(`## Assessment`);
    sections.push(`- **Confidence**: ${assessment.confidence}/100`);
    sections.push(`- **Scope**: ${assessment.scope}`);
    sections.push(`- **Reasoning**: ${assessment.reasoning}`);

    if (assessment.riskFactors.length > 0) {
      sections.push(`- **Risk Factors**: ${assessment.riskFactors.join(", ")}`);
    }

    if (siblingPullRequests.length > 0) {
      sections.push("");
      sections.push(`## Related Pull Requests`);
      for (const sibling of siblingPullRequests) {
        sections.push(`- ${sibling.url}`);
      }
    }

    sections.push("");
    sections.push("---");
    sections.push("*This pull request was created automatically by [Anabranch](https://github.com/ErezShahaf/Anabranch).*");

    return sections.join("\n");
  }
}

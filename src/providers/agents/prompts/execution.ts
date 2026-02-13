import type { Ticket } from "../../ticketing/types.js";
import type { AssessmentResult } from "../../../core/orchestrator/types.js";

export function buildExecutionPrompt(
  ticket: Ticket,
  assessment: AssessmentResult,
  workDirectories: string[]
): string {
  const directoryList = workDirectories
    .map((directory) => `  - ${directory}`)
    .join("\n");

  return `You are an autonomous coding agent. Your job is to implement the following
task completely and correctly.

TASK:
  ID: ${ticket.externalId}
  Title: ${ticket.title}
  Description:
${indentBlock(ticket.description, 4)}

PRIOR ASSESSMENT:
  Scope: ${assessment.scope}
  Confidence: ${assessment.confidence}/100
  Reasoning: ${assessment.reasoning}
  Affected Repositories: ${assessment.affectedRepositories.join(", ")}

WORKING DIRECTORIES (one per affected repository):
${directoryList}

RULES:
1. Make only the changes necessary to complete the task. Do not refactor
   unrelated code.
2. Follow the existing code style and conventions in each repository.
3. If the repository has tests, make sure your changes do not break them.
4. Write tests for new functionality if the repository has an existing
   test suite.
5. Create clear, descriptive commit messages.
6. If at any point you realize the task is more complex than expected,
   stop and explain why rather than making a guess.

WORKFLOW:
1. Explore the relevant parts of the codebase to understand the context.
2. Implement the changes.
3. Review your own changes for correctness.
4. Commit all changes with a clear message referencing the ticket ID.

When you are done, output a brief summary of what you changed and why.`;
}

function indentBlock(text: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

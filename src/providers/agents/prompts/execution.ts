import type { Ticket } from "../../ticketing/types.js";
import type { AssessmentResult } from "../../../core/orchestrator/types.js";

export function buildExecutionPrompt(
  ticket: Ticket,
  assessment: AssessmentResult | null,
  workDirectories: string[]
): string {
  const directoryList = workDirectories
    .map((directory) => `  - ${directory}`)
    .join("\n");

  const assessmentSection = assessment
    ? `
PRIOR ASSESSMENT:
  Scope: ${assessment.scope}
  Confidence: ${assessment.confidence}/100
  Reasoning: ${assessment.reasoning}
  Affected Repositories: ${assessment.affectedRepositories.join(", ")}
`
    : "";

  return `You are an autonomous coding agent. Your job is to implement the following
task completely and correctly.

TASK:
  ID: ${ticket.externalId}
  Title: ${ticket.title}
  Description:
${indentBlock(ticket.description, 4)}
${assessmentSection}
WORKING DIRECTORIES (one per affected repository):
${directoryList}

RULES:
1. Make only the changes necessary to complete the task. Do not refactor
   unrelated code.
2. Follow the existing code style and conventions in each repository.
3. If the repository has tests, make sure your changes do not break them.
4. Write tests for new functionality if the repository has an existing
   test suite.
5. Do NOT run git add, git commit, or any git commands. Only make file edits.
   We will commit your changes automatically.
6. IMPORTANT: You are a highly capable AI agent. You should feel confident
   tackling complex tasks and making implementation decisions. However, if
   the task description is fundamentally ambiguous or could mean several
   completely different things, you MUST abort the work.

TASK CLARITY VALIDATION:
Before starting work, evaluate if the task is clear enough to implement:
- If the task is descriptive enough to know what needs to be done, proceed
  with confidence and do high-quality, complete work.
- If the task is vague but context from the codebase makes it clear, proceed.
- If the task is so ambiguous that it could mean multiple completely different
  things (e.g., "improve the system" without specifics), ABORT and explain why.

WORKFLOW:
1. Explore the relevant parts of the codebase to understand the context.
2. Validate that the task is clear enough to proceed. If not, stop here.
3. Implement the changes with confidence and completeness.
4. Review your own changes for correctness.
5. Do NOT commit. Output a brief summary of what you changed and why.
6. At the end, you MUST output a JSON block indicating whether a PR should be
   created. Use this exact format on a single line at the very end:

   {"shouldCreatePR": true}

   Or if the task was too ambiguous to complete:

   {"shouldCreatePR": false, "skipReason": "<explain what information is missing or ambiguous>"}`;
}

function indentBlock(text: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

import type { Ticket } from "../../ticketing/types.js";
import type { Repository } from "../../source-control/types.js";

export function buildAssessmentPrompt(
  ticket: Ticket,
  repositories: Repository[]
): string {
  const repositoryManifest = repositories
    .map((repository) => {
      const description = repository.description
        ? ` - ${repository.description}`
        : "";
      return `  - ${repository.fullName}${description}`;
    })
    .join("\n");

  return `You are a senior engineer evaluating whether a task from a ticketing system
can be safely completed by an autonomous AI coding agent.

Be CONSERVATIVE. When in doubt, err on the side of saying the task is too
complex. It is far better to skip a task than to produce broken or
architecturally harmful code.

TASK:
  ID: ${ticket.externalId}
  Title: ${ticket.title}
  Description:
${indentBlock(ticket.description, 4)}

AVAILABLE REPOSITORIES:
${repositoryManifest}

INSTRUCTIONS:
1. Read the task carefully and understand what is being asked.
2. Determine which repositories are likely affected.
3. Consider whether the task requires architectural decisions that could
   constrain future development.
4. Consider whether a wrong approach would create tech debt that is hard
   to reverse.

Respond with ONLY the following JSON object, no other text:

{
  "confidence": <number 0 to 100>,
  "scope": "<trivial|small|medium|large|architectural>",
  "riskFactors": [<list of strings>],
  "decisionsRequired": [<list of strings>],
  "estimatedFiles": <number>,
  "affectedRepositories": [<list of full repository names>],
  "reasoning": "<2 to 3 sentence explanation>"
}

CONFIDENCE CALIBRATION:
  90-100  The path is obvious. I have seen tasks exactly like this before.
  70-89   Fairly confident, but there may be edge cases.
  50-69   Significant uncertainty. Multiple valid approaches exist.
  Below 50  Major unknowns. A human should decide the approach.

SCOPE DEFINITIONS:
  trivial        Config changes, typo fixes, log additions, constant updates.
  small          Add a field, write a test, simple feature with a clear spec.
  medium         New endpoint, new component, module refactoring.
  large          Cross-cutting changes, new service, database migrations.
  architectural  Sets precedents, introduces patterns, constrains future options.`;
}

function indentBlock(text: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

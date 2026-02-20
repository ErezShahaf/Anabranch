import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Logger } from "@nestjs/common";
import type { Ticket } from "../../ticketing/types.js";
import type { AssessmentResult } from "../../../core/orchestrator/types.js";
import type { AgentResult } from "../types.js";
import type { AgentConfiguration } from "../../../core/configuration/types.js";
import type { Repository } from "../../source-control/types.js";
import { CodingAgent } from "../base.js";
import { buildAssessmentPrompt } from "../prompts/assessment.js";
import { buildExecutionPrompt } from "../prompts/execution.js";
import { DEFAULT_ASSESSMENT_OPTIONS } from "./default-assessment-options.js";
import { DEFAULT_EXECUTION_OPTIONS } from "./default-execution-options.js";
import type { AnthropicService } from "./anthropic.service.js";
import { validateAssessmentResult } from "../../../core/orchestrator/assessment-result.schema.js";
import { extractClaudeQueryResult, type ClaudeQueryResult } from "./claude-query.util.js";

export class ClaudeCodeAgent extends CodingAgent {
  readonly name = "claude-code";
  private readonly apiKey: string;
  private readonly anthropicService: AnthropicService;
  private readonly logger: Logger;

  constructor(apiKey: string, anthropicService: AnthropicService, logger: Logger) {
    super();
    this.apiKey = apiKey;
    this.anthropicService = anthropicService;
    this.logger = logger;
  }

  async healthCheck(): Promise<boolean> {
    return this.anthropicService.healthCheck();
  }

  private async runQuery(
    prompt: string,
    ticketId: string,
    options: {
      additionalDirectories?: string[];
      assessment?: boolean;
      cwd?: string;
      canUseTool?: (toolName: string, input: Record<string, unknown>) => Promise<
        | { behavior: "allow" }
        | { behavior: "deny"; message: string; interrupt?: boolean }
      >;
    } = {}
  ): Promise<ClaudeQueryResult & { success: true }> {
    const { additionalDirectories, assessment = false, cwd, canUseTool } = options;
    const defaultOptions = assessment ? DEFAULT_ASSESSMENT_OPTIONS : DEFAULT_EXECUTION_OPTIONS;

    const result = query({
      prompt,
      options: {
        ...defaultOptions,
        ...(additionalDirectories && { additionalDirectories }),
        ...(cwd && { cwd }),
        ...(canUseTool && { canUseTool }),
        env: { ANTHROPIC_API_KEY: this.apiKey },
      },
    });

    const extracted = await extractClaudeQueryResult(result);

    if (!extracted.success) {
      const errorMessage =
        extracted.error ?? "Claude Code returned no result";
      this.logger.error(`${assessment ? "Assessment" : "Execution"} failed for ${ticketId}: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return extracted as ClaudeQueryResult & { success: true };
  }

  async assess(
    ticket: Ticket,
    repositories: Repository[]
  ): Promise<AssessmentResult> {
    const prompt = buildAssessmentPrompt(ticket, repositories);

    this.logger.log(`running assessment with Claude Code for ${ticket.externalId}`);

    const extracted = await this.runQuery(prompt, ticket.externalId, { assessment: true });

    const rawAssessment = extracted.structuredOutput as unknown;
    const assessmentData = validateAssessmentResult(rawAssessment);

    this.logger.log(
      `assessment complete for ${ticket.externalId} (confidence: ${assessmentData.confidence}, scope: ${assessmentData.scope})`,
    );

    return assessmentData;
  }

  async execute(
    ticket: Ticket,
    workDirectories: string[],
    assessment: AssessmentResult,
    _configuration: AgentConfiguration
  ): Promise<AgentResult> {
    const prompt = buildExecutionPrompt(ticket, assessment, workDirectories);

    this.logger.log(`running execution with Claude Code for ${ticket.externalId}`);

    const extracted = await this.runQuery(prompt, ticket.externalId, {
      additionalDirectories: workDirectories,
      assessment: false,
      cwd: workDirectories[0],
      canUseTool: async (toolName: string, input: Record<string, unknown>) => {
        if (toolName === "Bash" && typeof input.command === "string") {
          if (/git\s+(add|commit)/i.test(input.command)) {
            return {
              behavior: "deny" as const,
              message: "Do not run git add or git commit. We will commit your changes automatically.",
            };
          }
        }
        return { behavior: "allow" as const };
      },
    });

    this.logger.log(`execution complete for ${ticket.externalId}`);

    return {
      success: true,
      filesChanged: [],
      summary: extracted.result ?? "",
      testsPassed: null,
      costInDollars: extracted.totalCostUsd,
    };
  }
}

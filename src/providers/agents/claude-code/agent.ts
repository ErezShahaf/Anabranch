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

export class ClaudeCodeAgent extends CodingAgent {
  readonly name = "claude-code";
  private readonly anthropicService: AnthropicService;
  private readonly logger: Logger;

  constructor(anthropicService: AnthropicService, logger: Logger) {
    super();
    this.anthropicService = anthropicService;
    this.logger = logger;
  }

  async healthCheck(): Promise<boolean> {
    return this.anthropicService.healthCheck();
  }

  async assess(
    ticket: Ticket,
    repositories: Repository[]
  ): Promise<AssessmentResult> {
    const prompt = buildAssessmentPrompt(ticket, repositories);

    this.logger.log(`running assessment with Claude Code for ${ticket.externalId}`);

    const result = query({
      prompt,
      options: DEFAULT_ASSESSMENT_OPTIONS,
    });

    let rawAssessment: unknown = null;
    let totalCost = 0;

    for await (const message of result) {
      if (message.type === "result" && message.subtype === "success") {
        totalCost = message.total_cost_usd;

        if (message.structured_output) {
          rawAssessment = message.structured_output;
        } else {
          rawAssessment = this.parseAssessmentFromText(message.result);
        }
      }

      if (message.type === "result" && message.subtype !== "success") {
        const errorMessage = "errors" in message ? message.errors.join("; ") : "unknown error";
        throw new Error(`Claude Code assessment failed: ${errorMessage}`);
      }
    }

    if (rawAssessment === null) {
      throw new Error("Claude Code returned no assessment result");
    }

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


    const result = query({
      prompt,
      options: {
        ...DEFAULT_EXECUTION_OPTIONS,
        additionalDirectories: workDirectories,
      },
    });

    let summary = "";
    let totalCost = 0;
    let success = false;

    for await (const message of result) {
      if (message.type === "result" && message.subtype === "success") {
        summary = message.result;
        totalCost = message.total_cost_usd;
        success = true;
      }

      if (message.type === "result" && message.subtype !== "success") {
        const errorMessage = "errors" in message ? message.errors.join("; ") : "unknown error";
        summary = `Execution failed: ${errorMessage}`;
        success = false;
      }
    }

    this.logger.log(`execution complete for ${ticket.externalId} (success: ${success})`);

    return {
      success,
      filesChanged: [],
      summary,
      testsPassed: null,
      costInDollars: totalCost,
    };
  }

  private parseAssessmentFromText(text: string): unknown {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in Claude Code assessment response");
    }

    return JSON.parse(jsonMatch[0]) as unknown;
  }
}

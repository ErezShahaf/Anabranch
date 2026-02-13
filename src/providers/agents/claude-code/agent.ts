import { query } from "@anthropic-ai/claude-agent-sdk";
import type pino from "pino";
import type {
  Ticket,
  AssessmentResult,
  AgentResult,
  AgentConfiguration,
  Repository,
} from "../../../core/types.js";
import { CodingAgent } from "../base.js";
import { buildAssessmentPrompt } from "../prompts/assessment.js";
import { buildExecutionPrompt } from "../prompts/execution.js";

const ASSESSMENT_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    confidence: { type: "number" as const },
    scope: {
      type: "string" as const,
      enum: ["trivial", "small", "medium", "large", "architectural"],
    },
    riskFactors: { type: "array" as const, items: { type: "string" as const } },
    decisionsRequired: { type: "array" as const, items: { type: "string" as const } },
    estimatedFiles: { type: "number" as const },
    affectedRepositories: { type: "array" as const, items: { type: "string" as const } },
    reasoning: { type: "string" as const },
  },
  required: [
    "confidence",
    "scope",
    "riskFactors",
    "decisionsRequired",
    "estimatedFiles",
    "affectedRepositories",
    "reasoning",
  ],
};

export class ClaudeCodeAgent extends CodingAgent {
  readonly name = "claude-code";
  private readonly logger: pino.Logger;

  constructor(logger: pino.Logger) {
    super();
    this.logger = logger.child({ component: "claude-code-agent" });
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env["ANTHROPIC_API_KEY"];
  }

  async assess(
    ticket: Ticket,
    repositories: Repository[]
  ): Promise<AssessmentResult> {
    const prompt = buildAssessmentPrompt(ticket, repositories);

    this.logger.info(
      { ticketId: ticket.externalId },
      "running assessment with Claude Code"
    );

    const result = query({
      prompt,
      options: {
        permissionMode: "plan",
        tools: ["Read", "Glob", "Grep"],
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: "You are assessing a ticket for autonomous implementation. Do not make any changes.",
        },
        outputFormat: {
          type: "json_schema",
          schema: ASSESSMENT_JSON_SCHEMA,
        },
        maxTurns: 20,
      },
    });

    let assessmentData: AssessmentResult | null = null;
    let totalCost = 0;

    for await (const message of result) {
      if (message.type === "result" && message.subtype === "success") {
        totalCost = message.total_cost_usd;

        if (message.structured_output) {
          assessmentData = message.structured_output as AssessmentResult;
        } else {
          assessmentData = this.parseAssessmentFromText(message.result);
        }
      }

      if (message.type === "result" && message.subtype !== "success") {
        const errorMessage = "errors" in message ? message.errors.join("; ") : "unknown error";
        throw new Error(`Claude Code assessment failed: ${errorMessage}`);
      }
    }

    if (!assessmentData) {
      throw new Error("Claude Code returned no assessment result");
    }

    this.logger.info(
      {
        ticketId: ticket.externalId,
        confidence: assessmentData.confidence,
        scope: assessmentData.scope,
        costInDollars: totalCost,
      },
      "assessment complete"
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

    this.logger.info(
      {
        ticketId: ticket.externalId,
        workDirectories,
      },
      "running execution with Claude Code"
    );

    const primaryWorkDirectory = workDirectories[0] ?? process.cwd();

    const result = query({
      prompt,
      options: {
        cwd: primaryWorkDirectory,
        additionalDirectories: workDirectories.slice(1),
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        tools: { type: "preset", preset: "claude_code" },
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
        },
        maxTurns: 50,
        maxBudgetUsd: 5,
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

    this.logger.info(
      {
        ticketId: ticket.externalId,
        success,
        costInDollars: totalCost,
      },
      "execution complete"
    );

    return {
      success,
      filesChanged: [],
      summary,
      testsPassed: null,
      costInDollars: totalCost,
    };
  }

  private parseAssessmentFromText(text: string): AssessmentResult {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in Claude Code assessment response");
    }

    return JSON.parse(jsonMatch[0]) as AssessmentResult;
  }
}

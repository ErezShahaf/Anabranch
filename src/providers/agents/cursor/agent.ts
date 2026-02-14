import { spawn } from "node:child_process";
import type { Logger } from "@nestjs/common";
import type { Ticket } from "../../ticketing/types.js";
import type { AssessmentResult } from "../../../core/orchestrator/types.js";
import type { AgentResult } from "../types.js";
import type { AgentConfiguration } from "../../../core/configuration/types.js";
import type { Repository } from "../../source-control/types.js";
import { CodingAgent } from "../base.js";
import { buildAssessmentPrompt } from "../prompts/assessment.js";
import { buildExecutionPrompt } from "../prompts/execution.js";
import { validateAssessmentResult } from "../../../core/orchestrator/assessment-result.schema.js";

const ASSESSMENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const EXECUTION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface CursorJsonResult {
  result?: string;
  session_id?: string;
  error?: string;
}

export class CursorAgent extends CodingAgent {
  readonly name = "cursor";
  private readonly logger: Logger;

  constructor(logger: Logger, private readonly apiKey: string) {
    super();
    this.logger = logger;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.runCursorCommand(["--version"], 10_000);
      return true;
    } catch {
      return false;
    }
  }

  async assess(
    ticket: Ticket,
    repositories: Repository[]
  ): Promise<AssessmentResult> {
    const prompt = buildAssessmentPrompt(ticket, repositories);

    this.logger.log(`running assessment with Cursor CLI for ${ticket.externalId}`);

    const output = await this.runCursorCommand(
      ["-p", "--output-format", "json", prompt],
      ASSESSMENT_TIMEOUT_MS
    );

    const parsed = JSON.parse(output) as CursorJsonResult;
    if (parsed.result === undefined) {
      throw new Error("Cursor CLI assessment response missing result field");
    }

    const rawAssessment = this.parseAssessmentFromText(parsed.result);
    const assessment = validateAssessmentResult(rawAssessment);

    this.logger.log(
      `assessment complete for ${ticket.externalId} (confidence: ${assessment.confidence}, scope: ${assessment.scope})`,
    );

    return assessment;
  }

  async execute(
    ticket: Ticket,
    workDirectories: string[],
    assessment: AssessmentResult,
  ): Promise<AgentResult> {
    const prompt = buildExecutionPrompt(ticket, assessment, workDirectories);

    this.logger.log(`running execution with Cursor CLI for ${ticket.externalId}`);

    const output = await this.runCursorCommand(
      ["-p", "--force", "--output-format", "json", prompt],
      EXECUTION_TIMEOUT_MS
    );

    const parsed = JSON.parse(output) as CursorJsonResult;
    const success = !parsed.error;
    const summary = parsed.error ?? parsed.result;
    if (summary === undefined) {
      throw new Error("Cursor CLI execution response missing result field");
    }

    this.logger.log(`execution complete for ${ticket.externalId} (success: ${success})`);

    return {
      success,
      filesChanged: [],
      summary,
      testsPassed: null,
      costInDollars: null,
    };
  }

  private runCursorCommand(
    arguments_: string[],
    timeoutMilliseconds: number
  ): Promise<string> {
    const args = ["--api-key", this.apiKey, ...arguments_];

    return new Promise((resolve, reject) => {
      const process_ = spawn("agent", args, {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      process_.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      process_.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timeout = setTimeout(() => {
        process_.kill("SIGTERM");
        reject(new Error(`Cursor CLI timed out after ${timeoutMilliseconds}ms`));
      }, timeoutMilliseconds);

      process_.on("close", (exitCode) => {
        clearTimeout(timeout);

        if (exitCode !== 0) {
          reject(
            new Error(
              `Cursor CLI exited with code ${exitCode}: ${stderr || stdout}`
            )
          );
          return;
        }

        resolve(stdout);
      });

      process_.on("error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn Cursor CLI: ${error.message}`));
      });
    });
  }

  private parseAssessmentFromText(text: string): unknown {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in Cursor CLI assessment response");
    }

    return JSON.parse(jsonMatch[0]) as unknown;
  }
}

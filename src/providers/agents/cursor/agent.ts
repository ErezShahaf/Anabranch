import { spawn } from "node:child_process";
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

interface CursorJsonResult {
  result?: string;
  session_id?: string;
  error?: string;
}

export class CursorAgent extends CodingAgent {
  readonly name = "cursor";
  private readonly logger: pino.Logger;

  constructor(logger: pino.Logger) {
    super();
    this.logger = logger.child({ component: "cursor-agent" });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.runCursorCommand(["--version"], process.cwd(), 10_000);
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

    this.logger.info(
      { ticketId: ticket.externalId },
      "running assessment with Cursor CLI"
    );

    const output = await this.runCursorCommand(
      ["-p", "--output-format", "json", prompt],
      process.cwd(),
      300_000
    );

    const parsed = JSON.parse(output) as CursorJsonResult;
    const resultText = parsed.result ?? output;

    const assessment = this.parseAssessmentFromText(resultText);

    this.logger.info(
      {
        ticketId: ticket.externalId,
        confidence: assessment.confidence,
        scope: assessment.scope,
      },
      "assessment complete"
    );

    return assessment;
  }

  async execute(
    ticket: Ticket,
    workDirectories: string[],
    assessment: AssessmentResult,
    configuration: AgentConfiguration
  ): Promise<AgentResult> {
    const prompt = buildExecutionPrompt(ticket, assessment, workDirectories);
    const primaryWorkDirectory = workDirectories[0] ?? process.cwd();
    const timeoutMilliseconds = configuration.execution.timeoutMinutes * 60 * 1000;

    this.logger.info(
      { ticketId: ticket.externalId, workDirectories },
      "running execution with Cursor CLI"
    );

    const output = await this.runCursorCommand(
      ["-p", "--force", "--output-format", "json", prompt],
      primaryWorkDirectory,
      timeoutMilliseconds
    );

    let success = true;
    let summary = "";

    try {
      const parsed = JSON.parse(output) as CursorJsonResult;
      summary = parsed.result ?? output;
      if (parsed.error) {
        success = false;
        summary = parsed.error;
      }
    } catch {
      summary = output;
    }

    this.logger.info(
      { ticketId: ticket.externalId, success },
      "execution complete"
    );

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
    workingDirectory: string,
    timeoutMilliseconds: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const process_ = spawn("agent", arguments_, {
        cwd: workingDirectory,
        env: { ...process.env },
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

  private parseAssessmentFromText(text: string): AssessmentResult {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in Cursor CLI assessment response");
    }

    return JSON.parse(jsonMatch[0]) as AssessmentResult;
  }
}

import type { Query } from "@anthropic-ai/claude-agent-sdk";

export interface ClaudeQueryResult {
  success: boolean;
  totalCostUsd: number;
  result?: string;
  structuredOutput?: unknown;
  error?: string;
}

export async function extractClaudeQueryResult(
  queryStream: Query
): Promise<ClaudeQueryResult> {
  let extracted: ClaudeQueryResult = {
    success: false,
    totalCostUsd: 0,
  };

  for await (const message of queryStream) {
    if ("error" in message && (message as { error?: string }).error) {
      extracted = {
        ...extracted,
        success: false,
        error: (message as { error: string }).error,
      };
      break;
    }
    if (message.type === "assistant" && "error" in message && message.error) {
      extracted = {
        ...extracted,
        success: false,
        error: String(message.error),
      };
      break;
    }

    if (message.type === "result") {
      extracted = {
        success: message.subtype === "success",
        totalCostUsd: message.total_cost_usd,
        result: message.subtype === "success" ? message.result : undefined,
        structuredOutput:
          message.subtype === "success" ? message.structured_output : undefined,
        error:
          message.subtype !== "success" && "errors" in message && Array.isArray(message.errors)
            ? (message.errors as string[])[0]
            : message.subtype !== "success" && "error" in message
              ? String((message as { error?: unknown }).error)
              : undefined,
      };
    }
  }

  return extracted;
}

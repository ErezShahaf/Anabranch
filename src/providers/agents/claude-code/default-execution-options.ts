const EXECUTION_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    shouldCreatePR: { type: "boolean" as const },
    skipReason: { type: "string" as const },
  },
  required: ["shouldCreatePR"] as const,
};

export const DEFAULT_EXECUTION_OPTIONS = {
  permissionMode: "bypassPermissions" as const,
  allowDangerouslySkipPermissions: true,
  tools: { type: "preset" as const, preset: "claude_code" as const },
  systemPrompt: {
    type: "preset" as const,
    preset: "claude_code" as const,
  },
  outputFormat: {
    type: "json_schema" as const,
    schema: EXECUTION_OUTPUT_SCHEMA,
  },
  maxTurns: 50,
  maxBudgetUsd: 5,
};

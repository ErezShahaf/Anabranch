export const DEFAULT_EXECUTION_OPTIONS = {
  permissionMode: "bypassPermissions" as const,
  allowDangerouslySkipPermissions: true,
  tools: { type: "preset" as const, preset: "claude_code" as const },
  systemPrompt: {
    type: "preset" as const,
    preset: "claude_code" as const,
  },
  maxTurns: 50,
  maxBudgetUsd: 5,
};

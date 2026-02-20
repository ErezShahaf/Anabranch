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

export const DEFAULT_ASSESSMENT_OPTIONS = {
  permissionMode: "plan" as const,
  tools: ["Read", "Glob", "Grep"],
  systemPrompt: {
    type: "preset" as const,
    preset: "claude_code" as const,
    append: "You are assessing a ticket for autonomous implementation. Do not make any changes.",
  },
  outputFormat: {
    type: "json_schema" as const,
    schema: ASSESSMENT_JSON_SCHEMA,
  },
  maxTurns: 20,
};

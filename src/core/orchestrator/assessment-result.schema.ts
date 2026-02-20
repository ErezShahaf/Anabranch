import { z } from "zod";
import type { AssessmentResult } from "./types.js";

const assessmentResultSchema = z.object({
  confidence: z.number(),
  scope: z.enum(["trivial", "small", "medium", "large", "architectural"]),
  riskFactors: z.array(z.string()),
  decisionsRequired: z.array(z.string()),
  estimatedFiles: z.number(),
  affectedRepositories: z.array(z.string()),
  reasoning: z.string(),
});

export function validateAssessmentResult(value: unknown): AssessmentResult {
  return assessmentResultSchema.parse(value) as AssessmentResult;
}

import { z } from "zod";

export interface ExecutionOutput {
  shouldCreatePR: boolean;
  skipReason?: string;
}

const executionOutputSchema = z.object({
  shouldCreatePR: z.boolean(),
  skipReason: z.string().optional(),
});

export function validateExecutionOutput(value: unknown): ExecutionOutput {
  return executionOutputSchema.parse(value);
}

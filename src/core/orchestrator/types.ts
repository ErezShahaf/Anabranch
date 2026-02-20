export type TaskScope =
  | "trivial"
  | "small"
  | "medium"
  | "large"
  | "architectural";

export interface AssessmentResult {
  confidence: number;
  scope: TaskScope;
  riskFactors: string[];
  decisionsRequired: string[];
  estimatedFiles: number;
  affectedRepositories: string[];
  reasoning: string;
}

export interface AgentResult {
  success: boolean;
  filesChanged: string[];
  summary: string;
  testsPassed: boolean | null;
  costInDollars: number | null;
  /**
   * Whether a pull request should be created for this execution.
   * Set to false when the task description is too ambiguous or unclear.
   */
  shouldCreatePR: boolean;
  /**
   * Reason why shouldCreatePR is false (required when shouldCreatePR is false).
   * Should explain what information is missing or ambiguous.
   */
  skipReason?: string;
}

export interface TestResult {
  passed: boolean;
  output: string;
  exitCode: number;
}

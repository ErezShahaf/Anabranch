export interface AgentResult {
  success: boolean;
  filesChanged: string[];
  summary: string;
  testsPassed: boolean | null;
  costInDollars: number | null;
  shouldCreatePR: boolean;
  skipReason?: string;
}

export interface TestResult {
  passed: boolean;
  output: string;
  exitCode: number;
}

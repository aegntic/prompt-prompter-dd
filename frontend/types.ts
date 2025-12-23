
export interface MetricPoint {
  name: string;
  score: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  confidenceScore: number;
  responseText: string;
  optimizationSuggestion: string;
  metrics: MetricPoint[];
  originalPrompt: string;
  expectedResponse?: string;
  autoOptimized?: boolean;
}

export interface PromptExample {
  prompt: string;
  expected: string;
  autoOptimize: boolean;
}


export interface MetricPoint {
  name: string;
  score: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  confidenceScore: number;
  originalScore?: number; // Score before optimization
  expectedImprovement?: number; // Expected improvement from optimization
  optimizedPrompt?: string; // The optimized prompt text
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


export interface PromptMetrics {
  accuracy_score: number;
  semantic_similarity: number;
  hallucination_score: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
}

export interface PromptQualityDimensions {
  specificity: number;
  meaningfulLength: number;
  context: number;
  clarity: number;
  structure: number;
}

export interface OptimizationResult {
  optimized_prompt: string;
  improvement_explanation: string;
  expected_score_improvement: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  original_prompt: string;
  llm_response: string;
  metrics: PromptMetrics;
  quality_dimensions: PromptQualityDimensions;
  optimization?: OptimizationResult;
  status: 'success' | 'error';
  error?: string;
}

export interface TemplateVersion {
  id: string;
  content: string;
  description: string;
  timestamp: number;
  versionNumber: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  versions: TemplateVersion[];
}

export enum TabType {
  ANALYSIS = 'ANALYSIS',
  METRICS = 'METRICS',
  HISTORY = 'HISTORY'
}

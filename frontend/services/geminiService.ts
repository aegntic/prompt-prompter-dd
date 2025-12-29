
import { AnalysisResult } from "../types";

export const analyzePrompt = async (
  prompt: string,
  expected: string,
  autoOptimize: boolean
): Promise<AnalysisResult> => {
  const response = await fetch("/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      expected_response: expected,
      auto_optimize: autoOptimize,
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed with status ${response.status}`);
  }

  const data = await response.json();

  // Map FastAPI response to React AnalysisResult
  const metrics = data.metrics;
  const optimization = data.optimization;

  // Calculate scores for before/after comparison
  const originalScore = Math.round(metrics.accuracy_score * 100);
  const expectedImprovement = optimization ? Math.round(optimization.expected_score_improvement * 100) : 0;
  const newScore = Math.min(100, originalScore + expectedImprovement);

  return {
    id: data.trace_id,
    timestamp: Date.now(),
    confidenceScore: optimization ? newScore : originalScore, // Show improved score if optimized
    originalScore: optimization ? originalScore : undefined, // Only show original if there was optimization
    expectedImprovement: optimization ? expectedImprovement : undefined,
    optimizedPrompt: optimization ? optimization.optimized_prompt : undefined,
    responseText: data.llm_response,
    optimizationSuggestion: optimization
      ? `[OPTIMIZED] ${optimization.optimized_prompt}\n\nREASONING: ${optimization.improvement_explanation}`
      : "✅ No optimization needed.",
    metrics: [
      { name: "Clarity", score: Math.round(metrics.accuracy_score * 100) },
      { name: "Context", score: Math.round(metrics.semantic_similarity * 100) },
      { name: "Constraints", score: Math.round((1 - metrics.hallucination_score) * 100) },
      { name: "Structure", score: Math.round(Math.min(100, (metrics.total_tokens / 1000) * 100)) },
      { name: "Tone", score: 85 }
    ],
    originalPrompt: data.original_prompt,
    expectedResponse: expected,
    autoOptimized: !!optimization
  };
};

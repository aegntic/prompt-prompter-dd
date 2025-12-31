
import { AnalysisResult, PromptMetrics, PromptQualityDimensions, OptimizationResult } from "../types";
import { analyzePrompt as apiAnalyze, AnalyzeResponse } from "./apiService";
import { STOPWORDS } from "../constants";

// Backend API URL - falls back to local development server
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Client-side prompt quality analysis (for instant feedback)
 * This mirrors the backend's 5-component scoring for UI responsiveness
 */
export const analyzePromptQuality = (prompt: string): PromptQualityDimensions => {
  const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const meaningfulWords = words.filter(w => !STOPWORDS.has(w));

  // 1. Meaningful Length (25%)
  const lenScore = Math.min(meaningfulWords.length / 30, 1) * 100;

  // 2. Specificity (40%) - Detect technical terms, action verbs
  const techTerms = ['function', 'class', 'api', 'json', 'sql', 'python', 'react', 'security', 'latency', 'optimize', 'schema', 'vulnerability', 'asynchronous', 'memory', 'performance'];
  const specificityScore = Math.min((meaningfulWords.filter(w => techTerms.includes(w)).length * 20 + meaningfulWords.length * 2) / 100, 1) * 100;

  // 3. Context (15%) - Detect code blocks or data markers
  const contextScore = (prompt.includes('```') || prompt.includes('{') || prompt.includes('[') || prompt.match(/\d+/)) ? 100 : 20;

  // 4. Clarity (10%) - Penalize vague words
  const vagueWords = ['fix', 'help', 'thing', 'do', 'stuff', 'something'];
  const clarityScore = Math.max(100 - (words.filter(w => vagueWords.includes(w)).length * 15), 0);

  // 5. Structure (10%) - Detect punctuation, numbering, lists
  const structureScore = (prompt.match(/\n/g) || []).length >= 2 || (prompt.match(/\d\./) || prompt.match(/[-*]/)) ? 100 : 30;

  return {
    specificity: specificityScore,
    meaningfulLength: lenScore,
    context: contextScore,
    clarity: clarityScore,
    structure: structureScore
  };
};

/**
 * Run analysis via backend API (production) or fallback to client-side (demo mode)
 */
export const runAnalysis = async (
  prompt: string,
  autoOptimize: boolean = true,
  modelName: string = 'gemini-2.0-flash-exp'
): Promise<AnalysisResult> => {
  const startTime = performance.now();

  try {
    // Try backend API first
    const apiResponse = await apiAnalyze(prompt, autoOptimize, modelName);

    // Convert API response to AnalysisResult format
    const quality = analyzePromptQuality(prompt);

    return {
      id: apiResponse.trace_id || crypto.randomUUID(),
      timestamp: Date.now(),
      original_prompt: apiResponse.original_prompt,
      llm_response: apiResponse.llm_response,
      metrics: {
        accuracy_score: apiResponse.metrics.accuracy_score,
        semantic_similarity: apiResponse.metrics.semantic_similarity,
        hallucination_score: apiResponse.metrics.hallucination_score,
        input_tokens: apiResponse.metrics.input_tokens,
        output_tokens: apiResponse.metrics.output_tokens,
        total_tokens: apiResponse.metrics.total_tokens,
        latency_ms: apiResponse.metrics.latency_ms,
        estimated_cost_usd: apiResponse.metrics.estimated_cost_usd,
      },
      quality_dimensions: quality,
      optimization: apiResponse.optimization ? {
        optimized_prompt: apiResponse.optimization.optimized_prompt,
        improvement_explanation: apiResponse.optimization.improvement_explanation,
        expected_score_improvement: apiResponse.optimization.expected_score_improvement,
      } : undefined,
      status: apiResponse.status,
      error: apiResponse.error,
    };
  } catch (err: any) {
    console.warn('Backend API unavailable, falling back to demo mode:', err.message);

    // Fallback: Return demo result with client-side analysis
    const quality = analyzePromptQuality(prompt);
    const avgPromptQuality = (
      quality.specificity * 0.4 +
      quality.meaningfulLength * 0.25 +
      quality.context * 0.15 +
      quality.clarity * 0.1 +
      quality.structure * 0.1
    );

    const latency = performance.now() - startTime;

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      original_prompt: prompt,
      llm_response: `[Demo Mode] Backend unavailable. Would analyze: "${prompt.slice(0, 50)}..."`,
      metrics: {
        accuracy_score: Math.min(avgPromptQuality / 100, 0.98),
        semantic_similarity: 0.75,
        hallucination_score: 0.1,
        input_tokens: Math.round(prompt.length / 4),
        output_tokens: 50,
        total_tokens: Math.round(prompt.length / 4) + 50,
        latency_ms: latency,
        estimated_cost_usd: 0.0001,
      },
      quality_dimensions: quality,
      optimization: avgPromptQuality < 85 ? {
        optimized_prompt: `[Optimized] ${prompt}`,
        improvement_explanation: "Demo mode: connect backend for real optimization",
        expected_score_improvement: 0.15,
      } : undefined,
      status: 'success',
    };
  }
};

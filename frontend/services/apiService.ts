/**
 * API Service - Connects frontend to FastAPI backend
 * Replaces mock services with real backend calls
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ScoreBreakdown {
    specificity: number;
    length: number;
    context: number;
    clarity: number;
    structure: number;
    overall: number;
}

export interface MetricsBreakdown {
    accuracy_score: number;
    semantic_similarity: number;
    hallucination_score: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
    estimated_cost_usd: number;
    score_breakdown?: ScoreBreakdown;
}

export interface OptimizationResult {
    optimized_prompt: string;
    improvement_explanation: string;
    expected_score_improvement: number;
}

export interface AnalyzeResponse {
    original_prompt: string;
    llm_response: string;
    metrics: MetricsBreakdown;
    optimization?: OptimizationResult;
    trace_id: string;
    status: 'success' | 'error';
    error?: string;
}

export interface HealthResponse {
    status: string;
    service: string;
    version: string;
    datadog_connected: boolean;
    vertex_ai_connected: boolean;
}

/**
 * Analyze a prompt using the backend scoring algorithm
 */
export async function analyzePrompt(
    prompt: string,
    autoOptimize: boolean = true,
    model: string = 'gemini-2.0-flash-exp'
): Promise<AnalyzeResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                auto_optimize: autoOptimize,
                model_name: model,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    return response.json();
}

/**
 * Get client configuration from backend
 */
export async function getConfig(): Promise<Record<string, any>> {
    const response = await fetch(`${API_BASE}/api/config`);
    if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
    return response.json();
}

"""
Pydantic models for Your Prompts Favourite Prompter API.
Defines request/response schemas for the prompt analysis endpoints.
"""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request model for prompt analysis."""

    prompt: str = Field(
        ...,
        description="The prompt to analyze and optimize",
        min_length=1,
        max_length=10000,
        examples=["Explain quantum computing to a 5 year old"],
    )
    expected_response: str | None = Field(
        default=None,
        description="Optional expected/ideal response for accuracy scoring",
    )
    auto_optimize: bool = Field(
        default=True,
        description="Whether to automatically optimize low-scoring prompts",
    )


class MetricsBreakdown(BaseModel):
    """Detailed metrics from prompt analysis."""

    accuracy_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall accuracy/quality score (0-1)",
    )
    semantic_similarity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Semantic coherence score",
    )
    hallucination_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Hallucination risk score (lower is better)",
    )
    input_tokens: int = Field(..., ge=0, description="Input token count")
    output_tokens: int = Field(..., ge=0, description="Output token count")
    total_tokens: int = Field(..., ge=0, description="Total tokens used")
    latency_ms: float = Field(..., ge=0, description="Response latency in milliseconds")
    estimated_cost_usd: float = Field(..., ge=0, description="Estimated cost in USD")


class OptimizationResult(BaseModel):
    """Result of prompt optimization."""

    optimized_prompt: str = Field(..., description="The optimized version of the prompt")
    improvement_explanation: str = Field(
        ...,
        description="Explanation of what changes were made and why",
    )
    expected_score_improvement: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Expected improvement in accuracy score",
    )


class AnalyzeResponse(BaseModel):
    """Response model for prompt analysis."""

    original_prompt: str = Field(..., description="The original input prompt")
    llm_response: str = Field(..., description="LLM response to the original prompt")
    metrics: MetricsBreakdown = Field(..., description="Detailed metrics breakdown")
    optimization: OptimizationResult | None = Field(
        default=None,
        description="Optimization result if auto_optimize was enabled and score was low",
    )
    trace_id: str = Field(..., description="Datadog trace ID for this request")
    status: str = Field(default="success", description="Request status")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(default="healthy", description="Service health status")
    service: str = Field(default="prompt-prompter", description="Service name")
    version: str = Field(default="0.1.0", description="Service version")
    datadog_connected: bool = Field(..., description="Datadog connection status")
    vertex_ai_connected: bool = Field(..., description="Vertex AI connection status")


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str = Field(..., description="Error message")
    detail: str | None = Field(default=None, description="Detailed error information")
    trace_id: str | None = Field(default=None, description="Trace ID for debugging")

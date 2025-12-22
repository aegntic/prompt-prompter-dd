"""
Prompt Engine - Core LLM interaction and evaluation logic.
Uses Vertex AI Gemini for prompt execution and optimization.
All calls are REAL - no mocks.
"""

import logging
import time

import numpy as np
from datadog import statsd
from ddtrace import tracer
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_vertexai import ChatVertexAI, VertexAIEmbeddings
from sklearn.metrics.pairwise import cosine_similarity

from config import get_settings
from models import MetricsBreakdown, OptimizationResult

logger = logging.getLogger(__name__)


class PromptEngine:
    """
    Core engine for prompt analysis, evaluation, and optimization.
    All LLM calls use real Vertex AI Gemini - no mocks.
    """

    def __init__(self):
        """Initialize the engine with Vertex AI models."""
        self.settings = get_settings()

        # Initialize the main Gemini model for prompt execution
        self.llm = ChatVertexAI(
            model=self.settings.gemini_model,
            project=self.settings.google_cloud_project,
            location=self.settings.vertex_location,
            temperature=0.7,
            max_tokens=2048,
        )

        # Initialize the optimizer model (can be same or different)
        self.optimizer_llm = ChatVertexAI(
            model=self.settings.optimizer_model,
            project=self.settings.google_cloud_project,
            location=self.settings.vertex_location,
            temperature=0.3,  # Lower temp for more consistent optimization
            max_tokens=2048,
        )

        # Initialize embeddings for semantic similarity
        self.embeddings = VertexAIEmbeddings(
            model_name="text-embedding-004",
            project=self.settings.google_cloud_project,
            location=self.settings.vertex_location,
        )

        # Optimization prompt template
        self.optimizer_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(
                    content="""You are an expert prompt engineer. Your task is to optimize prompts for better clarity, specificity, and effectiveness.

When optimizing a prompt:
1. Add specific context and constraints
2. Clarify ambiguous language
3. Structure the request clearly
4. Reduce verbosity while maintaining meaning
5. Add output format specifications if helpful

Respond with a JSON object containing:
- "optimized_prompt": The improved prompt
- "changes": A brief explanation of what you changed and why
- "expected_improvement": A number from 0.0 to 1.0 indicating expected score improvement"""
                ),
                HumanMessage(
                    content="""Original prompt: {prompt}

Current accuracy score: {score}

Please optimize this prompt to achieve a higher accuracy score."""
                ),
            ]
        )

        logger.info(
            f"PromptEngine initialized with model={self.settings.gemini_model}, "
            f"project={self.settings.google_cloud_project}"
        )

    @tracer.wrap(service="prompt-prompter", resource="execute_prompt")
    def execute_prompt(self, prompt: str) -> tuple[str, int, int, float]:
        """
        Execute a prompt using Gemini and return response with token counts.

        Returns:
            tuple: (response_text, input_tokens, output_tokens, latency_ms)
        """
        start_time = time.perf_counter()

        # Execute the prompt
        response = self.llm.invoke([HumanMessage(content=prompt)])

        latency_ms = (time.perf_counter() - start_time) * 1000

        # Extract token usage from response metadata
        usage_metadata = getattr(response, "usage_metadata", {})
        input_tokens = usage_metadata.get("prompt_token_count", 0)
        output_tokens = usage_metadata.get("candidates_token_count", 0)

        # If tokens not in metadata, estimate from content
        if input_tokens == 0:
            input_tokens = len(prompt.split()) * 1.3  # Rough estimate
        if output_tokens == 0:
            output_tokens = len(response.content.split()) * 1.3

        # Send metrics to Datadog
        statsd.timing(
            "prompt.latency_ms",
            latency_ms,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
                "operation:execute",
            ],
        )
        statsd.increment(
            "prompt.requests",
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )

        return response.content, int(input_tokens), int(output_tokens), latency_ms

    @tracer.wrap(service="prompt-prompter", resource="evaluate_response")
    def evaluate_response(
        self,
        prompt: str,
        response: str,
        expected_response: str | None = None,
    ) -> tuple[float, float, float]:
        """
        Evaluate a prompt-response pair for quality.

        Returns:
            tuple: (accuracy_score, semantic_similarity, hallucination_score)
        """
        # Get embeddings for semantic analysis
        prompt_embedding = self.embeddings.embed_query(prompt)
        response_embedding = self.embeddings.embed_query(response)

        # Calculate semantic similarity between prompt intent and response
        prompt_response_sim = cosine_similarity(
            np.array(prompt_embedding).reshape(1, -1),
            np.array(response_embedding).reshape(1, -1),
        )[0][0]

        # If expected response provided, compare against it
        if expected_response:
            expected_embedding = self.embeddings.embed_query(expected_response)
            response_expected_sim = cosine_similarity(
                np.array(response_embedding).reshape(1, -1),
                np.array(expected_embedding).reshape(1, -1),
            )[0][0]
            accuracy_score = float(response_expected_sim)
        else:
            # Without expected response, use prompt-response coherence as proxy
            accuracy_score = float(prompt_response_sim)

        # Hallucination detection via consistency check
        # Ask model to verify its own response
        hallucination_score = self._check_hallucination(prompt, response)

        # Semantic similarity as separate metric
        semantic_similarity = float(prompt_response_sim)

        # Send metrics to Datadog
        statsd.gauge(
            "prompt.accuracy",
            accuracy_score,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )
        statsd.gauge(
            "prompt.semantic_similarity",
            semantic_similarity,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )
        statsd.gauge(
            "prompt.hallucination",
            hallucination_score,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )

        return accuracy_score, semantic_similarity, hallucination_score

    @tracer.wrap(service="prompt-prompter", resource="check_hallucination")
    def _check_hallucination(self, prompt: str, response: str) -> float:
        """
        Check for potential hallucinations using self-consistency.
        Returns a score from 0 (no hallucination) to 1 (likely hallucination).
        """
        verification_prompt = f"""Analyze this response for potential hallucinations or unsupported claims.

Original question/prompt: {prompt}

Response to analyze: {response}

Rate the hallucination risk from 0.0 (factually grounded) to 1.0 (likely fabricated).
Respond with ONLY a decimal number between 0.0 and 1.0."""

        try:
            result = self.llm.invoke([HumanMessage(content=verification_prompt)])
            # Parse the score from response
            score_text = result.content.strip()
            score = float(score_text)
            return max(0.0, min(1.0, score))  # Clamp to [0, 1]
        except (ValueError, AttributeError):
            # If parsing fails, return moderate uncertainty
            return 0.5

    @tracer.wrap(service="prompt-prompter", resource="optimize_prompt")
    def optimize_prompt(self, prompt: str, current_score: float) -> OptimizationResult:
        """
        Optimize a prompt to improve its effectiveness.

        Args:
            prompt: The original prompt to optimize
            current_score: Current accuracy score (0-1)

        Returns:
            OptimizationResult with optimized prompt and explanation
        """
        import json

        # Format the optimization request
        messages = self.optimizer_prompt.format_messages(
            prompt=prompt,
            score=current_score,
        )

        # Get optimization from Gemini
        result = self.optimizer_llm.invoke(messages)

        # Parse the JSON response
        try:
            # Try to extract JSON from the response
            content = result.content
            # Handle potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            optimization_data = json.loads(content.strip())

            optimized_prompt = optimization_data.get("optimized_prompt", prompt)
            changes = optimization_data.get("changes", "Applied standard optimization techniques")
            improvement = float(optimization_data.get("expected_improvement", 0.1))

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(f"Failed to parse optimization response: {e}")
            # Fallback: use the raw response as the optimized prompt
            optimized_prompt = result.content
            changes = "Model provided direct optimization"
            improvement = 0.1

        # Send optimization metrics to Datadog
        statsd.increment(
            "prompt.optimizations",
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )
        statsd.gauge(
            "prompt.expected_improvement",
            improvement,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )

        return OptimizationResult(
            optimized_prompt=optimized_prompt,
            improvement_explanation=changes,
            expected_score_improvement=improvement,
        )

    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate estimated cost in USD based on token usage."""
        input_cost = (input_tokens / 1_000_000) * self.settings.input_price_per_million
        output_cost = (output_tokens / 1_000_000) * self.settings.output_price_per_million
        total_cost = input_cost + output_cost

        # Send cost metric to Datadog
        statsd.gauge(
            "prompt.cost_usd",
            total_cost,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
            ],
        )
        statsd.increment(
            "prompt.tokens",
            input_tokens + output_tokens,
            tags=[
                f"service:{self.settings.dd_service}",
                f"env:{self.settings.dd_env}",
                "type:total",
            ],
        )

        return total_cost

    @tracer.wrap(service="prompt-prompter", resource="analyze_full")
    def analyze(
        self,
        prompt: str,
        expected_response: str | None = None,
        auto_optimize: bool = True,
    ) -> tuple[str, MetricsBreakdown, OptimizationResult | None]:
        """
        Full analysis pipeline: execute, evaluate, and optionally optimize.

        Returns:
            tuple: (llm_response, metrics, optimization_result)
        """
        # Step 1: Execute the prompt
        response, input_tokens, output_tokens, latency_ms = self.execute_prompt(prompt)

        # Step 2: Evaluate the response
        accuracy, semantic_sim, hallucination = self.evaluate_response(
            prompt, response, expected_response
        )

        # Step 3: Calculate cost
        total_tokens = input_tokens + output_tokens
        cost = self.calculate_cost(input_tokens, output_tokens)

        # Build metrics
        metrics = MetricsBreakdown(
            accuracy_score=round(accuracy, 4),
            semantic_similarity=round(semantic_sim, 4),
            hallucination_score=round(hallucination, 4),
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            latency_ms=round(latency_ms, 2),
            estimated_cost_usd=round(cost, 6),
        )

        # Step 4: Optimize if score is below threshold and auto_optimize enabled
        optimization = None
        if auto_optimize and accuracy < self.settings.accuracy_threshold:
            logger.info(
                f"Score {accuracy:.2f} below threshold {self.settings.accuracy_threshold}, "
                "triggering optimization"
            )
            optimization = self.optimize_prompt(prompt, accuracy)

            # Send alert-worthy metrics to Datadog
            statsd.event(
                title="Low Accuracy Score Detected",
                message=f"Prompt scored {accuracy:.2f}, below threshold. Auto-optimization triggered.",
                alert_type="warning",
                tags=[
                    f"service:{self.settings.dd_service}",
                    f"env:{self.settings.dd_env}",
                    f"score:{accuracy:.2f}",
                ],
            )

        # Check token threshold
        if total_tokens > self.settings.token_threshold:
            statsd.event(
                title="High Token Usage Detected",
                message=f"Request used {total_tokens} tokens (> {self.settings.token_threshold} threshold)",
                alert_type="warning",
                tags=[
                    f"service:{self.settings.dd_service}",
                    f"env:{self.settings.dd_env}",
                    f"tokens:{total_tokens}",
                ],
            )

        # Check latency threshold
        if latency_ms > self.settings.latency_threshold_ms:
            statsd.event(
                title="High Latency Detected",
                message=f"Request took {latency_ms:.0f}ms (> {self.settings.latency_threshold_ms}ms threshold)",
                alert_type="warning",
                tags=[
                    f"service:{self.settings.dd_service}",
                    f"env:{self.settings.dd_env}",
                    f"latency:{latency_ms:.0f}",
                ],
            )

        return response, metrics, optimization


# Singleton instance
_engine: PromptEngine | None = None


def get_engine() -> PromptEngine:
    """Get or create the PromptEngine singleton."""
    global _engine
    if _engine is None:
        _engine = PromptEngine()
    return _engine

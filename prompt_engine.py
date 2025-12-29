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
        Includes retry logic for rate limiting and transient errors.

        Returns:
            tuple: (response_text, input_tokens, output_tokens, latency_ms)
        """
        max_retries = 3
        base_delay = 1.0  # seconds

        for attempt in range(max_retries):
            start_time = time.perf_counter()
            try:
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

            except Exception as e:
                error_str = str(e).lower()
                is_rate_limit = any(
                    x in error_str for x in ["rate", "quota", "limit", "429", "resource_exhausted"]
                )
                is_transient = any(x in error_str for x in ["timeout", "unavailable", "503", "504"])

                if (is_rate_limit or is_transient) and attempt < max_retries - 1:
                    delay = base_delay * (2**attempt)  # Exponential backoff
                    logger.warning(
                        f"Retrying after {delay}s due to: {e} (attempt {attempt + 1}/{max_retries})"
                    )
                    statsd.increment(
                        "prompt.retries",
                        tags=[
                            f"service:{self.settings.dd_service}",
                            f"env:{self.settings.dd_env}",
                            f"reason:{'rate_limit' if is_rate_limit else 'transient'}",
                        ],
                    )
                    time.sleep(delay)
                else:
                    # Re-raise if not retryable or out of retries
                    raise

    @tracer.wrap(service="prompt-prompter", resource="evaluate_prompt_quality")
    def _evaluate_prompt_quality(self, prompt: str) -> dict[str, float]:
        """
        Evaluate the quality of the prompt itself based on prompt engineering best practices.
        Returns individual scores and overall quality score.
        
        Scoring Guidelines:
        - Excellent prompts (80-100%): Specific, contextual, well-structured
        - Good prompts (60-79%): Clear intent, some context
        - Poor prompts (30-59%): Vague, lacking context
        - Terrible prompts (0-29%): Impossibly vague like "fix code", "help me"
        """
        words = prompt.split()
        word_count = len(words)
        
        # STOPWORDS - These don't count as meaningful content
        stopwords = {
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'us', 'them',
            'please', 'thanks', 'thank', 'hello', 'hi', 'hey',
            'can', 'could', 'would', 'will', 'shall', 'may', 'might',
            'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'as',
            'and', 'or', 'but', 'so', 'if', 'then', 'else',
        }
        
        # Count only MEANINGFUL words (not stopwords)
        meaningful_words = [w for w in words if w.lower() not in stopwords]
        meaningful_count = len(meaningful_words)
        
        # 1. MEANINGFUL LENGTH SCORE (0-1)
        # "fix code" = 2 meaningful words = nearly 0
        # "fix my code please" = 2 meaningful words (fix, code) = same score!
        # Good prompt with 15+ meaningful words = high score
        if meaningful_count <= 2:
            length_score = meaningful_count * 0.02  # 2 words = 0.04 (4%)
        elif meaningful_count <= 5:
            length_score = 0.05 + (meaningful_count - 2) * 0.08  # 3-5 = 13-29%
        elif meaningful_count <= 10:
            length_score = 0.30 + (meaningful_count - 5) * 0.10  # 6-10 = 40-80%
        elif meaningful_count <= 20:
            length_score = 0.80 + (meaningful_count - 10) * 0.02  # 11-20 = 82-100%
        else:
            length_score = min(0.98, 0.90 + (meaningful_count - 20) * 0.004)  # Cap at 98%
        
        # 2. SPECIFICITY SCORE (0-1) - Does it have specific technical details?
        specificity_indicators = [
            # Technical specifics (HIGH value)
            'function', 'class', 'method', 'variable', 'error', 'exception', 'bug',
            'python', 'javascript', 'sql', 'api', 'database', 'endpoint', 'server',
            'array', 'list', 'object', 'string', 'integer', 'boolean', 'null',
            # Action specifics (MEDIUM value) 
            'analyze', 'explain', 'compare', 'create', 'implement', 'debug', 'refactor',
            'optimize', 'review', 'generate', 'convert', 'translate', 'validate',
            # Context specifics
            'example', 'following', 'below', 'above', 'given', 'provided', 'attached',
            'input', 'output', 'expected', 'result', 'return', 'parameter',
            # Constraint specifics
            'should', 'must', 'ensure', 'without', 'using', 'format', 'style',
        ]
        
        prompt_lower = prompt.lower()
        specificity_matches = sum(1 for indicator in specificity_indicators if indicator in prompt_lower)
        # Need at least 2 specificity indicators to start scoring
        if specificity_matches < 2:
            specificity_score = specificity_matches * 0.05  # 0 or 1 indicator = 0-5%
        else:
            specificity_score = min(0.98, 0.10 + specificity_matches * 0.12)  # 2+ = 22-98%
        
        # 3. CONTEXT SCORE (0-1) - Does it provide actual context/data?
        context_indicators = [
            # Code context (HIGH value)
            '```', 'def ', 'function ', 'class ', 'import ', 'const ', 'let ', 'var ',
            # Data context
            '[', '{', '=',
            # Problem description
            'because', 'currently', 'instead', 'however', 'but',
            # Structural context
            '\n', '1.', '2.', '- ',
        ]
        
        context_matches = sum(1 for indicator in context_indicators if indicator in prompt)
        context_score = min(0.98, context_matches * 0.15)  # 6+ indicators = 90%+
        
        # 4. CLARITY SCORE (0-1) - Penalize vague words heavily
        vague_words = {'fix', 'help', 'do', 'make', 'thing', 'stuff', 'something', 'anything', 'issue', 'problem'}
        
        vague_count = sum(1 for word in words if word.lower() in vague_words)
        vague_ratio = vague_count / max(meaningful_count, 1)
        
        # If prompt is mostly vague words, heavily penalize
        if vague_ratio > 0.5:  # More vague than specific
            clarity_score = 0.0
        elif vague_ratio > 0.3:
            clarity_score = 0.2
        elif vague_ratio > 0.1:
            clarity_score = 0.5
        else:
            clarity_score = 0.8
        
        # Bonus for clear action words
        clear_words = {'specifically', 'exactly', 'step-by-step', 'detailed', 'comprehensive'}
        clear_count = sum(1 for word in words if word.lower() in clear_words)
        clarity_score = min(0.98, clarity_score + clear_count * 0.1)
        
        # 5. STRUCTURE SCORE (0-1) - Is it well-structured?
        has_period = '.' in prompt
        has_question = '?' in prompt  
        has_newlines = '\n' in prompt
        has_numbering = any(f'{i}.' in prompt for i in range(1, 10))
        
        structure_score = min(0.98, (
            0.3 * int(has_period or has_question) +
            0.3 * int(has_newlines) +
            0.4 * int(has_numbering)
        ))
        
        # OVERALL PROMPT QUALITY - Weighted combination
        # SPECIFICITY is now king - you MUST have technical content
        overall_quality = (
            specificity_score * 0.40 +  # 40% - Specificity is most important
            length_score * 0.25 +       # 25% - Meaningful length matters
            context_score * 0.15 +      # 15% - Context helps
            clarity_score * 0.10 +      # 10% - Clarity bonus
            structure_score * 0.10      # 10% - Structure bonus
        )
        
        # CAP at 98% - never perfect
        overall_quality = min(0.98, overall_quality)
        
        logger.debug(
            f"Prompt quality: length={length_score:.2f}, specificity={specificity_score:.2f}, "
            f"context={context_score:.2f}, clarity={clarity_score:.2f}, structure={structure_score:.2f}, "
            f"overall={overall_quality:.2f}"
        )
        
        return {
            "length": length_score,
            "specificity": specificity_score,
            "context": context_score,
            "clarity": clarity_score,
            "structure": structure_score,
            "overall": overall_quality,
        }

    @tracer.wrap(service="prompt-prompter", resource="evaluate_response")
    def evaluate_response(
        self,
        prompt: str,
        response: str,
        expected_response: str | None = None,
    ) -> tuple[float, float, float]:
        """
        Evaluate a prompt-response pair for quality.
        
        The accuracy score combines:
        - Prompt quality (how well-formed is the prompt)
        - Response relevance (how well the response matches)
        
        Returns:
            tuple: (accuracy_score, semantic_similarity, hallucination_score)
        """
        # First: Evaluate the prompt quality itself
        prompt_quality = self._evaluate_prompt_quality(prompt)
        
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
            response_quality = float(response_expected_sim)
        else:
            # Without expected response, use prompt-response coherence as proxy
            response_quality = float(prompt_response_sim)

        # FINAL ACCURACY SCORE:
        # Prompt quality is the DOMINANT factor
        # Even if the LLM response is good, a bad prompt = bad overall score
        # This ensures "fix code" scores ~5% not 65%
        accuracy_score = (
            prompt_quality["overall"] * 0.90 +  # 90% from prompt quality
            response_quality * 0.10              # 10% from response quality
        )
        
        # Hallucination detection via consistency check
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
        statsd.gauge(
            "prompt.prompt_quality",
            prompt_quality["overall"],
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
        
        # Cap accuracy at 98% - no prompt is perfect
        accuracy = min(0.98, accuracy)

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

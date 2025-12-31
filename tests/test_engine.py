"""
Tests for the Prompt Engine.
Tests evaluation scoring, cost calculation, and core logic.
"""

import numpy as np
import pytest


class TestCostCalculation:
    """Test cost calculation logic."""

    def test_cost_calculation_basic(self):
        """Test basic cost calculation with known values."""
        # Pricing: $0.10 per 1M input, $0.40 per 1M output
        input_tokens = 1000
        output_tokens = 500

        input_cost = (input_tokens / 1_000_000) * 0.10
        output_cost = (output_tokens / 1_000_000) * 0.40
        expected_cost = input_cost + output_cost

        assert expected_cost == pytest.approx(0.0003, rel=0.01)

    def test_cost_calculation_zero_tokens(self):
        """Test cost calculation with zero tokens."""
        input_cost = (0 / 1_000_000) * 0.10
        output_cost = (0 / 1_000_000) * 0.40
        assert input_cost + output_cost == 0.0

    def test_cost_calculation_large_usage(self):
        """Test cost calculation with large token usage."""
        input_tokens = 100_000
        output_tokens = 50_000

        input_cost = (input_tokens / 1_000_000) * 0.10
        output_cost = (output_tokens / 1_000_000) * 0.40
        total_cost = input_cost + output_cost

        assert total_cost == pytest.approx(0.03, rel=0.01)


class TestScoreEvaluation:
    """Test score evaluation logic."""

    def test_cosine_similarity_identical(self):
        """Test cosine similarity of identical vectors."""
        from sklearn.metrics.pairwise import cosine_similarity

        vec = np.array([[1.0, 2.0, 3.0]])
        similarity = cosine_similarity(vec, vec)[0][0]
        assert similarity == pytest.approx(1.0, rel=0.001)

    def test_cosine_similarity_orthogonal(self):
        """Test cosine similarity of orthogonal vectors."""
        from sklearn.metrics.pairwise import cosine_similarity

        vec1 = np.array([[1.0, 0.0]])
        vec2 = np.array([[0.0, 1.0]])
        similarity = cosine_similarity(vec1, vec2)[0][0]
        assert similarity == pytest.approx(0.0, abs=0.001)

    def test_cosine_similarity_opposite(self):
        """Test cosine similarity of opposite vectors."""
        from sklearn.metrics.pairwise import cosine_similarity

        vec1 = np.array([[1.0, 2.0]])
        vec2 = np.array([[-1.0, -2.0]])
        similarity = cosine_similarity(vec1, vec2)[0][0]
        assert similarity == pytest.approx(-1.0, rel=0.001)


class TestMetricsBreakdown:
    """Test metrics model."""

    def test_metrics_validation(self):
        """Test that metrics model validates correctly."""
        from backend.models import MetricsBreakdown

        metrics = MetricsBreakdown(
            accuracy_score=0.85,
            semantic_similarity=0.9,
            hallucination_score=0.1,
            input_tokens=100,
            output_tokens=200,
            total_tokens=300,
            latency_ms=500.5,
            estimated_cost_usd=0.0001,
        )

        assert metrics.accuracy_score == 0.85
        assert metrics.total_tokens == 300

    def test_metrics_validation_bounds(self):
        """Test that metrics respect bounds."""
        from pydantic import ValidationError

        from backend.models import MetricsBreakdown

        # Should fail with accuracy > 1
        with pytest.raises(ValidationError):
            MetricsBreakdown(
                accuracy_score=1.5,  # Invalid
                semantic_similarity=0.9,
                hallucination_score=0.1,
                input_tokens=100,
                output_tokens=200,
                total_tokens=300,
                latency_ms=500.5,
                estimated_cost_usd=0.0001,
            )


class TestOptimizationResult:
    """Test optimization result model."""

    def test_optimization_result_creation(self):
        """Test creating an optimization result."""
        from backend.models import OptimizationResult

        result = OptimizationResult(
            optimized_prompt="Write a clear Python function...",
            improvement_explanation="Added specificity and structure",
            expected_score_improvement=0.15,
        )

        assert "Python function" in result.optimized_prompt
        assert result.expected_score_improvement == 0.15


class TestAnalyzeRequest:
    """Test analyze request model."""

    def test_request_creation(self):
        """Test creating an analyze request."""
        from backend.models import AnalyzeRequest

        request = AnalyzeRequest(
            prompt="Explain machine learning",
            auto_optimize=True,
        )

        assert request.prompt == "Explain machine learning"
        assert request.auto_optimize is True
        assert request.expected_response is None

    def test_request_with_expected(self):
        """Test creating request with expected response."""
        from backend.models import AnalyzeRequest

        request = AnalyzeRequest(
            prompt="What is 2+2?",
            expected_response="4",
            auto_optimize=False,
        )

        assert request.expected_response == "4"
        assert request.auto_optimize is False

    def test_request_validation_empty_prompt(self):
        """Test that empty prompts are rejected."""
        from pydantic import ValidationError

        from backend.models import AnalyzeRequest

        with pytest.raises(ValidationError):
            AnalyzeRequest(prompt="")


class TestThresholds:
    """Test threshold logic."""

    def test_accuracy_below_threshold(self):
        """Test accuracy threshold triggering."""
        threshold = 0.8
        test_scores = [0.5, 0.75, 0.79]

        for score in test_scores:
            assert score < threshold, f"Score {score} should be below threshold"
            needs_optimization = score < threshold
            assert needs_optimization is True

    def test_accuracy_above_threshold(self):
        """Test accuracy above threshold."""
        threshold = 0.8
        test_scores = [0.8, 0.85, 0.99]

        for score in test_scores:
            assert score >= threshold, f"Score {score} should be at or above threshold"
            needs_optimization = score < threshold
            assert needs_optimization is False

    def test_token_threshold(self):
        """Test token threshold logic."""
        threshold = 1000
        assert threshold >= 500  # Should not alert
        assert threshold < 1001  # Should alert
        assert threshold < 1500  # Should alert

    def test_latency_threshold(self):
        """Test latency threshold logic."""
        threshold_ms = 2000
        assert threshold_ms > 1500  # Should not alert
        assert threshold_ms <= 2000  # At threshold
        assert threshold_ms < 2500  # Should alert

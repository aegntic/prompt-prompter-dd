"""
Tests for the FastAPI endpoints.
Uses TestClient for synchronous testing.
"""



class TestModelsImport:
    """Test that models can be imported correctly."""

    def test_import_models(self):
        """Test importing all models."""
        from models import (
            AnalyzeRequest,
            AnalyzeResponse,
            ErrorResponse,
            HealthResponse,
            MetricsBreakdown,
            OptimizationResult,
        )

        assert AnalyzeRequest is not None
        assert AnalyzeResponse is not None
        assert MetricsBreakdown is not None
        assert OptimizationResult is not None
        assert HealthResponse is not None
        assert ErrorResponse is not None


class TestConfigImport:
    """Test configuration loading."""

    def test_settings_creation(self):
        """Test that settings can be created from env vars."""
        import os

        # Set required env vars
        os.environ["DD_API_KEY"] = "test-api-key"
        os.environ["GOOGLE_CLOUD_PROJECT"] = "test-project-id"

        # Need to reimport to pick up new env vars (bypass cache)
        from config import Settings

        settings = Settings()

        assert settings.dd_api_key == "test-api-key"
        assert settings.google_cloud_project == "test-project-id"
        assert settings.dd_service == "prompt-prompter"

    def test_default_values(self):
        """Test that defaults are set correctly."""
        from config import Settings

        settings = Settings(
            dd_api_key="test-key",
            google_cloud_project="test-project",
        )

        assert settings.dd_site == "datadoghq.com"
        assert settings.dd_env == "dev"
        assert settings.port == 7860
        assert settings.accuracy_threshold == 0.8
        assert settings.token_threshold == 1000
        assert settings.latency_threshold_ms == 2000


class TestHealthResponseModel:
    """Test health response model."""

    def test_health_response_healthy(self):
        """Test creating a healthy response."""
        from models import HealthResponse

        response = HealthResponse(
            status="healthy",
            service="prompt-prompter",
            version="0.1.0",
            datadog_connected=True,
            vertex_ai_connected=True,
        )

        assert response.status == "healthy"
        assert response.datadog_connected is True
        assert response.vertex_ai_connected is True

    def test_health_response_degraded(self):
        """Test creating a degraded response."""
        from models import HealthResponse

        response = HealthResponse(
            status="degraded",
            service="prompt-prompter",
            version="0.1.0",
            datadog_connected=True,
            vertex_ai_connected=False,
        )

        assert response.status == "degraded"
        assert response.vertex_ai_connected is False


class TestErrorResponse:
    """Test error response model."""

    def test_error_response(self):
        """Test creating an error response."""
        from models import ErrorResponse

        error = ErrorResponse(
            error="Analysis failed",
            detail="Connection timeout",
            trace_id="abc123",
        )

        assert error.error == "Analysis failed"
        assert error.detail == "Connection timeout"
        assert error.trace_id == "abc123"

    def test_error_response_minimal(self):
        """Test creating minimal error response."""
        from models import ErrorResponse

        error = ErrorResponse(error="Unknown error")

        assert error.error == "Unknown error"
        assert error.detail is None
        assert error.trace_id is None


class TestAnalyzeResponseModel:
    """Test analyze response model."""

    def test_full_response(self):
        """Test creating a full analyze response."""
        from models import AnalyzeResponse, MetricsBreakdown, OptimizationResult

        metrics = MetricsBreakdown(
            accuracy_score=0.75,
            semantic_similarity=0.8,
            hallucination_score=0.2,
            input_tokens=100,
            output_tokens=200,
            total_tokens=300,
            latency_ms=1500.0,
            estimated_cost_usd=0.0001,
        )

        optimization = OptimizationResult(
            optimized_prompt="Improved prompt here",
            improvement_explanation="Added specificity",
            expected_score_improvement=0.2,
        )

        response = AnalyzeResponse(
            original_prompt="Test prompt",
            llm_response="LLM response here",
            metrics=metrics,
            optimization=optimization,
            trace_id="trace-123",
            status="success",
        )

        assert response.original_prompt == "Test prompt"
        assert response.metrics.accuracy_score == 0.75
        assert response.optimization is not None
        assert response.optimization.expected_score_improvement == 0.2

    def test_response_without_optimization(self):
        """Test response when no optimization needed."""
        from models import AnalyzeResponse, MetricsBreakdown

        metrics = MetricsBreakdown(
            accuracy_score=0.95,  # Above threshold
            semantic_similarity=0.9,
            hallucination_score=0.1,
            input_tokens=50,
            output_tokens=100,
            total_tokens=150,
            latency_ms=800.0,
            estimated_cost_usd=0.00005,
        )

        response = AnalyzeResponse(
            original_prompt="Good prompt",
            llm_response="Good response",
            metrics=metrics,
            optimization=None,  # No optimization needed
            trace_id="trace-456",
            status="success",
        )

        assert response.optimization is None
        assert response.metrics.accuracy_score == 0.95

"""
Application configuration using Pydantic Settings.
Loads environment variables for Datadog and Vertex AI.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Datadog Configuration
    dd_api_key: str = Field(..., alias="DD_API_KEY")
    dd_app_key: str = Field(default="", alias="DD_APP_KEY")
    dd_site: str = Field(default="datadoghq.com", alias="DD_SITE")
    dd_service: str = Field(default="prompt-prompter", alias="DD_SERVICE")
    dd_env: str = Field(default="dev", alias="DD_ENV")

    # Google Cloud / Vertex AI Configuration
    google_cloud_project: str = Field(..., alias="GOOGLE_CLOUD_PROJECT")
    google_application_credentials: str = Field(
        default="", alias="GOOGLE_APPLICATION_CREDENTIALS"
    )
    vertex_location: str = Field(default="us-central1", alias="VERTEX_LOCATION")

    # Application Settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=7860, alias="PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # Model Configuration
    gemini_model: str = Field(default="gemini-2.0-flash-exp", alias="GEMINI_MODEL")
    optimizer_model: str = Field(default="gemini-2.0-flash-exp", alias="OPTIMIZER_MODEL")

    # Thresholds for alerting
    accuracy_threshold: float = Field(default=0.8, description="Minimum acceptable accuracy")
    token_threshold: int = Field(default=1000, description="Maximum acceptable tokens")
    latency_threshold_ms: float = Field(default=2000, description="Maximum acceptable latency (ms)")

    # Pricing (per 1M tokens) - Gemini 2.0 Flash pricing
    input_price_per_million: float = Field(default=0.10)
    output_price_per_million: float = Field(default=0.40)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

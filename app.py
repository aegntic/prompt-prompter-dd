"""
Your Prompts Favourite Prompter - Main Application
FastAPI backend + Gradio UI with full Datadog observability.

Tagline: "Crafting perfect prompts, effortlessly – AI that optimizes AI."
"""

import logging
import os
from contextlib import asynccontextmanager

# import gradio as gr  # React frontend used instead
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load environment variables FIRST
load_dotenv()

# Initialize Datadog BEFORE other imports that might use it
from datadog import initialize as dd_initialize  # noqa: E402
from datadog import statsd  # noqa: E402
from ddtrace import patch_all, tracer  # noqa: E402

# Patch all supported libraries for automatic tracing
patch_all()

from config import get_settings  # noqa: E402
from models import AnalyzeRequest, AnalyzeResponse, ErrorResponse, HealthResponse  # noqa: E402
from prompt_engine import get_engine  # noqa: E402

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Initialize Datadog
dd_initialize(
    api_key=settings.dd_api_key,
    app_key=settings.dd_app_key if settings.dd_app_key else None,
    statsd_host=os.getenv("DD_AGENT_HOST", "localhost"),
    statsd_port=int(os.getenv("DD_DOGSTATSD_PORT", 8125)),
)

# Configure tracer - already configured via dd.initialize

logger.info(f"Datadog initialized with service={settings.dd_service}, env={settings.dd_env}")


# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown."""
    # Startup
    logger.info("Starting Your Prompts Favourite Prompter...")
    logger.info(f"Connecting to Vertex AI project: {settings.google_cloud_project}")

    # Initialize the engine (validates connections)
    try:
        _ = get_engine()  # Validates connection
        logger.info("PromptEngine initialized successfully")

        # Send startup event to Datadog
        statsd.event(
            title="Service Started",
            message=f"prompt-prompter started in {settings.dd_env} environment",
            alert_type="info",
            tags=[f"service:{settings.dd_service}", f"env:{settings.dd_env}"],
        )
    except Exception as e:
        logger.error(f"Failed to initialize PromptEngine: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Your Prompts Favourite Prompter...")
    statsd.event(
        title="Service Stopped",
        message=f"prompt-prompter stopped in {settings.dd_env} environment",
        alert_type="info",
        tags=[f"service:{settings.dd_service}", f"env:{settings.dd_env}"],
    )


# Create FastAPI app
app = FastAPI(
    title="Your Prompts Favourite Prompter",
    description="Intelligent prompt debugger with Datadog observability. AI that optimizes AI.",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse, tags=["Health"])
@tracer.wrap(service="prompt-prompter", resource="health_check")
async def health_check():
    """Health check endpoint for monitoring."""
    # Check Vertex AI connection
    vertex_connected = False
    datadog_connected = False

    try:
        engine = get_engine()
        vertex_connected = engine.llm is not None
    except Exception as e:
        logger.warning(f"Vertex AI connection check failed: {e}")

    try:
        # Simple statsd ping to check Datadog
        statsd.increment("health.check", tags=[f"service:{settings.dd_service}"])
        datadog_connected = True
    except Exception as e:
        logger.warning(f"Datadog connection check failed: {e}")

    return HealthResponse(
        status="healthy" if (vertex_connected and datadog_connected) else "degraded",
        service=settings.dd_service,
        version="0.1.0",
        datadog_connected=datadog_connected,
        vertex_ai_connected=vertex_connected,
    )


@app.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
@tracer.wrap(service="prompt-prompter", resource="analyze_prompt")
async def analyze_prompt(request: AnalyzeRequest):
    """
    Analyze a prompt: execute with Gemini, evaluate quality, and optionally optimize.

    Metrics streamed to Datadog:
    - prompt.accuracy (gauge): 0-1 quality score
    - prompt.tokens (count): total tokens used
    - prompt.latency_ms (timing): request duration
    - prompt.cost_usd (gauge): estimated cost
    - prompt.hallucination (gauge): hallucination risk score
    """
    # Get current trace ID for correlation
    current_span = tracer.current_span()
    trace_id = str(current_span.trace_id) if current_span else "unknown"

    try:
        engine = get_engine()

        # Run the full analysis pipeline
        llm_response, metrics, optimization = engine.analyze(
            prompt=request.prompt,
            expected_response=request.expected_response,
            auto_optimize=request.auto_optimize,
        )

        # Log the analysis
        logger.info(
            f"Analyzed prompt: score={metrics.accuracy_score:.2f}, "
            f"tokens={metrics.total_tokens}, latency={metrics.latency_ms:.0f}ms"
        )

        return AnalyzeResponse(
            original_prompt=request.prompt,
            llm_response=llm_response,
            metrics=metrics,
            optimization=optimization,
            trace_id=trace_id,
            status="success",
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        statsd.increment(
            "prompt.errors",
            tags=[
                f"service:{settings.dd_service}",
                f"env:{settings.dd_env}",
                f"error_type:{type(e).__name__}",
            ],
        )
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error="Analysis failed",
                detail=str(e),
                trace_id=trace_id,
            ).model_dump(),
        ) from e


# ============================================================================
# Static Files & React Frontend
# ============================================================================


@app.get("/api/config")
async def get_config():
    """Client configuration for the frontend."""
    return {
        "dd_dashboard_url": "https://p.ap2.datadoghq.com/sb/e7107bb6-dedc-11f0-8f34-9215226a99ef-ebb749505e6e5f9042d09966492f9f68?tv_mode=true&theme=dark&hide_title=true",
        "service": settings.dd_service,
        "env": settings.dd_env,
    }


# Mount static files for UI assets (from static dir if needed)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve React frontend
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend/dist")
if os.path.exists(frontend_dist):
    app.mount(
        "/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets"
    )

    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        """Serve the React application."""
        # Check if requested path is an API call
        if rest_of_path.startswith("api/") or rest_of_path in ["analyze", "health", "config"]:
            raise HTTPException(status_code=404)

        # Serve index.html for all other routes to support React Router (if any)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    logger.warning(f"Frontend dist directory not found at {frontend_dist}")


# ============================================================================
# Main Entry Point
# ============================================================================


def main():
    """Run the application."""
    import uvicorn

    logger.info(f"Starting server on {settings.host}:{settings.port}")
    logger.info(f"Datadog service: {settings.dd_service}, env: {settings.dd_env}")
    logger.info(f"Vertex AI project: {settings.google_cloud_project}")

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()

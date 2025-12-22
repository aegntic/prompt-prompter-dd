"""
Your Prompts Favourite Prompter - Main Application
FastAPI backend + Gradio UI with full Datadog observability.

Tagline: "Crafting perfect prompts, effortlessly – AI that optimizes AI."
"""

import logging
import os
from contextlib import asynccontextmanager

import gradio as gr
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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
# Gradio UI
# ============================================================================


def create_gradio_interface() -> gr.Blocks:
    """Create the Gradio UI for interactive prompt analysis."""

    def analyze_ui(
        prompt: str,
        expected_response: str | None,
        auto_optimize: bool,
    ) -> tuple[str, str, str, str, str]:
        """UI handler for prompt analysis."""
        if not prompt or not prompt.strip():
            return "Error: Please enter a prompt", "", "", "", ""

        try:
            engine = get_engine()

            # Run analysis
            llm_response, metrics, optimization = engine.analyze(
                prompt=prompt.strip(),
                expected_response=expected_response.strip() if expected_response else None,
                auto_optimize=auto_optimize,
            )

            # Format metrics display
            metrics_display = f"""### 📊 Metrics Breakdown

| Metric | Value | Status |
|--------|-------|--------|
| **Accuracy Score** | {metrics.accuracy_score:.2%} | {"✅" if metrics.accuracy_score >= 0.8 else "⚠️"} |
| **Semantic Similarity** | {metrics.semantic_similarity:.2%} | {"✅" if metrics.semantic_similarity >= 0.7 else "⚠️"} |
| **Hallucination Risk** | {metrics.hallucination_score:.2%} | {"✅" if metrics.hallucination_score <= 0.3 else "⚠️"} |
| **Total Tokens** | {metrics.total_tokens:,} | {"✅" if metrics.total_tokens <= 1000 else "⚠️"} |
| **Latency** | {metrics.latency_ms:.0f}ms | {"✅" if metrics.latency_ms <= 2000 else "⚠️"} |
| **Estimated Cost** | ${metrics.estimated_cost_usd:.6f} | ℹ️ |
"""

            # Format optimization result
            if optimization:
                optimization_display = f"""### 🔧 Optimization Applied

**Optimized Prompt:**
```
{optimization.optimized_prompt}
```

**Changes Made:**
{optimization.improvement_explanation}

**Expected Improvement:** +{optimization.expected_score_improvement:.1%}
"""
            else:
                optimization_display = "✅ No optimization needed - score above threshold!"

            return (
                llm_response,
                metrics_display,
                optimization_display,
                f"✅ Analysis complete (Score: {metrics.accuracy_score:.2%})",
                optimization.optimized_prompt if optimization else prompt,
            )

        except Exception as e:
            logger.error(f"UI analysis failed: {e}", exc_info=True)
            return f"❌ Error: {str(e)}", "", "", f"❌ Failed: {str(e)}", ""

    # Build the Gradio interface
    with gr.Blocks(
        title="Your Prompts Favourite Prompter",
        theme=gr.themes.Soft(
            primary_hue="blue",
            secondary_hue="purple",
        ),
        css="""
        .gradio-container { max-width: 1200px; margin: auto; }
        .main-header { text-align: center; margin-bottom: 1rem; }
        .main-header h1 { color: #2563eb; }
        .metric-box { padding: 1rem; border-radius: 8px; background: #f8fafc; }
        """,
    ) as interface:
        gr.Markdown(
            """
            # 🎯 Your Prompts Favourite Prompter

            **Crafting perfect prompts, effortlessly – AI that optimizes AI.**

            Enter your prompt below. We'll analyze it with Gemini, evaluate quality metrics,
            and automatically optimize if the score is below threshold. All metrics stream
            to Datadog in real-time.
            """,
            elem_classes=["main-header"],
        )

        with gr.Row():
            with gr.Column(scale=1):
                # Input section
                gr.Markdown("### 📝 Input")
                prompt_input = gr.Textbox(
                    label="Your Prompt",
                    placeholder="Enter the prompt you want to analyze...",
                    lines=4,
                    max_lines=10,
                )
                expected_input = gr.Textbox(
                    label="Expected Response (Optional)",
                    placeholder="If you have an expected/ideal response, enter it here for better accuracy scoring...",
                    lines=3,
                    max_lines=6,
                )
                auto_optimize_checkbox = gr.Checkbox(
                    label="Auto-optimize if score below 80%",
                    value=True,
                )
                analyze_btn = gr.Button("🔍 Analyze Prompt", variant="primary", size="lg")
                status_output = gr.Textbox(label="Status", interactive=False)

            with gr.Column(scale=1):
                # Output section
                gr.Markdown("### 🤖 LLM Response")
                response_output = gr.Textbox(
                    label="Gemini Response",
                    lines=6,
                    max_lines=12,
                    interactive=False,
                )

        with gr.Row():
            with gr.Column(scale=1):
                metrics_output = gr.Markdown(
                    label="Metrics",
                    value="*Metrics will appear here after analysis*",
                )

            with gr.Column(scale=1):
                optimization_output = gr.Markdown(
                    label="Optimization",
                    value="*Optimization suggestions will appear here*",
                )

        with gr.Accordion("📋 Optimized Prompt (Copy Ready)", open=False):
            optimized_prompt_output = gr.Textbox(
                label="Optimized Prompt",
                lines=4,
                interactive=False,
            )

        # Wire up the analyze button
        analyze_btn.click(
            fn=analyze_ui,
            inputs=[prompt_input, expected_input, auto_optimize_checkbox],
            outputs=[
                response_output,
                metrics_output,
                optimization_output,
                status_output,
                optimized_prompt_output,
            ],
        )

        # Example prompts
        gr.Markdown("### 💡 Example Prompts")
        gr.Examples(
            examples=[
                ["tell me about dogs", "", True],
                ["Write code", "", True],
                [
                    "Explain quantum entanglement in simple terms suitable for a high school physics student, using at least one real-world analogy.",
                    "",
                    False,
                ],
                [
                    "make website",
                    "Create a responsive website with HTML, CSS, and JavaScript featuring a navigation bar, hero section, and contact form.",
                    True,
                ],
            ],
            inputs=[prompt_input, expected_input, auto_optimize_checkbox],
            label="Try these examples",
        )

        gr.Markdown(
            """
            ---
            **📊 Datadog Integration:** All metrics stream to Datadog in real-time:
            `prompt.accuracy`, `prompt.tokens`, `prompt.latency_ms`, `prompt.cost_usd`

            Built for the **Datadog Hackathon** 🐕 | Powered by **Vertex AI Gemini** ✨
            """
        )

    return interface


# Mount Gradio app
gradio_app = create_gradio_interface()
app = gr.mount_gradio_app(app, gradio_app, path="/")


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

# Prompt Prompter - Context & Guide

## Project Overview

**Prompt Prompter** is an observability-first prompt engineering platform built for the Datadog Hackathon. It integrates **Google Vertex AI Gemini** with **Datadog** to provide real-time metrics, tracing, and autonomous self-healing for LLM prompts.

**Key Value Proposition:**
- **Observability:** Streams accuracy, token usage, latency, and cost metrics to Datadog.
- **Auto-Healing:** Automatically optimizes prompts that fail accuracy thresholds (<80%).
- **Traceability:** Full distributed tracing from API request to LLM generation.

## Technical Architecture

*   **Backend:** Python 3.11+ using `FastAPI`.
    *   **LLM Provider:** Vertex AI Gemini 2.0 (via `google-cloud-aiplatform`).
    *   **Observability:** `ddtrace` for APM, `datadog` (statsd) for custom metrics.
    *   **Package Manager:** `uv`.
*   **Frontend:** React 18 + TypeScript (Vite).
    *   **UI:** Modern dark-mode interface with embedded Datadog dashboards.
*   **Infrastructure:** Docker, Google Cloud Run.

## Key Files & Directories

### Root Directory
*   `app.py`: The main FastAPI application. Initializes Datadog, serves the React frontend, and handles API requests (`/analyze`, `/health`).
*   `prompt_engine.py`: Core logic for interacting with Vertex AI. Handles prompt execution, evaluation (scoring), and optimization loops.
*   `traffic_gen.py`: Script to generate synthetic traffic (good/bad prompts) to trigger Datadog alerts and monitors during demos.
*   `config.py`: Environment configuration management.
*   `models.py`: Pydantic models for API request/response structures.
*   `service.yaml`: Cloud Run service configuration.
*   `docker-compose.yml`: Local stack setup including the app and Datadog agent.

### Configuration (`datadog-config/`)
Contains JSON exports for Datadog assets:
*   `dashboard.json`: The main "Prompt Prompter" dashboard.
*   `monitors.json`: Alert configurations (Low Accuracy, High Tokens, etc.).
*   `slos.json`: Service Level Objectives definition.

### Demo Assets (`demo_production/`, `demo_stills/`)
*   `demo_production/`: Scripts and output folder for assembling the final demo video.
*   `demo_stills/`: Contains raw video takes and generated static images for the demo video production. **Note:** This folder contains video files that may need assessment or renaming.

## Development & Usage

### Prerequisites
*   Python 3.11+
*   Node.js 18+
*   `uv` (Universal Python Package Manager)
*   Google Cloud Credentials (ADC)
*   Datadog API/APP Keys

### Running Locally

1.  **Backend & Frontend (via FastAPI):**
    ```bash
    # Install dependencies
    uv sync
    
    # Run the server (Port 7860)
    uv run python app.py
    ```

2.  **Frontend (Standalone Dev):**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Generating Traffic (for Demos)
Use the traffic generator to simulate user activity and trigger self-healing flows:
```bash
# Generate 50 requests with a 60% failure rate
uv run python traffic_gen.py --requests 50 --bad-ratio 0.6
```

## Observability Metrics

The application emits the following custom metrics to Datadog:
*   `prompt.accuracy`: 0-1 score indicating response quality.
*   `prompt.tokens`: Total tokens consumed.
*   `prompt.latency_ms`: Execution time.
*   `prompt.cost_usd`: Estimated cost of the call.
*   `prompt.optimizations`: Count of auto-optimization events triggered.

## Demo Script Context
The project includes a "Master Script" for a 2:48 dual-voice demo video (Narrator "Snoop" + Dev "Aussie"). The script focuses on the "Closed Remediation Loop" where observability drives autonomous healing.

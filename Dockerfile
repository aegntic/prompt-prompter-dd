# Stage 1: Build Frontend with Bun
FROM oven/bun:1-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN bun install
COPY frontend/ ./
RUN bun run build

# Stage 2: Build Backend with UV
FROM python:3.11-slim AS backend-builder

# Install UV
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy dependency files first (for layer caching)
COPY pyproject.toml README.md ./

# Create virtual environment and install dependencies
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install .

# Stage 3: Runtime
FROM python:3.11-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy virtual environment from transformer
COPY --from=backend-builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY backend/ ./backend/
COPY static/ ./static/
# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist/ ./backend/frontend/dist/

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
# USER appuser

# Environment variables for Datadog Agent
# These are set at runtime, not build time
ENV DD_TRACE_ENABLED=true
ENV DD_LOGS_INJECTION=true
ENV DD_PROFILING_ENABLED=false
ENV DD_APPSEC_ENABLED=false
ENV DD_SITE=ap2.datadoghq.com

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Copy Datadog serverless-init from the official image
COPY --from=gcr.io/datadoghq/serverless-init:1 /datadog-init /app/datadog-init

# Enable Datadog Serverless Init
ENTRYPOINT ["/app/datadog-init"]

# Run the application
CMD ["python", "-m", "backend.app"]

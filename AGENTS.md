# Commands
Python: `pytest tests/` (all tests), `pytest tests/test_api.py -k test_name` (single test), `ruff check .` (lint), `ruff format .` (format), `pre-commit run --all-files`
Frontend: `cd frontend && npm run dev` (dev), `npm run build` (build), `npm run preview`

# Code Style
Python: ruff (line-length=100, py311, double quotes, spaces). Use pydantic models/settings. Import order: stdlib, third-party, local. Use `@tracer.wrap` on endpoints. Log with `logger = logging.getLogger(__name__)`. Handle errors with try/except, log exc_info=True, raise HTTPException.
TypeScript/React: Use interfaces for types, functional components with React.FC, import React explicitly. Use `@/` path alias for root imports.

# Key Patterns
- Config: Use `Settings` from config.py with `@lru_cache get_settings()`
- Tracing: Decorate API endpoints with `@tracer.wrap(service="prompt-prompter", resource="endpoint_name")`
- Metrics: Use `statsd.increment()` and `statsd.event()` for Datadog metrics
- Error responses: Return `ErrorResponse` model with error, detail, trace_id

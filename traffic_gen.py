#!/usr/bin/env python3
"""
Traffic Generator for Your Prompts Favourite Prompter.
Generates a mix of good and bad prompts to stress test the system
and trigger Datadog monitor alerts.

Usage:
    uv run python traffic_gen.py --requests 100 --concurrency 5
"""

import argparse
import asyncio
import logging
import random
import time
from dataclasses import dataclass

import httpx
from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TaskProgressColumn, TextColumn
from rich.table import Table

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()


# ============================================================================
# Test Prompts - Mix of Good and Bad
# ============================================================================

# Bad prompts - vague, verbose, or ambiguous (should trigger low accuracy)
BAD_PROMPTS = [
    "explain stuff",
    "write code",
    "help me",
    "do the thing",
    "make it work",
    "tell me about it",
    "what is the thing that does the other thing",
    "I need something that can do everything and nothing at the same time maybe",
    "fix this but I won't tell you what's broken",
    "make website good",
    "write a very very very very very very very very very very very very long essay about every single aspect of everything in the entire universe covering all topics from the beginning of time until the end discussing philosophy science art music history geography mathematics physics chemistry biology astronomy cosmology quantum mechanics relativity thermodynamics",
    "code",
    "?",
    "yes",
    "no maybe",
    "the a an",
    "do",
    "???",
    "make app like uber but for dogs but also not for dogs",
    "I want to but I don't know what I want",
    "something something dark side",
    "asdfghjkl",
    "write python code to do the thing with the stuff using the library that I cant remember the name of",
    "explain machine learning in a way that is both simple and complex",
    "create a function",
    "build me a startup",
    "make money",
    "fix bug",
    "why doesnt it work",
    "help code broken",
]

# Good prompts - clear, specific, well-structured
GOOD_PROMPTS = [
    "Explain the difference between TCP and UDP protocols, including when to use each one, in 3-4 paragraphs suitable for a junior developer.",
    "Write a Python function called 'calculate_compound_interest' that takes principal (float), rate (float as decimal), time (int years), and compounds_per_year (int) as parameters and returns the final amount.",
    "List the top 5 best practices for writing maintainable React components, with a brief explanation for each.",
    "Describe the CAP theorem in distributed systems. Explain each letter (Consistency, Availability, Partition tolerance) and provide one real-world example of a system that prioritizes each pair.",
    "Create a SQL query that finds all customers who have placed more than 3 orders in the last 30 days, ordered by total order value descending.",
    "Explain how HTTPS encryption works during the TLS handshake, step by step, for someone with basic networking knowledge.",
    "Write a bash script that backs up a directory to S3, compresses it with gzip, and logs the operation with timestamps.",
    "Compare and contrast microservices vs monolithic architecture. Give 3 pros and 3 cons for each approach.",
    "Explain the concept of dependency injection in software engineering with a concrete example in TypeScript.",
    "What are the SOLID principles in object-oriented programming? Provide a one-sentence summary for each.",
]


@dataclass
class RequestResult:
    """Result of a single request."""

    prompt: str
    prompt_type: str  # "good" or "bad"
    accuracy_score: float
    total_tokens: int
    latency_ms: float
    cost_usd: float
    optimized: bool
    success: bool
    error: str | None = None


async def send_request(
    client: httpx.AsyncClient,
    base_url: str,
    prompt: str,
    prompt_type: str,
) -> RequestResult:
    """Send a single analysis request."""
    try:
        response = await client.post(
            f"{base_url}/analyze",
            json={
                "prompt": prompt,
                "auto_optimize": True,
            },
            timeout=60.0,
        )

        if response.status_code == 200:
            data = response.json()
            metrics = data.get("metrics", {})
            optimization = data.get("optimization")

            return RequestResult(
                prompt=prompt[:50] + "..." if len(prompt) > 50 else prompt,
                prompt_type=prompt_type,
                accuracy_score=metrics.get("accuracy_score", 0),
                total_tokens=metrics.get("total_tokens", 0),
                latency_ms=metrics.get("latency_ms", 0),
                cost_usd=metrics.get("estimated_cost_usd", 0),
                optimized=optimization is not None,
                success=True,
            )
        else:
            return RequestResult(
                prompt=prompt[:50] + "...",
                prompt_type=prompt_type,
                accuracy_score=0,
                total_tokens=0,
                latency_ms=0,
                cost_usd=0,
                optimized=False,
                success=False,
                error=f"HTTP {response.status_code}",
            )

    except Exception as e:
        return RequestResult(
            prompt=prompt[:50] + "...",
            prompt_type=prompt_type,
            accuracy_score=0,
            total_tokens=0,
            latency_ms=0,
            cost_usd=0,
            optimized=False,
            success=False,
            error=str(e),
        )


async def run_traffic_test(
    base_url: str,
    total_requests: int,
    concurrency: int,
    bad_ratio: float,
) -> list[RequestResult]:
    """Run the traffic generation test."""
    results: list[RequestResult] = []
    semaphore = asyncio.Semaphore(concurrency)

    # Generate prompts with specified bad ratio
    prompts = []
    for _ in range(total_requests):
        if random.random() < bad_ratio:
            prompts.append((random.choice(BAD_PROMPTS), "bad"))
        else:
            prompts.append((random.choice(GOOD_PROMPTS), "good"))

    async def bounded_request(client: httpx.AsyncClient, prompt: str, prompt_type: str):
        async with semaphore:
            return await send_request(client, base_url, prompt, prompt_type)

    async with httpx.AsyncClient() as client:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(
                f"Sending {total_requests} requests...",
                total=total_requests,
            )

            tasks = [
                bounded_request(client, prompt, prompt_type) for prompt, prompt_type in prompts
            ]

            for coro in asyncio.as_completed(tasks):
                result = await coro
                results.append(result)
                progress.update(task, advance=1)

    return results


def print_summary(results: list[RequestResult]):
    """Print a summary of the test results."""
    successful = [r for r in results if r.success]
    failed = [r for r in results if not r.success]

    bad_prompts = [r for r in successful if r.prompt_type == "bad"]
    good_prompts = [r for r in successful if r.prompt_type == "good"]

    optimized = [r for r in successful if r.optimized]
    low_accuracy = [r for r in successful if r.accuracy_score < 0.8]
    high_tokens = [r for r in successful if r.total_tokens > 1000]
    high_latency = [r for r in successful if r.latency_ms > 2000]

    # Summary table
    table = Table(title="📊 Traffic Test Summary", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="magenta")
    table.add_column("Status", style="green")

    table.add_row("Total Requests", str(len(results)), "✅")
    table.add_row("Successful", str(len(successful)), "✅" if len(successful) > 0 else "❌")
    table.add_row("Failed", str(len(failed)), "⚠️" if len(failed) > 0 else "✅")
    table.add_row("", "", "")
    table.add_row("Bad Prompts Sent", str(len(bad_prompts)), "📝")
    table.add_row("Good Prompts Sent", str(len(good_prompts)), "📝")
    table.add_row("", "", "")
    table.add_row(
        "Low Accuracy (<80%)",
        str(len(low_accuracy)),
        "🚨 ALERT" if len(low_accuracy) > 0 else "✅",
    )
    table.add_row(
        "High Tokens (>1000)",
        str(len(high_tokens)),
        "🚨 ALERT" if len(high_tokens) > 0 else "✅",
    )
    table.add_row(
        "High Latency (>2s)",
        str(len(high_latency)),
        "🚨 ALERT" if len(high_latency) > 0 else "✅",
    )
    table.add_row("Auto-Optimized", str(len(optimized)), "🔧")

    console.print(table)

    # Metrics averages
    if successful:
        avg_accuracy = sum(r.accuracy_score for r in successful) / len(successful)
        avg_tokens = sum(r.total_tokens for r in successful) / len(successful)
        avg_latency = sum(r.latency_ms for r in successful) / len(successful)
        total_cost = sum(r.cost_usd for r in successful)

        metrics_table = Table(title="📈 Average Metrics", show_header=True)
        metrics_table.add_column("Metric", style="cyan")
        metrics_table.add_column("Bad Prompts", style="red")
        metrics_table.add_column("Good Prompts", style="green")
        metrics_table.add_column("Overall", style="yellow")

        if bad_prompts:
            bad_avg_acc = sum(r.accuracy_score for r in bad_prompts) / len(bad_prompts)
            bad_avg_tok = sum(r.total_tokens for r in bad_prompts) / len(bad_prompts)
            bad_avg_lat = sum(r.latency_ms for r in bad_prompts) / len(bad_prompts)
        else:
            bad_avg_acc = bad_avg_tok = bad_avg_lat = 0

        if good_prompts:
            good_avg_acc = sum(r.accuracy_score for r in good_prompts) / len(good_prompts)
            good_avg_tok = sum(r.total_tokens for r in good_prompts) / len(good_prompts)
            good_avg_lat = sum(r.latency_ms for r in good_prompts) / len(good_prompts)
        else:
            good_avg_acc = good_avg_tok = good_avg_lat = 0

        metrics_table.add_row(
            "Accuracy Score",
            f"{bad_avg_acc:.2%}",
            f"{good_avg_acc:.2%}",
            f"{avg_accuracy:.2%}",
        )
        metrics_table.add_row(
            "Avg Tokens",
            f"{bad_avg_tok:.0f}",
            f"{good_avg_tok:.0f}",
            f"{avg_tokens:.0f}",
        )
        metrics_table.add_row(
            "Avg Latency (ms)",
            f"{bad_avg_lat:.0f}",
            f"{good_avg_lat:.0f}",
            f"{avg_latency:.0f}",
        )

        console.print(metrics_table)
        console.print(f"\n💰 Total Estimated Cost: ${total_cost:.6f}")

    # Alert triggers
    if low_accuracy or high_tokens or high_latency:
        console.print(
            Panel(
                f"🚨 [bold red]Datadog Alerts Should Fire![/bold red]\n\n"
                f"• Accuracy <80%: {len(low_accuracy)} requests\n"
                f"• Tokens >1000: {len(high_tokens)} requests\n"
                f"• Latency >2s: {len(high_latency)} requests\n\n"
                f"Check your Datadog dashboard for triggered monitors!",
                title="Alert Summary",
                border_style="red",
            )
        )


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Traffic generator for Your Prompts Favourite Prompter"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:7860",
        help="Base URL of the API (default: http://localhost:7860)",
    )
    parser.add_argument(
        "--requests",
        type=int,
        default=50,
        help="Number of requests to send (default: 50)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=5,
        help="Number of concurrent requests (default: 5)",
    )
    parser.add_argument(
        "--bad-ratio",
        type=float,
        default=0.6,
        help="Ratio of bad prompts to send (default: 0.6 = 60%% bad)",
    )

    args = parser.parse_args()

    console.print(
        Panel(
            f"🚀 [bold]Traffic Generator[/bold]\n\n"
            f"URL: {args.url}\n"
            f"Requests: {args.requests}\n"
            f"Concurrency: {args.concurrency}\n"
            f"Bad Prompt Ratio: {args.bad_ratio:.0%}",
            title="Your Prompts Favourite Prompter",
            border_style="blue",
        )
    )

    start_time = time.time()
    results = asyncio.run(
        run_traffic_test(
            base_url=args.url,
            total_requests=args.requests,
            concurrency=args.concurrency,
            bad_ratio=args.bad_ratio,
        )
    )
    elapsed = time.time() - start_time

    print_summary(results)
    console.print(f"\n⏱️ Total time: {elapsed:.2f}s ({args.requests / elapsed:.1f} req/s)")


if __name__ == "__main__":
    main()

import time
import random
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from datadog import initialize, api

# Load environment variables
load_dotenv()

# Configuration
DD_API_KEY = os.getenv("DD_API_KEY")
DD_APP_KEY = os.getenv("DD_APP_KEY")
DD_SERVICE = os.getenv("DD_SERVICE", "prompt-prompter")
DD_ENV = os.getenv("DD_ENV", "demo")

if not DD_API_KEY or not DD_APP_KEY:
    print("❌ Error: DD_API_KEY and DD_APP_KEY must be set in .env")
    exit(1)

# Initialize Datadog API - IMPORTANT: Use AP2 region to match dashboard
initialize(
    api_key=DD_API_KEY, 
    app_key=DD_APP_KEY,
    api_host='https://api.ap2.datadoghq.com'
)

# Industry Relevant Prompts (Enterprise/DevOps/Security focus)
PROMPTS = [
    # DevOps / SRE
    {"type": "devops", "text": "Analyze these Kubernetes pod logs and explain why the container crashed: [Log Snippet]", "complexity": "high"},
    {"type": "devops", "text": "Generate a Terraform module for a high-availability AWS ECS cluster.", "complexity": "high"},
    {"type": "devops", "text": "Write a bash script to rotate SSL certificates automatically.", "complexity": "medium"},
    
    # Security
    {"type": "security", "text": "Scan this Python code for SQL injection vulnerabilities.", "complexity": "high"},
    {"type": "security", "text": "Draft an incident response email for a potential data breach.", "complexity": "medium"},
    {"type": "security", "text": "Explain the difference between SOC2 Type 1 and Type 2 compliance.", "complexity": "low"},

    # Data Engineering
    {"type": "data", "text": "Write a SQL query to optimize this slow-running join on 10M rows.", "complexity": "high"},
    {"type": "data", "text": "Create a schema for a customer 360 view in BigQuery.", "complexity": "medium"},
    {"type": "data", "text": "Regex to extract phone numbers from this unstructured text.", "complexity": "low"},

    # Legal / Finance
    {"type": "legal", "text": "Summarize this 50-page MSA and highlight indemnity clauses.", "complexity": "high"},
    {"type": "finance", "text": "Forecast Q4 revenue based on these historical CSV data points.", "complexity": "high"},
]

def generate_metrics(start_days_ago=4):
    print(f"🚀 Starting backfill for last {start_days_ago} days...")
    
    end_time = int(time.time())
    start_time = end_time - (start_days_ago * 24 * 60 * 60)
    
    # Generate data points every ~5 minutes (approx 288 points per day)
    # Total points: ~1152 for 4 days
    current_time = start_time
    points_sent = 0
    
    metrics_batch = []
    
    while current_time < end_time:
        # 1. Randomize time slightly (jitter)
        current_time += random.randint(200, 400) # Avg 5 mins
        if current_time > end_time:
            break

        # 2. Select Prompt & Simulate Performance
        prompt = random.choice(PROMPTS)
        
        # Base metrics based on complexity
        if prompt["complexity"] == "high":
            tokens = random.randint(800, 3500)
            latency = random.randint(1500, 4500)
            accuracy_base = 0.75 # Harder prompts fail more
        elif prompt["complexity"] == "medium":
            tokens = random.randint(300, 1000)
            latency = random.randint(500, 1500)
            accuracy_base = 0.85
        else:
            tokens = random.randint(50, 300)
            latency = random.randint(100, 600)
            accuracy_base = 0.95

        # Random variations
        accuracy = min(1.0, max(0.1, random.gauss(accuracy_base, 0.15)))
        cost = (tokens / 1000) * 0.0002 # Mock cost calculation
        hallucination = min(1.0, max(0.0, random.gauss(0.15, 0.1))) # Low hallucination risk
        semantic_similarity = min(1.0, max(0.5, random.gauss(0.85, 0.08))) # High similarity
        
        # Simulate "incidents" (dips in accuracy)
        # Create a bad patch 2 days ago
        days_ago = (end_time - current_time) / 86400
        if 1.8 < days_ago < 2.2: 
            accuracy *= 0.6 # Incident!
            latency *= 1.5
        
        # Tags
        tags = [
            f"service:{DD_SERVICE}",
            f"env:{DD_ENV}",
            f"prompt_type:{prompt['type']}",
            f"complexity:{prompt['complexity']}"
        ]

        # Add to batch
        # Datadog API format: {'metric': 'name', 'points': [(timestamp, value)], 'tags': []}
        # Token tags need type:total for dashboard compatibility
        token_tags = tags + ['type:total']
        
        metrics_batch.extend([
            {'metric': 'prompt.accuracy', 'points': [(current_time, accuracy)], 'tags': tags, 'type': 'gauge'},
            {'metric': 'prompt.tokens', 'points': [(current_time, tokens)], 'tags': token_tags, 'type': 'gauge'},
            {'metric': 'prompt.latency_ms', 'points': [(current_time, latency)], 'tags': tags, 'type': 'gauge'},
            {'metric': 'prompt.cost_usd', 'points': [(current_time, cost)], 'tags': tags, 'type': 'gauge'},
            {'metric': 'prompt.requests', 'points': [(current_time, 1)], 'tags': tags, 'type': 'count'},
            {'metric': 'prompt.hallucination', 'points': [(current_time, hallucination)], 'tags': tags, 'type': 'gauge'},
            {'metric': 'prompt.semantic_similarity', 'points': [(current_time, semantic_similarity)], 'tags': tags, 'type': 'gauge'}
        ])
        
        # Send in batches of 100 points to avoid hitting API limits too hard
        if len(metrics_batch) >= 100:
            try:
                api.Metric.send(metrics=metrics_batch)
                points_sent += len(metrics_batch)
                print(f"Sent {len(metrics_batch)} points... (Current date: {datetime.fromtimestamp(current_time)})")
                metrics_batch = []
                time.sleep(0.5) # Rate limit protection
            except Exception as e:
                print(f"⚠️ Error sending batch: {e}")

    # Send remaining
    if metrics_batch:
        api.Metric.send(metrics=metrics_batch)
        points_sent += len(metrics_batch)

    print(f"✅ Backfill complete! Sent {points_sent} metric points covering {start_days_ago} days.")

if __name__ == "__main__":
    generate_metrics(4)

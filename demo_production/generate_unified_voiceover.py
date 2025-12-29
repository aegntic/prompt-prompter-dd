import asyncio
import os
import edge_tts

# Updated Final Script
TEXT = """
If you are watching this, it means I've done it. I've shipped the thing. 

My personal learning curve leading up to this point has been 100% curiosity driven, starting at zero clue when GPT-3 dropped and being in the deep end ever since. I've personally consumed just shy of 2 billion tokens in 2025—I don't know whether this is an accomplishment or a confession. I have endlessly iterated frameworks, harnesses, and applications beyond submission dates, because nothing is ever... purple enough. Remember to keep it simple and don't say the quiet part out loud... I digress.

Presenting my first hackathon submission. This is Prompt Prompter: your favourite prompt's favourite prompter. An observability-first prompt optimization platform built on Vertex AI Gemini and fully integrated with Datadog. The goal is simple but ambitious: turn prompt quality from an art practice into a measurable, self-healing production service.

Every prompt execution is instrumented end-to-end. We use ddtrace for distributed tracing and statsd to emit custom prompt metrics in real time: accuracy, tokens, latency, cost, and optimizations. These metrics flow instantly to Datadog and are displayed via an embedded dashboard directly inside our application, giving users immediate visibility into performance and spend.

Our observability strategy is built around a closed remediation loop. We created three production-grade Datadog monitors: One—Low Accuracy. Two—High Token Usage. And Three—High Latency. We also defined an SLO: 99% of requests must complete under 2000 ms latency over a 7-day window, with automatic error-budget burn alerts. When any monitor breaches, Datadog creates an incident with full trace context and an attached runbook containing the original prompt, response, and optimization path; exactly what an AI engineer needs to investigate or escalate.

What truly sets us apart is that observability isn't just for humans; it drives autonomous healing. If accuracy falls below 80%, the system automatically invokes Gemini to rewrite the prompt for higher fidelity, lower token count, or faster execution—depending on which metric is most critical. The before-and-after improvement is recorded as a literal step-function in the Datadog dashboard; in our tests this has potential to yield up to 60% higher accuracy and 40% lower cost without manual intervention.

Prompt Prompter transforms prompts from static strings into self-healing infrastructure components, with Datadog as the source of truth for quality, cost, and reliability. 

I keep saying we and our but it's really just me. And I'll be honest with you—it pains me to ship a product when you had such high hopes and it doesn't live up to expectations, and it's just a seed for its full potential. But now I'm starting to sound like my old man.
"""

VOICE = "en-US-GuyNeural" # Natural and expressive

async def generate_voiceover():
    output_dir = "demo_production/audio"
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, "full_voiceover.mp3")

    print(f"Generating final voiceover using {VOICE}...")
    
    # Guy sounds best at a slightly slower rate to catch the emotional nuances of the new script
    communicate = edge_tts.Communicate(TEXT, VOICE, rate="-4%")
    await communicate.save(filepath)
    print(f"Successfully saved to {filepath}")

if __name__ == "__main__":
    asyncio.run(generate_voiceover())

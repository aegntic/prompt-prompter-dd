import asyncio
import os
import edge_tts

# Script content
SCRIPT = [
    {
        "filename": "01_intro_snoop.mp3",
        "speaker": "Snoop",
        "text": "Check it out. My homie here? He's been stressin'. Pure panic mode trying to ship this thing. His learning curve? 100% curiosity driven. Started with zero clue when GPT-3 dropped, and he's been swimmin' in the deep end ever since. Man has consumed... what is it? Two. Billion. Tokens. In 2025 alone. I don't know if that's an accomplishment or a confession, nephew. He's endlessly iterated frameworks, harnesses... missin' submission dates cause nothing is ever... purple enough. He keeps it simple, helps everyone else... but he forgets to say the quiet part out loud. So I'm gonna say it for him."
    },
    {
        "filename": "02_dev_intro.mp3",
        "speaker": "Aussie",
        "text": "Uh... right. Thanks. Presenting my first hackathon submission. This is Prompt Prompter: your favourite prompt's favourite prompter. It's an observability-first prompt optimization platform built on Vertex AI Gemini and fully integrated with Datadog. The goal is simple but ambitious: turn prompt quality from an art practice into a measurable, self-healing production service."
    },
    {
        "filename": "03_dev_who_for.mp3",
        "speaker": "Aussie",
        "text": "If you've ever shipped an LLM feature and watched it silently degrade in production—cost climbing, accuracy tanking, no idea why—this is for you."
    },
    {
        "filename": "04_snoop_metrics_prompt.mp3",
        "speaker": "Snoop",
        "text": "Tell 'em about the metrics. The real-time flow."
    },
    {
        "filename": "05_dev_metrics_detail.mp3",
        "speaker": "Aussie",
        "text": "Every prompt execution is instrumented end-to-end. We use ddtrace for distributed tracing and statsd to emit custom prompt metrics in real time: accuracy, tokens, latency, cost... and optimizations. Watch the dashboard—this run is updating it live. These metrics flow instantly to Datadog and are displayed via an embedded dashboard directly inside the application. Immediate visibility into performance and spend."
    },
    {
        "filename": "06_snoop_remediation_prompt.mp3",
        "speaker": "Snoop",
        "text": "Hold up, hold up. You skippin' the best part. Break down that Closed Remediation Loop. That's the secret sauce."
    },
    {
        "filename": "07_dev_remediation_detail.mp3",
        "speaker": "Aussie",
        "text": "Yeah, the loop. Crucial. We created three production-grade Datadog monitors: One—Low Accuracy. Two—High Token Usage. Three—High Latency. We also defined an SLO: 99% of requests must complete under 2000 ms latency over a 7-day window, with automatic error-budget burn alerts. When any monitor breaches, Datadog creates an incident with full trace context and an attached runbook containing the original prompt, response, and optimization path. Exactly what an AI engineer needs to investigate or escalate."
    },
    {
        "filename": "08_snoop_healing_setup.mp3",
        "speaker": "Snoop",
        "text": "But here's the kicker. Right now, bad prompts are silent budget killers and hallucination generators. Most people just log 'em and shrug. Watch me break it on purpose. See that? Now watch how it heals itself. Autonomous Healing, baby."
    },
    {
        "filename": "09_dev_healing_detail.mp3",
        "speaker": "Aussie",
        "text": "Spot on. Observability isn't just for humans; it drives autonomous healing. If accuracy falls below 80%, the system automatically invokes Gemini to rewrite the prompt—for higher fidelity, lower token count, or faster execution—depending on which metric is most critical. The before-and-after improvement is recorded as a literal step-function in the Datadog dashboard. In our tests, this yields up to 60% higher accuracy and 40% lower cost... without manual intervention."
    },
    {
        "filename": "10_snoop_real_deal.mp3",
        "speaker": "Snoop",
        "text": "Self-healing infrastructure. The real deal."
    },
    {
        "filename": "11_dev_close.mp3",
        "speaker": "Aussie",
        "text": "Prompt Prompter transforms prompts from static strings into living infrastructure components. Datadog becomes the source of truth for quality, cost, and reliability. I keep saying 'we' and 'our' but... it's really just me. And I'll be honest—it pains me to ship something that feels like just a seed of its full potential. But shipping beats perfect."
    },
    {
        "filename": "12_cta_dev.mp3",
        "speaker": "Aussie",
        "text": "Star the repo. Break it. Tell me what's missing."
    },
    {
        "filename": "13_cta_snoop.mp3",
        "speaker": "Snoop",
        "text": "Let's build this together. We out."
    }
]

# Voice selection
# List available voices: edge-tts --list-voices
VOICE_SNOOP = "en-US-ChristopherNeural" # Deep, calm, slightly formal but smooth
# Alt for Snoop: en-US-GuyNeural (More casual)
# Alt for Snoop: en-US-EricNeural (Very deep/assertive)

VOICE_AUSSIE = "en-AU-WilliamNeural" # Standard Aussie male

async def generate_voiceover():
    output_dir = "demo_production/audio"
    os.makedirs(output_dir, exist_ok=True)

    print("Generating voiceovers with Edge TTS (High Quality Free Neural)...")
    
    for item in SCRIPT:
        text = item["text"]
        speaker = item["speaker"]
        filename = item["filename"]
        filepath = os.path.join(output_dir, filename)
        
        voice = VOICE_SNOOP if speaker == "Snoop" else VOICE_AUSSIE
        
        # Adjust rate slightly for pacing
        rate = "-5%" if speaker == "Snoop" else "+5%" 
        # Snoop = slightly slower/cooler
        # Aussie = slightly faster/energetic
        
        print(f"Generating {filename} ({speaker}) using {voice}...")
        
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            await communicate.save(filepath)
            print(f"  -> Saved to {filepath}")
        except Exception as e:
            print(f"  -> Failed: {e}")

if __name__ == "__main__":
    asyncio.run(generate_voiceover())

import os

from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

import vertexai

vertexai.init(project=os.getenv("GCP_PROJECT"), location="us-central1")
from vertexai.generative_models import GenerativeModel

model = GenerativeModel("gemini-3.0-flash-exp")
print("✅ Vertex OK:", model)

from datadog import initialize

initialize(api_key=os.getenv("DD_API_KEY"), site=os.getenv("DD_SITE"))
print("✅ DD OK")

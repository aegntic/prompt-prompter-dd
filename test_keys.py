import os

import vertexai
from datadog import initialize
from dotenv import load_dotenv
from vertexai.generative_models import GenerativeModel

load_dotenv(dotenv_path=".env")

vertexai.init(project=os.getenv("GCP_PROJECT"), location="us-central1")
model = GenerativeModel("gemini-3.0-flash-exp")
print("✅ Vertex OK:", model)

initialize(api_key=os.getenv("DD_API_KEY"), site=os.getenv("DD_SITE"))
print("✅ DD OK")

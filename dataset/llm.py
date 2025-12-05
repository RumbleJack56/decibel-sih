from typing import Dict
import requests
import json, os
import logging
import subprocess
from google import genai
from google.genai.types import CreateBatchJobConfig, JobState, HttpOptions
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from google.genai.batches import Batches
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger(__name__)

class Settings: 
    def __init__(self):
        self.local_region = os.getenv("LOCAL_REGION", None)
        self.model_name = os.getenv("MODEL_NAME", None)
    
settings = Settings()

class LLMError(RuntimeError):
    pass

def call_gemini(prompts: str|list[str]):
    """Call the Gemini LLM endpoint and return the response(s).
        Args:
        prompts: The prompt text or list of prompt texts to send.
        Returns:
        The LLM response text or list of response texts.

        Raises:
        LLMError: if the LLM call fails or returns unexpected format.
    """
    if isinstance(prompts, str):
        prompts = [prompts]
    assert prompts and isinstance(prompts, list), "prompts must be a non-empty list of strings"
    
    creds = service_account.Credentials.from_service_account_file(
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    creds.refresh(Request())

    client = genai.Client(
        http_options=HttpOptions(api_version="v1"),
        vertexai=True,
        credentials=creds,
        location=settings.local_region,
    )
    responses = []
    chunks = client.models.generate_content(
        model=settings.model_name,
        contents=prompts,
    )
    # print(chunks)
    for chunk in chunks:
        print(chunk)
        responses.append(chunk.text)
    return responses


if __name__ == "__main__":

    test_prompts = [
        "Explain the theory of relativity in simple terms.",
        "What are the benefits of using renewable energy sources?"
    ]
    responses = call_gemini(test_prompts)
    for prompt, response in zip(test_prompts, responses):
        print(f"Prompt: {prompt}\nResponse: {response}\n")
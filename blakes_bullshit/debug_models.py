from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Querying available models...")
try:
    # List all models available to your API key
    for model in client.models.list():
        print(f" - {model.name}")
except Exception as e:
    print(f"Error: {e}")
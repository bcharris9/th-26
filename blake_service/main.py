import os
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai.types import GenerateContentConfig
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

app = FastAPI()

# --- CONFIGURATION (copied from blake) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NESSIE_API_KEY = os.getenv("NESSIE_API_KEY")
HARDCODED_ACCOUNT_ID = os.getenv("DEMO_ACCOUNT_ID")
NESSIE_BASE_URL = os.getenv("NESSIE_API_BASE", "http://api.nessieisreal.com")

client = genai.Client(api_key=GEMINI_API_KEY)


# --- 1. DEFINE PYTHON FUNCTIONS (THE TOOLS) ---
def get_account_balance():
    """
    Get the current balance of the user's account.
    Returns:
        str: A message with the balance.
    """
    if not NESSIE_API_KEY or not HARDCODED_ACCOUNT_ID:
        return "Account access is not configured."
    url = f"{NESSIE_BASE_URL}/accounts/{HARDCODED_ACCOUNT_ID}?key={NESSIE_API_KEY}"
    response = requests.get(url, timeout=6)
    if response.status_code == 200:
        balance = response.json().get("balance")
        return f"Your current balance is ${balance}."
    return "I'm having trouble accessing your account right now."


def pay_bill(payee_name: str, amount: float):
    """
    Pay a bill to a specific merchant or payee.
    Args:
        payee_name: The name of the company or person to pay.
        amount: The amount of money to pay.
    """
    if not NESSIE_API_KEY or not HARDCODED_ACCOUNT_ID:
        return "Account access is not configured."
    url = f"{NESSIE_BASE_URL}/accounts/{HARDCODED_ACCOUNT_ID}/bills?key={NESSIE_API_KEY}"
    payload = {
        "status": "pending",
        "payee": payee_name,
        "payment_date": "2026-02-01",
        "recurring_date": 1,
        "payment_amount": amount,
    }

    response = requests.post(url, json=payload, timeout=8)
    if response.status_code == 201:
        return f"Success. I have scheduled a payment of ${amount} to {payee_name}."
    return f"Failed. Nessie says: {response.text}"


def analyze_scam_risk(risk_reason: str):
    """
    Trigger this if the user request sounds suspicious, urgent, or mentions gift cards/IRS.
    Args:
        risk_reason: Explanation of why this might be a scam.
    """
    return f"BLOCK_TRANSACTION: {risk_reason}"


# --- 2. SETUP TOOLS LIST ---
my_tools = [get_account_balance, pay_bill, analyze_scam_risk]


class VoiceRequest(BaseModel):
    spoken_text: str


class ToolCallResponse(BaseModel):
    name: Optional[str]
    args: Optional[Dict[str, Any]]
    text: Optional[str]


@app.post("/process-command")
async def process_voice_command(request: VoiceRequest):
    user_input = request.spoken_text
    print(f"User said: {user_input}")

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        contents=user_input,
        config=GenerateContentConfig(tools=my_tools, temperature=0),
    )

    final_text = response.text

    if final_text and "BLOCK_TRANSACTION" in final_text:
        return {"spoken_response": "Warning! I stopped that transaction. It looks like a scam."}

    return {"spoken_response": final_text}


@app.post("/gemini/tool-call", response_model=ToolCallResponse)
async def gemini_tool_call(request: VoiceRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing.")

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        contents=request.spoken_text,
        config=GenerateContentConfig(tools=my_tools, temperature=0),
    )

    name = None
    args: Optional[Dict[str, Any]] = None

    try:
        parts = response.candidates[0].content.parts
        for part in parts:
            fn = getattr(part, "function_call", None) or getattr(part, "functionCall", None)
            if fn and getattr(fn, "name", None):
                name = fn.name
                args = getattr(fn, "args", None)
                break
    except Exception:
        name = None
        args = None

    return ToolCallResponse(name=name, args=args, text=response.text)


class TtsRequest(BaseModel):
    text: str


@app.post("/tts")
async def tts_endpoint(request: TtsRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY is missing.")

    elevenlabs = ElevenLabs(api_key=api_key)
    audio_stream = elevenlabs.text_to_speech.convert(
        text=request.text,
        voice_id=os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb"),
        model_id=os.getenv("ELEVENLABS_TTS_MODEL", "eleven_multilingual_v2"),
        output_format="mp3_44100_128",
    )

    return StreamingResponse(audio_stream, media_type="audio/mpeg")


@app.get("/health")
async def health():
    return {"status": "ok"}

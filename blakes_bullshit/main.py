import os
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai 
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NESSIE_API_KEY = "b690b1259bed594ba897c45513d7c834"
HARDCODED_ACCOUNT_ID = "69754b1995150878eafeb48f" # Your specific ID
NESSIE_BASE_URL = "http://api.nessieisreal.com"

client = genai.Client(api_key=GEMINI_API_KEY)

# --- 1. DEFINE PYTHON FUNCTIONS (THE TOOLS) ---
def get_account_balance():
    """
    Get the current balance of the user's account.
    Returns:
        str: A message with the balance.
    """
    url = f"{NESSIE_BASE_URL}/accounts/{HARDCODED_ACCOUNT_ID}?key={NESSIE_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        balance = response.json().get('balance')
        return f"Your current balance is ${balance}."
    return "I'm having trouble accessing your account right now."

def pay_bill(payee_name: str, amount: float):
    """
    Pay a bill to a specific merchant or payee.
    Args:
        payee_name: The name of the company or person to pay.
        amount: The amount of money to pay.
    """
    url = f"{NESSIE_BASE_URL}/accounts/{HARDCODED_ACCOUNT_ID}/bills?key={NESSIE_API_KEY}"
    payload = {
        "status": "pending",
        "payee": payee_name,
        "payment_date": "2026-02-01",
        "recurring_date": 1,
        "payment_amount": amount
    }
    
    response = requests.post(url, json=payload)
    if response.status_code == 201:
        return f"Success. I have scheduled a payment of ${amount} to {payee_name}."
    else:
        return f"Failed. Nessie says: {response.text}"

def analyze_scam_risk(risk_reason: str):
    """
    Trigger this if the user request sounds suspicious, urgent, or mentions gift cards/IRS.
    Args:
        risk_reason: Explanation of why this might be a scam.
    """
    return f"BLOCK_TRANSACTION: {risk_reason}"

# --- 2. SETUP TOOLS LIST ---
# In the new SDK, we just put the functions in a list
my_tools = [get_account_balance, pay_bill, analyze_scam_risk]

# --- 3. THE ENDPOINT ---
class VoiceRequest(BaseModel):
    spoken_text: str

@app.post("/process-command")
async def process_voice_command(request: VoiceRequest):
    user_input = request.spoken_text
    print(f"User said: {user_input}")

    # Generate content with automatic tool execution
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=user_input,
        config=GenerateContentConfig(
            tools=my_tools, 
            temperature=0 # Keep it factual
        )
    )
    
    final_text = response.text

    # --- SCAM INTERCEPT LOGIC ---
    if final_text and "BLOCK_TRANSACTION" in final_text:
        return {"spoken_response": "Warning! I stopped that transaction. It looks like a scam."}

    return {"spoken_response": final_text}
import requests
import json
import random
from dotenv import load_dotenv
import os

load_dotenv

# --- CONFIGURATION ---
# Get this from http://api.nessieisreal.com/

API_KEY = "b690b1259bed594ba897c45513d7c834"
BASE_URL = "http://api.nessieisreal.com"

# --- DATA GENERATORS ---
def create_customer():
    print("Creating Customer...")
    url = f"{BASE_URL}/customers?key={API_KEY}"
    payload = {
        "first_name": "Alex",
        "last_name": "Rivera",
        "address": {
            "street_number": "101",
            "street_name": "Hackathon Way",
            "city": "McLean",
            "state": "VA",
            "zip": "22102"
        }
    }
    response = requests.post(url, json=payload)
    if response.status_code == 201:
        data = response.json()
        cust_id = data['objectCreated']['_id']
        print(f"✅ Customer Created: Alex Rivera (ID: {cust_id})")
        return cust_id
    else:
        print(f"❌ Failed to create customer: {response.text}")
        return None

def create_account(customer_id):
    print("\nCreating Checking Account...")
    url = f"{BASE_URL}/customers/{customer_id}/accounts?key={API_KEY}"
    payload = {
        "type": "Checking",
        "nickname": "Alex's Primary Checking",
        "rewards": 0,
        "balance": 5000, # Starting balance of $5,000
        "account_number": "1234567890123456"
    }
    response = requests.post(url, json=payload)
    if response.status_code == 201:
        data = response.json()
        acct_id = data['objectCreated']['_id']
        print(f"✅ Account Created: Checking (ID: {acct_id})")
        return acct_id
    else:
        print(f"❌ Failed to create account: {response.text}")
        return None

def create_bills(account_id):
    print("\nCreating Bills (Payees)...")
    bills = [
        ("Dominion Energy", 120),
        ("Verizon Fios", 85),
        ("State Farm Insurance", 210),
        ("City Water Dept", 45)
    ]
    
    url = f"{BASE_URL}/accounts/{account_id}/bills?key={API_KEY}"
    
    for payee, amount in bills:
        payload = {
            "status": "pending",
            "payee": payee,
            "nickname": f"{payee} Bill",
            "payment_date": "2026-02-01",
            "recurring_date": 1,
            "payment_amount": amount
        }
        response = requests.post(url, json=payload)
        if response.status_code == 201:
            print(f"   - Created Bill: {payee} (${amount})")
        else:
            print(f"   - Failed to create bill for {payee}: {response.text}")

def create_purchases(account_id):
    # Optional: Add some transaction history
    print("\nCreating Recent Purchases...")
    merchants = [
        ("Uber Eats", 25.50, "2026-01-20"),
        ("Shell Station", 45.00, "2026-01-21"),
        ("Netflix", 15.99, "2026-01-15")
    ]
    
    # Note: Nessie requires a Merchant ID for purchases usually, 
    # but strictly speaking we often just mock this or use the 'withdrawals' endpoint 
    # for simplicity in hackathons if merchants aren't set up.
    # We will use 'withdrawals' to simulate debit card usage quickly.
    
    url = f"{BASE_URL}/accounts/{account_id}/withdrawals?key={API_KEY}"
    
    for name, amount, date in merchants:
        payload = {
            "medium": "balance",
            "transaction_date": date,
            "status": "completed",
            "amount": amount,
            "description": name
        }
        requests.post(url, json=payload)
        print(f"   - Created Purchase: {name} (${amount})")

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    if API_KEY == "YOUR_NESSIE_API_KEY_HERE":
        print("STOP! You need to paste your API Key into the script first.")
    else:
        cid = create_customer()
        if cid:
            aid = create_account(cid)
            if aid:
                create_bills(aid)
                create_purchases(aid)
                
                print("\n" + "="*40)
                print("🎉 DATA SEEDING COMPLETE")
                print("="*40)
                print(f"Use this Account ID in your main.py: {aid}")
                print("="*40)
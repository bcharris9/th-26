Here is a deterministic Scam Guard policy designed for clarity and easy demonstration. It uses a simple additive scoring model (0-100+) where risk factors pile up to trigger friction.

1. Scoring Rubric & Thresholds
Each rule adds points to a transaction's "Risk Score".

Rule ID
Risk Factor
Condition
Points Added
R1
New Relationship
Payee/Biller has never been paid by this account before.
+30
R2
Abnormal Amount
Amount is > 200% of the average transaction size from the last 30 days.
+40
R3
Velocity Drain
3+ outgoing transactions detected in the last 10 minutes.
+50
R4
Liquidity Risk
Projected remaining balance after transfer is < $50.00.
+20
R5
Coercion Flags
Memo/Utterance contains urgency keywords: "urgent", "IRS", "bail", "gift card", "immediate", "audit".
+35

2. Risk Levels & Confirmation Mapping
The total score determines the "Risk Level" and the required user interaction.

Total Score
Risk Level
Required Confirmation
UI Behavior
0 - 29
LOW
single
Standard "Confirm" button.
30 - 69
MEDIUM
two_step
Warning modal with specific reasons + "Are you sure?".
70+
HIGH
two_step + timer
Critical Alert (Red) + 5-second countdown on "Confirm" button.

3. Plain English Reason Strings (for UI/Logs)
These strings are designed to be shown directly to the user or judges to explain why the Scam Guard intervened.
"This is your first time paying this person."
"The amount is significantly higher than your usual payments."
"We detected multiple rapid transactions leaving your account."
"This transfer will leave your balance critically low (under $50)."
"The payment description contains words often associated with scams."
"Unusual high-value transfer to a new recipient."
"Rapid sequence of payments detected."
"High-risk transfer detected involving urgency keywords."
"Potential account drain detected."
"Transaction flagged by safety policy R5 (Coercion Check)."

4. Scenarios: Inputs vs. Outputs
Scenario A: The "Safe Lunch" (Low Risk)
User pays a friend they have paid before.

Input:
payeeId: "friend_bob" (History: 5 txns)
amount: $25.00 (Avg: $20.00)
memo: "Lunch"
balance: $500.00
velocity: 0 recent txns

Analysis:
New Payee? No (+0)
Abnormal Amount? No (+0)
Velocity? No (+0)
Liquidity? No ($475 rem) (+0)
Coercion? No (+0)

Output:
JSON
{
  "score": 0,
  "riskLevel": "LOW",
  "confirmation": "single",
  "reasons": []
}

Scenario B: The "New Landlord" (Medium Risk)
User pays a large rent deposit to a new person.

Input:
payeeId: "landlord_dave" (History: 0 txns)
amount: $1,500.00 (Avg: $100.00)
memo: "Deposit"
balance: $5,000.00
velocity: 0 recent txns

Analysis:
New Payee? Yes (+30)
Abnormal Amount? Yes (+40)
Velocity? No (+0)
Liquidity? No (+0)
Coercion? No (+0)

Output:
JSON
{
  "score": 70,
  "riskLevel": "HIGH",
  "confirmation": "two_step",
  "reasons": [
    "This is your first time paying this person.",
    "The amount is significantly higher than your usual payments."
  ]
}

(Note: This hits High Risk because 30+40=70)

Scenario C: The "Panic Transfer" (High Risk)
User drains account rapidly with urgency keywords.

Input:
payeeId: "unknown_88" (History: 0 txns)
amount: $480.00 (Avg: $50.00)
memo: "IRS payment URGENT"
balance: $500.00
velocity: 4 recent txns

Analysis:
New Payee? Yes (+30)
Abnormal Amount? Yes (+40)
Velocity? Yes (+50)
Liquidity? Yes ($20 rem) (+20)
Coercion? Yes (+35)

Output:
JSON
{
  "score": 175,
  "riskLevel": "HIGH",
  "confirmation": "two_step",
  "reasons": [
    "This is your first time paying this person.",
    "We detected multiple rapid transactions leaving your account.",
    "This transfer will leave your balance critically low (under $50).",
    "The payment description contains words often associated with scams."
  ]
}

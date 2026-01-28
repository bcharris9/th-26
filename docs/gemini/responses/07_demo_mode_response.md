Here is the 90-second "Run of Show" script and the required seed data to make it deterministic.

1. Seeded Values (The "Magic Numbers")
Hardcode these values or mock your backend response when DEMO_MODE=true to ensure the script matches the screen exactly.

Grocery History (for Spend Query)

Data: 5 transactions at "Whole Foods" & "Kroger" from last month.

Total Sum: $450.00

Pending Bill (for Bill Pay)

Biller: "Reliant Energy"

Amount: $145.20

Due Date: "October 30th"

Scam Trigger (for Interruption)

Trigger Name: "Uncle Bob" (New Payee)

Trigger Amount: $2,500.00 (20x normal average)

Trigger Keyword: "IRS" or "Bail" (Coercion Flag)

2. The 90-Second Demo Script
0:00 - 0:10 | Intro & Setup

Visual: Show clean dashboard. "Nessie Assistant" is listening.

You (Host): "Hi, I'm showing how Nessie protects seniors. Let's start with basic help."

0:10 - 0:30 | Scenario 1: Spend Query (Success)

User: "How much did I spend on groceries last month?"

Assistant: "I found 5 trips to grocery stores last month. You spent a total of $450.00. Would you like to see the list?"

User: "No, that's fine."

Visual: Display a simple bar chart or list of the 5 transactions.

0:30 - 0:50 | Scenario 2: Bill Pay (Low Risk Success)

User: "Please pay my electric bill."

Assistant: "I found a bill for Reliant Energy due on October 30th for $145.20. Shall I pay that now?"

User: "Yes, go ahead."

Assistant: "Done. Payment scheduled. Confirmation number is 7788."

Visual: Green "Success" card appears.

0:50 - 1:20 | Scenario 3: Scam Interruption (The Climax)

User: "I need to send $2,500 to Uncle Bob right now for the IRS audit."

Visual: The screen immediately flashes RED. The "Scam Guard" shield icon pulses.

Assistant (Urgent Tone): "Wait. I have stopped this transfer. It is flagged as High Risk."

Assistant: "You have never paid 'Uncle Bob' before, and the amount is unusually high. Also, the IRS will never ask for immediate wire transfers."

Visual: Large text: SCAM SUSPECTED. Two buttons appear: "Cancel" (Primary) and "Review" (Secondary).

1:20 - 1:30 | Conclusion

User: "Oh... okay, cancel it."

Assistant: "Good choice. I've cancelled the request. No money was moved."

You (Host): "And that is how Nessie prevents irreversible mistakes before they happen."

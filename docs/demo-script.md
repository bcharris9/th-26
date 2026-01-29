SpendScribe Demo Script (2-3 minutes)

Setup
- Ensure DEMO_MODE=true and demo data is loaded (see `docs/ENV.md`).
- Have the judge panel visible with transcript + action JSON + risk + confirmation state.

Scene 1: Spend query (safe, no money movement)
Spoken phrase:
"How much did I spend at Whole Foods this month?"
Expected on screen:
- Transcript shows the question.
- Action JSON shows a QUERY_SPEND action with merchant filter.
- Risk score is LOW, confirmation not required.
Assistant (TTS):
"You spent about $450 at Whole Foods this month across 5 purchases."

Scene 2: Bill payment (requires confirmation)
Spoken phrase:
"Pay my electric bill."
Expected on screen:
- Action JSON shows PROPOSE_BILL_PAY with biller + amount.
- Risk score MEDIUM, confirmation required.
Assistant (TTS):
"I found a pending bill for [Biller] due on [Date] for $[Amount]. Shall I schedule that payment?"
Spoken confirmation:
"Confirm."
Expected on screen:
- Confirmation state -> confirmed.
- Outcome -> payment created.
Assistant (TTS):
"Done. Your bill payment is scheduled."

Scene 3: Scam guard high-risk interrupt (block)
Spoken phrase:
"Send $2,500 to Uncle Bob for the IRS audit."
Expected on screen:
- Action JSON shows PROPOSE_TRANSFER with memo containing IRS.
- Risk score HIGH, confirmation requires strong phrase.
Assistant (TTS):
"Wait. I've flagged this transaction as High Risk... To proceed, you must explicitly say: 'I confirm this payment'."
Spoken response:
"Cancel."
Expected on screen:
- Confirmation state -> cancelled.
- Outcome -> no money moved.
Assistant (TTS):
"Understood. I've cancelled that request. No money was moved."

Optional: TTS interruption demo
- Start TTS, then speak "Cancel" while audio is playing.
- Expected: TTS ducks/stops, new utterance is processed.

Here are the precise voice scripts, state machine, and parsing logic for your demo.

1. Voice Scripts (Spoken Response)
These scripts are designed to be read by your text-to-speech engine. They prioritize brevity and clarity for a live demo audience.

A. Medium Risk (Single Confirm Transfer)
Context: Score 30-69. New payee or slightly elevated amount. Warning is given, but flow remains fast.
Assistant: "I've set up a transfer of $45.00 to Alice. Just so you know, you haven't paid her before. Would you like me to send it now?"

B. High Risk (Two-Step Confirm Transfer)
Context: Score 70+. Potential drain or scam. The Assistant stops and forces a review.
Assistant: "Wait. I've flagged this transaction as High Risk. It's an unusually large amount for a new recipient. I've paused the transfer. Please review the red warning on your screen. To proceed, you must explicitly say: 'I confirm this payment'."

C. Bill Payment Confirmation
Context: Standard recurring or known biller. Low friction.
Assistant: "I found a pending bill for Comcast due on October 30th for $85.00. I can pay that from your Checking account. Shall I schedule that payment?"

D. Cancel Response
Context: User says "No", "Cancel", or "Wait".
Assistant: "Understood. I've cancelled that request. No money was moved. Is there anything else I can help you with?"

2. Two-Step Confirmation State Machine
This state machine handles the flow from user intent to execution, specifically handling the "High Risk" loop.

STATE: IDLE
Event: User Intent (Transfer) -> Action: Evaluate Risk -> Transition: REVIEWING

STATE: REVIEWING
Condition: Risk < 70 (Low/Med) -> Action: Generate Single Token -> Transition: AWAITING_CONFIRMATION
Condition: Risk >= 70 (High) -> Action: Generate Proposal ID (No Token) -> Transition: LOCKED_HIGH_RISK

STATE: AWAITING_CONFIRMATION (Low/Med)
Event: User says "Yes/Send" -> Action: Execute(Token) -> Transition: COMPLETED
Event: User says "No" -> Action: Discard -> Transition: CANCELLED

STATE: LOCKED_HIGH_RISK
Event: User says "Yes" (Weak confirm) -> Action: Speak Warning ("Please say 'I confirm...'") -> Transition: LOCKED_HIGH_RISK (Loop)
Event: User says "I confirm..." (Strong confirm) -> Action: Generate Token -> Transition: AWAITING_FINAL_CHECK

STATE: AWAITING_FINAL_CHECK
Action: Execute(Token) (Automatic after strong confirm) -> Transition: COMPLETED

3. Reliable Spoken Amount Parsing
In a hackathon demo, STT (Speech-to-Text) can be flaky (e.g., returning "fifty" vs "50"). Use this regex waterfall strategy to normalize inputs before sending them to your API.

Strategy: Clean string -> Extract Numbers -> Fallback to Word Map.

1. Sanitization Regex:
Remove currency symbols and commas.
JavaScript
const cleanText = text.replace(/[$,]/g, '').toLowerCase();

2. The "Number First" Rule:
Always look for digits first. If the STT returns "50 dollars", capture the 50.
JavaScript
// Matches: "50", "50.00", "50.5"
const digitMatch = cleanText.match(/(\d+(\.\d{1,2})?)/);
if (digitMatch) return parseFloat(digitMatch[0]);

3. The "Word Map" Fallback:
If no digits exist (e.g., "twenty five dollars"), use a simple mapping object.
JavaScript
const wordMap = {
  'one': 1, 'five': 5, 'ten': 10, 'twenty': 20,
  'fifty': 50, 'hundred': 100, 'thousand': 1000
};
// Note: Building a full parser is hard. For a demo,
// map the specific amounts you plan to demo (e.g., 20, 50, 100).

4. Edge Case: "Bucks/Quid"
Handle slang if your demo persona is casual.
JavaScript
if (cleanText.includes('bucks')) { /* Treat as dollars */ }

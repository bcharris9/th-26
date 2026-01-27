Here is a confirmation token approach designed for the "Explain Like I'm 5" (ELI5) constraint of a hackathon demo.

1. Token Design: "The Digital Wax Seal"
Concept for Judges:
"Think of this token as a Digital Wax Seal. When a transaction is proposed, the server packages the details (who, what, how much) and stamps it with a secret mathematical seal. The client holds this seal. When they come back to confirm, we check if the seal is broken. If even one penny changed, the seal won't match, and we block the transaction."

Technical Format:
The token is a string containing the Proposal ID and a Hash Signature, separated by a dot.
{ProposalUUID}.{HMAC-SHA256-Signature}
Example:
prop_82374.a91b3c...f822.

2. Binding Fields (The "Wax")
To generate the signature, the server combines these specific fields into a string. This ensures the token is valid only for this specific scenario.

sessionId: Locks the token to the specific user session (prevents cross-user attacks).
actionType: Locks it to the specific operation (e.g., PROPOSE_TRANSFER).
targetId: Locks it to the specific recipient (Payee or Biller ID).
amount: Locks it to the exact value (to the decimal).
salt/timestamp: Ensures uniqueness even for identical repeated transactions.

Binding String Format:
sessionId|actionType|targetId|amount|timestamp

3. Server-Only Validation Rules
When the client calls execute(token), the server performs these checks in order:

Format Check: Does the token look like id.signature?
Lookup: Find the pending Proposal object in memory/DB using the id.
If missing: Reject (Expired/Invalid).
State Check: Is the Proposal status AWAITING_CONFIRMATION?
If COMPLETED: Reject (Replay Attack).
Integrity Check (The "Seal"):
Re-calculate the HMAC-SHA256 signature using the stored Proposal data.
Compare the calculated signature with the signature part of the token.
If mismatch: Reject (Tampering Detected).
Session Check: Does the sessionId in the Proposal match the current user's request context?
If mismatch: Reject (Session Hijacking).

4. Failure Cases to Test (The "Red" Path)
Use these scenarios to demonstrate the robustness of your Scam Guard to judges.

Test Case
Scenario Description
Expected Result
Reason

TC_01
The "Price Hike"
User gets a token for $50. Client (hacker) sends token but modifies payload to execute $500.
FAIL

TC_02
The "Switcheroo"
User gets token to pay "Mom". Client sends token but modifies target to "Attacker".
FAIL

TC_03
The "Slowpoke"
User waits 11 minutes to click confirm (Demo limit: 10 mins).
FAIL

TC_04
The "Double Dip"
User clicks confirm. Request succeeds. User clicks confirm again immediately.
FAIL

TC_05
The "Impostor"
User A creates a proposal. User B (attacker) steals User A's token and tries to execute it.
FAIL

TC_06
The "Garbage"
Client sends a random string "12345" or "undefined" as the token.
FAIL

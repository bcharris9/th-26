Here is the minimal ProposedAction schema designed to handle your three core operations, along with the requested security and logging guidelines.

1. Minimal ProposedAction Schema
This schema uses a discriminated union on type to ensure type safety while keeping the structure flat and easy to parse.

TypeScript
type ActionType = 'QUERY_SPEND' | 'PROPOSE_TRANSFER' | 'PROPOSE_BILL_PAY';

interface ProposedAction {
  id: string;              // UUID for the action attempt
  type: ActionType;
  summary: string;         // Plain English summary for UI/Logs
  timestamp: string;       // ISO 8601

  // payload shape changes based on type
  payload: {
    accountId: string;     // The acting account
    targetId?: string;     // Recipient Account ID or Bill ID
    amount?: number;       // Optional (not needed for queries)
    currency?: string;     // Default 'USD'
    memo?: string;         // User provided note
    queryFilters?: {       // Specific to QUERY_SPEND
       merchant?: string;
       since?: string;
    };
  };

  // Security context for execution phase
  security: {
    requiresConfirmation: boolean; // True for money movement
    proposalId?: string;           // Returned by backend during 'propose' step
    confirmationToken?: string;    // Added only after user approval
  };
}

2. Example Objects
A. Spend Query (Read-Only)
JSON
{
  "id": "act_001",
  "type": "QUERY_SPEND",
  "summary": "Checking purchases at Starbucks from the last 30 days",
  "timestamp": "2023-10-27T10:00:00Z",
  "payload": {
    "accountId": "acc_12345",
    "queryFilters": {
      "merchant": "Starbucks",
      "since": "2023-09-27"
    }
  },
  "security": {
    "requiresConfirmation": false
  }
}
B. Transfer Proposal (Money Movement)
JSON
{
  "id": "act_002",
  "type": "PROPOSE_TRANSFER",
  "summary": "Transfer $50.00 to Alice for lunch",
  "timestamp": "2023-10-27T10:05:00Z",
  "payload": {
    "accountId": "acc_12345",
    "targetId": "acc_67890",
    "amount": 50.00,
    "memo": "Lunch money"
  },
  "security": {
    "requiresConfirmation": true,
    "proposalId": "prop_999888" 
  }
}
C. Bill Payment (Money Movement)
JSON
{
  "id": "act_003",
  "type": "PROPOSE_BILL_PAY",
  "summary": "Pay Comcast bill of $120.50",
  "timestamp": "2023-10-27T10:10:00Z",
  "payload": {
    "accountId": "acc_12345",
    "targetId": "bill_comcast_01",
    "amount": 120.50
  },
  "security": {
    "requiresConfirmation": true,
    "proposalId": "prop_777666"
  }
}

3. Confirmation Token Binding
To secure the transition from PROPOSE to EXECUTE, follow these binding requirements:
Immutable Binding: The confirmationToken must be cryptographically bound (or simply logically paired in your backend DB) to the proposalId. It cannot be valid for any other proposal.
One-Time Use: Once executeTransfer(transferId, token) succeeds, the token must be invalidated immediately.
Client-Side Flow:
Call proposeTransfer -> Receive proposalId.
User UI shows Summary -> User clicks "Confirm".
Client generates/retrieves confirmationToken (mocked for hackathon or valid 2FA code).
Call executeTransfer(proposalId, confirmationToken).

4. Safe Logging Guidance (Judge Panel Friendly)
Judges need to see activity but not secrets. Use this masking strategy:
Redact Identifiers: Show only the last 4 characters of sensitive IDs.
accountId: "acc_12345" -> "acc_...2345"
token: "abc123xyz" -> "[REDACTED]"
Plain English Summaries: Always log the summary field. It is human-readable and safe.
Explicit Direction: Log the "Direction" of money clearly (e.g., OUTFLOW, INFLOW).
Example Safe Log Output:
Plaintext
[INFO] ACTION: PROPOSE_TRANSFER
[INFO] SUMMARY: Transfer $50.00 to Alice for lunch
[INFO] ACCOUNT: ...2345 -> ...6789
[INFO] STATUS: Awaiting Confirmation (Proposal ID: ...9888)

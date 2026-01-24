Here are the recommended response shapes, configurations, and edge case strategies to ensure your Nessie client wrapper is robust for a hackathon demo.

1. Stable Response Shapes (TypeScript Interfaces)
These shapes normalize the raw Nessie API response (which often uses _id) into a cleaner format for your frontend, while maintaining the specific fields required for propose vs execute flows.

TypeScript
// Shared Types
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'executed';
export type TransactionMedium = 'balance' | 'rewards';

// 1. Purchases
export interface Purchase {
  _id: string;
  merchant_id: string;
  payer_id: string;
  purchase_date: string; // ISO 8601
  amount: number;
  status: TransactionStatus;
  medium: TransactionMedium;
  description: string;
}

// 2. Bills
export interface Bill {
  _id: string;
  status: 'pending' | 'recurring' | 'cancelled' | 'completed';
  payee: string;
  nickname: string;
  creation_date: string;
  payment_date: string;
  recurring_date: number; // Day of month (1-31)
  payment_amount: number;
  account_id: string;
}

// 3. Transfers (Propose & Execute)
export interface TransferProposal {
  proposalId: string; // Temporary ID generated during proposal
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  status: 'awaiting_execution';
  expiresAt: string; // ISO timestamp for demo urgency
}

export interface Transfer {
  _id: string; // Real Nessie ID returned after execution
  type: 'p2p';
  transaction_date: string;
  status: TransactionStatus;
  payer_id: string;
  payee_id: string;
  amount: number;
  description?: string;
}

// 4. Bill Payments (Propose & Execute)
export interface BillPaymentProposal {
  proposalId: string;
  billId: string;
  amount: number;
  memo?: string;
  status: 'awaiting_execution';
}

export interface BillPayment {
  _id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  status: TransactionStatus;
}

2. Configuration Defaults
For a hackathon, you want "fail fast" behavior so the UI doesn't hang, but enough retries to handle spotty venue Wi-Fi.

Recommended Constants
TypeScript
export const CLIENT_CONFIG = {
  // Base URL
  baseURL: process.env.NESSIE_API_BASE || 'http://api.nessieisreal.com', // Replace with actual base

  // Timeouts & Retries
  timeout: 4000, // 4 seconds (Fail fast so you can retry manually if needed)
  retries: 2,    // Retry twice before throwing

  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

3. Edge Cases for DEMO_MODE
To ensure your demo doesn't crash if the real API goes down, and to show off error handling UI without needing actual bank errors, implement these triggers in your wrapper.

Tip: Use specific Amounts or Descriptions to trigger behaviors in DEMO_MODE.

Trigger Condition
Simulated Scenario
Response / Error
Amount ends in .99
Network Latency
Add artificial sleep(3000) delay before success. Good for showing loading spinners.
Amount > 10,000
Insufficient Funds
Throw 400 Bad Request: Insufficient Funds. Good for showing toast notifications.
Memo contains "fail"
API Error
Throw 503 Service Unavailable. Good for showing retry UI logic.
Account ID = "demo_vip"
Hydrated Data
Return a hardcoded list of 20+ purchases instead of fetching empty/real data.

Implementation Logic Snippet
TypeScript
if (process.env.DEMO_MODE === 'true') {
  if (amount > 10000) {
    throw new Error('DEMO_ERROR: Insufficient Funds');
  }
  if (String(amount).endsWith('.99')) {
    await new Promise(r => setTimeout(r, 2500)); // Fake lag
  }
}

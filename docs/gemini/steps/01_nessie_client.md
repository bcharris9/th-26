# Nessie Client Step 01

## Context
Reference `docs/gemini/gemini-pack.md`.
I am implementing a minimal Nessie client wrapper in `/server`.
I need stable response shapes for demo reliability.

## Gemini Prompt
Please provide:
- Recommended stable response shapes for purchases, bills, transfers, and bill payments.
- Retry and timeout defaults suitable for a hackathon demo.
- Edge cases to simulate in `DEMO_MODE`.

## Code Context
- Base URL variable name: NESSIE_API_BASE
- Function signatures I plan to implement:
  - getPurchases(accountId: string, params?: ListPurchasesParams): Promise<Purchase[]>
  - listBills(accountId: string, params?: ListBillsParams): Promise<Bill[]>
  - proposeTransfer(fromAccountId: string, toAccountId: string, amount: number, memo?: string): Promise<TransferProposal>
  - executeTransfer(transferId: string, token: string): Promise<Transfer>
  - proposeBillPayment(billId: string, amount: number, memo?: string): Promise<BillPaymentProposal>
  - executeBillPayment(paymentId: string, token: string): Promise<BillPayment>

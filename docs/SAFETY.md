SpendScribe Safety Rules

Non-negotiables
- Any money movement (transfer or bill pay) requires explicit spoken confirmation.
- Server must validate action JSON against an allowlist before executing anything.
- Gemini tool selection is constrained to safe, server-validated tools only.

Confirmation rules
- Low risk: single confirmation ("confirm").
- Medium risk: single confirmation plus explicit restatement of amount + target.
- High risk: two-step confirmation requiring exact phrase: "I confirm this payment".
- Any cancel/no/stop utterance immediately cancels and clears pending action.

Scam Guard policy
- Signals: new payee/biller, abnormal amount vs 30-day baseline, rapid outgoing velocity,
  low post-transaction balance, coercion keywords in memo.
- Output: risk score, risk level (LOW/MEDIUM/HIGH), and reason strings shown in judge panel.
- High risk requires two-step confirmation; otherwise block if user cancels.

Prompt-injection defenses
- Never execute actions directly from user transcript.
- Only execute actions returned by Gemini tool calls AND validated server-side.
- Reject any tool call that is not in the allowlist or fails schema validation.

PII handling
- No API keys or secrets in web code.
- Redact or mask account IDs and payee IDs in UI logs when possible.

Rate limits and abuse
- Limit action attempts per session (recommend: 5/min).
- Lock out repeated high-risk attempts within a short window (recommend: 3 in 10 minutes).

Where it lives
- Confirmation gating: `apps/server/src/policy/confirmationToken.ts`
- Scam Guard scoring: `apps/server/src/scamGuard/scamGuard.ts`
- Money movement policy: `apps/server/src/policy/moneyMovementPolicy.ts`

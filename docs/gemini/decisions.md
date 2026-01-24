# Decisions

- Date/time:
- Step name:
- Decision summary (3 bullets max):
- Implementation notes:
- Open questions:

## Step 01

- Date/time: 2026-01-24 15:38:14 -0600
- Step name: 01_nessie_client
- Decision summary (3 bullets max):
  - Implemented a minimal Nessie client wrapper with stable response shapes and demo-mode guards.
  - Added a smoke test script with safe checks before any money movement.
- Implementation notes:
  - Added `server/src/nessie/nessieClient.ts`, `server/scripts/nessie_smoke_test.ts`, and `server/src/config/demoConfig.ts`.
- Open questions:
  - Confirm Nessie endpoint paths and payload fields for production use.

## Step 02

- Date/time: 2026-01-24 16:32:12 -0600
- Step name: 02_action_schema
- Decision summary (3 bullets max):
  - Defined ProposedAction unions aligned with the Gemini schema.
  - Added a summary helper to ensure short, plain-English descriptions.
  - Added basic unit tests for summary output.
- Implementation notes:
  - Added `apps/server/src/actions/actionTypes.ts`, `apps/server/src/actions/actionSummary.ts`, and `apps/server/src/actions/actionSummary.test.ts`.
- Open questions:
  - Confirm any additional fields Scam Guard requires for risk checks.

## Step 03

- Date/time: 2026-01-24 16:32:12 -0600
- Step name: 03_scam_guard
- Decision summary (3 bullets max):
  - Implemented deterministic Scam Guard scoring with fixed thresholds.
  - Added reason strings tied to each triggered rule.
  - Added unit tests for low/medium/high risk scenarios.
- Implementation notes:
  - Added `apps/server/src/scamGuard/scamGuard.ts` and `apps/server/src/scamGuard/scamGuard.test.ts`.
- Open questions:
  - Confirm whether target IDs should be masked in UI logs by default.

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

## Step 04

- Date/time: 2026-01-24 17:03:14 -0600
- Step name: 04_confirmation_token
- Decision summary (3 bullets max):
  - Implemented server-only confirmation tokens with HMAC binding on session, action, target, amount, and timestamp.
  - Added a session-backed in-memory store for pending actions.
  - Added validation and replay-prevention tests for all failure cases.
- Implementation notes:
  - Added `apps/server/src/session/sessionStore.ts`, `apps/server/src/policy/confirmationToken.ts`, and `apps/server/src/policy/confirmationToken.test.ts`.
- Open questions:
  - Confirm token expiry duration for production flows.

## Step 05

- Date/time: 2026-01-24 17:10:28 -0600
- Step name: 05_policy_wrappers
- Decision summary (3 bullets max):
  - Added money movement policy wrappers with exact demo scripts and risk-based confirmation flow.
  - Enforced server-only confirmation token gating for execution.
  - Added high-risk two-step handling and cancel flow.
- Implementation notes:
  - Added `apps/server/src/policy/moneyMovementPolicy.ts`.
- Open questions:
  - Confirm whether bill payments should use a distinct high-risk script.

## Step 06

- Date/time: 2026-01-24 17:15:47 -0600
- Step name: 06_web_shell_accessibility
- Decision summary (3 bullets max):
  - Built a single-screen web shell with large “I heard” and “I will do” panels plus a judge panel.
  - Added a polite aria-live region for assistant responses and visible confirm/cancel commands.
  - Added keyboard fallback messaging for demo resilience.
- Implementation notes:
  - Added `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, and `apps/web/src/app/globals.css`.
- Open questions:
  - Confirm whether to add a separate assertive aria-live region for high-risk alerts.

## Step 07

- Date/time: 2026-01-28 13:44:28 -0600
- Step name: 07_demo_mode
- Decision summary (3 bullets max):
  - Added deterministic demo data for grocery spend, electric bill, and scam trigger flows.
  - Added a demo snapshot helper gated behind DEMO_MODE.
  - Added a print script that verifies scam guard returns HIGH risk for the demo trigger.
- Implementation notes:
  - Added `apps/server/src/demo/demoData.ts`, `apps/server/src/demo/demoRouter.ts`, and `apps/server/scripts/demo_print.ts`.
- Open questions:
  - Confirm where demo snapshot data should be wired into API responses.

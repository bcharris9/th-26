# Gemini Pack

## Project: VoiceBank summary
VoiceBank is a voice-first banking assistant that helps users understand spending, manage bills, and move money safely. The assistant prioritizes spoken interactions while keeping high-risk actions behind explicit confirmation. It orchestrates tools for finance operations and routes outputs into both UI state and voice responses.

## Non negotiables
- Voice is primary.
- Confirm all money movement before executing.
- Keys are server-side only.
- Nessie is mocked for local/dev.

## Runtime flow
UI -> /api/chat -> Gemini tools -> policy -> Nessie -> /api/tts -> ElevenLabs streaming

## Response contract from /api/chat
- assistantText: string
- uiState: object

## Allowed tools list
- getPurchases
- summarizeSpend
- listBills
- proposeBillPayment
- executeBillPayment
- proposeTransfer
- executeTransfer
- scamGuardCheck

## Confirmation policy
- Propose never moves money.
- Execute requires token.
- Cancel clears.

## Logging policy
Never log secrets.

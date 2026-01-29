SpendScribe Architecture

Goal: voice-first banking assistant with explicit spoken confirmation for any money movement.

ASCII diagram (target runtime flow)

  [Web UI / Voice Shell]
    - mic capture + transcript UI
    - judge panel (transcript, action JSON, risk, confirmation, outcome)
    - streaming TTS playback + interruption/ducking
           |
           | transcript + session
           v
  [Server API]
    - Gemini tool selection (allowlisted)
    - Action schema validation
    - Scam Guard risk scoring
    - Confirmation token policy
    - Nessie integration
           |
           | external calls
           v
  [External Providers]
    - Gemini (function calling)
    - ElevenLabs (STT + streaming TTS)
    - Nessie (banking data + money movement)

Primary runtime sequence
1) Web captures audio and sends to server.
2) Server calls ElevenLabs STT -> transcript.
3) Server calls Gemini with allowlisted tools -> proposed action JSON.
4) Server validates action schema + Scam Guard risk.
5) If money movement: server creates confirmation token and returns prompt.
6) User explicitly confirms by voice.
7) Server validates confirmation token and executes Nessie call.
8) Server streams ElevenLabs TTS response back to web.
9) Web updates judge panel with transcript, action JSON, risk score, confirmation state, outcome.

Current implementation notes
- UI shell exists in `apps/web/src/app/page.tsx` (static mock data).
- Policy layer exists in `apps/server/src/policy/` with confirmation tokens and Scam Guard.
- Nessie client exists in `apps/server/src/nessie/nessieClient.ts` with demo guards.
- API routes, Gemini integration, ElevenLabs STT/TTS streaming, and web audio pipelines are still missing.

# SpendScribe (Voice-Operated Banking Assistant)

SpendScribe is a voice-first banking assistant that turns spoken requests into safe, confirmed money movement. The product goal is a demo-ready flow where speech is primary, money movement is gated by explicit spoken confirmation, and judges can see exactly which action the model chose.

What it should do in the demo
- User speaks -> transcript appears
- Gemini selects an allowed action (function calling, allowlisted)
- Server validates + runs Nessie calls
- Scam Guard scores risk and requires explicit confirmation for money movement
- ElevenLabs streams TTS back to the user
- Judge panel shows transcript, action JSON, risk score, confirmation state, and final outcome

Current status at a glance
- Web: a static demo shell (no live voice capture yet). See `apps/web/src/app/page.tsx`.
- Server: Nessie client, Scam Guard, and confirmation-token policy are implemented. API routes and Gemini/ElevenLabs wiring are not yet implemented. See `apps/server/src`.
- Prototypes: Python STT/TTS + Gemini experiments live in `blakes_bullshit/` (not wired into the TS server).

Repo map
- `apps/web/`: Next.js UI shell for the judge panel and voice UX
- `apps/server/`: TypeScript backend building blocks (policy, scam guard, Nessie client)
- `server/`: older Nessie client + demo config (legacy)
- `docs/`: demo script, architecture, safety, env, QA checklist

Quickstart (current scripts)
1) Install deps: `npm install`
2) Copy env: `copy .env.example .env` (then fill values)
3) Optional Nessie seed helpers:
   - `npm run prepare:nessie:safe-ids`
   - `npm run seed:nessie`
4) Demo data sanity check:
   - `npx tsx apps/server/scripts/demo_print.ts`
5) Run servers:
   - API: `npm run dev:server`
   - Web: `npm run dev:web`

Note: A one-command run for web + server is still missing. See `docs/QA_CHECKLIST.md` and `docs/ARCHITECTURE.md` for what remains to be wired.

Security reminder
- Gemini and ElevenLabs keys must never be exposed in web code.
- Only the server should call Gemini/ElevenLabs (see `SECURITY.md`).

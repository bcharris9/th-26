SpendScribe Environment Variables

Core providers
- GEMINI_API_KEY
  - Used by Gemini tool-calling runtime (planned server endpoint).
  - Validation in `apps/server/src/env.ts`.
- GEMINI_MODEL (optional)
  - Defaults to `gemini-1.5-flash`.
  - Used in `apps/server/src/gemini/geminiClient.ts`.
- ELEVENLABS_API_KEY
  - Used for STT + streaming TTS (planned server endpoint).
  - Validation in `apps/server/src/env.ts`.
- ELEVENLABS_VOICE_ID (optional)
  - Voice used for ElevenLabs TTS streaming.
  - Used in `apps/server/src/elevenlabs/tts.ts`.
- ELEVENLABS_TTS_MODEL (optional)
  - Defaults to `eleven_multilingual_v2`.
  - Used in `apps/server/src/elevenlabs/tts.ts`.
- ELEVENLABS_STT_MODEL (optional)
  - Defaults to `scribe_v2`.
  - Used in `apps/server/src/elevenlabs/stt.ts`.
- NESSIE_API_KEY
  - Used for Nessie REST calls.
  - Used in `apps/server/src/nessie/nessieClient.ts` and scripts.
- NESSIE_API_BASE (optional)
  - Defaults to `http://api.nessieisreal.com`.
  - Used in `apps/server/src/nessie/nessieClient.ts`.

Safety + confirmation
- CONFIRMATION_SECRET
  - HMAC secret used to sign confirmation tokens.
  - Used in `apps/server/src/policy/confirmationToken.ts`.

Demo mode
- DEMO_MODE (true/false)
  - Enables deterministic demo responses and guards.
  - Used in `apps/server/src/config/demoConfig.ts` and `apps/server/src/nessie/nessieClient.ts`.
- MOCK_PROVIDERS (true/false)
  - When true and DEMO_MODE=true, Gemini/ElevenLabs calls are mocked.
  - Used in `apps/server/src/gemini/geminiClient.ts`.
- DEMO_ACCOUNT_ID
  - Account ID used for demo pulls and scripts.
  - Used in `apps/server/src/config/demoConfig.ts` and Nessie scripts.
- DEMO_KNOWN_GROCERY_MERCHANTS (comma-separated)
  - Used to detect grocery spend queries (planned).
  - Used in `apps/server/src/config/demoConfig.ts`.
- DEMO_ELECTRIC_BILLER_NAME
  - Used to label the demo bill.
  - Used in `apps/server/src/config/demoConfig.ts`.
- DEMO_SUSPICIOUS_PAYEE_NAME
  - Used in high-risk demo.
  - Used in `apps/server/src/config/demoConfig.ts`.
- DEMO_HIGH_RISK_TRANSFER_AMOUNT
  - Threshold for demo high-risk transfer.
  - Used in `apps/server/src/config/demoConfig.ts`.

Safe IDs (Nessie demo helpers)
- SAFE_TRANSFER_PAYEE_ID
  - Payee account ID for safe transfer demo.
  - Used in `apps/server/scripts/nessie_prepare_safe_ids.ts`.
- SAFE_BILL_ID
  - Bill ID for safe bill pay demo.
  - Used in `apps/server/scripts/nessie_prepare_safe_ids.ts`.

Python prototypes (not wired)
- ELEVENLABS_API_KEY used by `blakes_bullshit/Full_STT.py` and `blakes_bullshit/TTS.py`.
- GEMINI_API_KEY used by `blakes_bullshit/main.py`.

Web client
- NEXT_PUBLIC_API_BASE (optional)
  - Base URL for the API server (defaults to `http://localhost:8787`).
  - Used in `apps/web/src/lib/api.ts`.

Python microservice (optional)
- PYTHON_AI_BASE
  - Base URL for the Blake Python service (Gemini + ElevenLabs).
  - Used in `apps/server/src/gemini/geminiClient.ts` and `apps/server/src/server.ts`.

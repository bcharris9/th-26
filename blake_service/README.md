# Blake AI Microservice

This folder contains a copy of Blake's Python logic wired into a FastAPI service.
The original files in `blakes_bullshit/` are untouched.

Endpoints
- POST `/gemini/tool-call` -> returns tool call name/args (used by TS server)
- POST `/tts` -> ElevenLabs streaming TTS
- POST `/process-command` -> original Blake flow (kept for reference)
- GET `/health`

Run (example)
- `python -m venv .venv`
- `pip install fastapi uvicorn google-genai elevenlabs python-dotenv requests`
- `uvicorn main:app --reload --port 8788`

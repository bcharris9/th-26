SpendScribe Demo QA Checklist

Pre-demo setup
- [ ] `.env` populated and validated (see `docs/ENV.md`)
- [ ] DEMO_MODE set correctly for demo environment
- [ ] Safe IDs ready (SAFE_TRANSFER_PAYEE_ID, SAFE_BILL_ID)
- [ ] Web app builds and loads without console errors

Core voice flow
- [ ] Mic capture starts/stops and captures transcript reliably
- [ ] Transcript is shown in UI with clear status messaging
- [ ] Gemini tool selection returns allowlisted action JSON only
- [ ] Action JSON is validated server-side before any execution
- [ ] Scam Guard returns risk score + reasons for every proposal

Money movement gating
- [ ] Transfer requires explicit spoken confirmation
- [ ] Bill payment requires explicit spoken confirmation
- [ ] High-risk flow demands "I confirm this payment"
- [ ] "Cancel/No/Stop" immediately cancels pending action
- [ ] Confirmation token expires after the configured TTL

Judge panel requirements
- [ ] Transcript displayed
- [ ] Selected action JSON displayed
- [ ] Risk score and reasons displayed
- [ ] Confirmation state displayed (pending/confirmed/cancelled)
- [ ] Final outcome displayed (executed/blocked/failed)

Audio + UX
- [ ] TTS plays back with streaming (no long silent pause)
- [ ] User can interrupt TTS by speaking (duck or stop)
- [ ] Keyboard fallback works (confirm/cancel)
- [ ] Screen reader labels present for key panels
- [ ] Visible focus and large text option available

Failure handling
- [ ] Timeout errors show friendly recovery text
- [ ] Partial failures do not move money
- [ ] Server logs include correlation id per request

Smoke tests
- [ ] `npx tsx apps/server/scripts/demo_print.ts` passes
- [ ] `npm run smoke:nessie` (if real API keys configured)

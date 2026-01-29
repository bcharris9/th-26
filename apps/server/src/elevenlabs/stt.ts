import { env } from "../env";

const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export const transcribeAudio = async (audioBuffer: Buffer, mimeType: string) => {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required for STT.");
  }

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append("file", blob, "audio.webm");
  form.append("model_id", env.ELEVENLABS_STT_MODEL ?? "scribe_v2");
  form.append("tag_audio_events", "true");
  form.append("language_code", "eng");
  form.append("diarize", "false");

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs STT error: ${response.status} ${response.statusText} ${body}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error("ElevenLabs STT response missing text.");
  }
  return data.text.trim();
};

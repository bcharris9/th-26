import { env } from "../env";

const ELEVENLABS_TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

export const streamTTS = async (text: string) => {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required for TTS.");
  }

  const voiceId = env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  const url = `${ELEVENLABS_TTS_BASE}/${voiceId}/stream?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": env.ELEVENLABS_API_KEY,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: env.ELEVENLABS_TTS_MODEL ?? "eleven_multilingual_v2",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText} ${body}`);
  }

  return response;
};

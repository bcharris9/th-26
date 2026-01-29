const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787";

export const getTtsUrl = (text: string) => {
  const params = new URLSearchParams({ text });
  return `${API_BASE}/api/tts?${params.toString()}`;
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read audio blob."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, base64] = result.split(",");
        resolve(base64 ?? "");
      } else {
        resolve("");
      }
    };
    reader.readAsDataURL(blob);
  });

export type VoiceResponse = {
  transcript: string;
  assistantLines: string[];
  assistantText: string;
  judge: {
    tool: string;
    args: Record<string, unknown>;
    executed: boolean;
    riskLevel?: string;
    riskScore?: number;
    reasons?: string[];
    requiresConfirmation?: boolean;
    confirmationState?: string;
    outcome?: string;
  };
};

export const sendVoiceRequest = async (options: {
  sessionId: string;
  audioBlob?: Blob;
  transcript?: string;
}) => {
  const payload: Record<string, unknown> = {
    sessionId: options.sessionId,
    transcript: options.transcript,
  };

  if (options.audioBlob) {
    payload.audioBase64 = await blobToBase64(options.audioBlob);
    payload.mimeType = options.audioBlob.type || "audio/webm";
  }

  const response = await fetch(`${API_BASE}/api/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voice request failed: ${response.status} ${response.statusText} ${body}`);
  }

  return (await response.json()) as VoiceResponse;
};

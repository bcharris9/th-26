import { env } from "../env";

type ToolCallResponse = {
  name?: string | null;
  args?: Record<string, unknown> | null;
  text?: string | null;
};

const requirePythonBase = () => {
  const base = env.PYTHON_AI_BASE;
  if (!base) {
    throw new Error("PYTHON_AI_BASE is not configured.");
  }
  return base.replace(/\/+$/, "");
};

export const requestPythonToolCall = async (spokenText: string) => {
  const base = requirePythonBase();
  const response = await fetch(`${base}/gemini/tool-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spoken_text: spokenText }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Python Gemini error: ${response.status} ${response.statusText} ${body}`);
  }

  return (await response.json()) as ToolCallResponse;
};

export const requestPythonTts = async (text: string) => {
  const base = requirePythonBase();
  const response = await fetch(`${base}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Python TTS error: ${response.status} ${response.statusText} ${body}`);
  }

  return response;
};

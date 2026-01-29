import http from "node:http";
import { WritableStream } from "node:stream/web";
import { transcribeAudio } from "./elevenlabs/stt";
import { streamTTS } from "./elevenlabs/tts";
import { handleVoiceFlow } from "./voice/voiceHandler";
import { demoMode } from "./config/demoConfig";
import { getDemoSnapshot } from "./demo/demoRouter";
import { requestPythonTts } from "./python/pythonClient";
import { env } from "./env";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const PORT = Number(process.env.API_PORT ?? 8787);

const setCors = (res: http.ServerResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const sendJson = (res: http.ServerResponse, status: number, payload: JsonValue) => {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const readBody = async (req: http.IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const parseJsonBody = async (req: http.IncomingMessage) => {
  const body = await readBody(req);
  if (!body.length) {
    return {};
  }
  try {
    return JSON.parse(body.toString("utf8")) as Record<string, unknown>;
  } catch (error) {
    throw new Error("Invalid JSON body.");
  }
};

const server = http.createServer(async (req, res) => {
  try {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { status: "ok", demoMode });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/demo") {
      if (!demoMode) {
        sendJson(res, 400, { error: "Demo mode is not enabled." });
        return;
      }
      sendJson(res, 200, getDemoSnapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/voice") {
      const body = await parseJsonBody(req);
      const sessionId = String(body.sessionId ?? "");
      if (!sessionId) {
        sendJson(res, 400, { error: "sessionId is required." });
        return;
      }

      const transcript = typeof body.transcript === "string" ? body.transcript : undefined;
      const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : undefined;
      const mimeType = typeof body.mimeType === "string" ? body.mimeType : "audio/webm";

      let finalTranscript = transcript ?? "";
      if (!finalTranscript && audioBase64) {
        const audioBuffer = Buffer.from(audioBase64, "base64");
        finalTranscript = await transcribeAudio(audioBuffer, mimeType);
      }

      const response = await handleVoiceFlow({
        sessionId,
        transcript: finalTranscript,
      });

      sendJson(res, 200, response);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/tts") {
      const text = url.searchParams.get("text");
      if (!text) {
        sendJson(res, 400, { error: "text query param is required." });
        return;
      }
      const upstream = env.PYTHON_AI_BASE
        ? await requestPythonTts(text)
        : await streamTTS(text);
      res.writeHead(200, {
        "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control": "no-store",
      });
      if (!upstream.body) {
        res.end();
        return;
      }

      upstream.body
        .pipeTo(
          new WritableStream({
            write(chunk) {
              res.write(chunk);
            },
            close() {
              res.end();
            },
            abort() {
              res.end();
            },
          })
        )
        .catch(() => {
          res.end();
        });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`SpendScribe server listening on http://localhost:${PORT}`);
});

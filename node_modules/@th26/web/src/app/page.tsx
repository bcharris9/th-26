"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createMediaRecorder } from "../lib/speech";
import { getTtsUrl, sendVoiceRequest, type VoiceResponse } from "../lib/api";

const INITIAL_JUDGE = {
  tool: "UNKNOWN",
  args: {},
  executed: false,
  riskLevel: "LOW",
  riskScore: 0,
  reasons: [],
  requiresConfirmation: false,
  confirmationState: "none",
  outcome: "idle",
};

export default function HomePage() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [status, setStatus] = useState("Idle");
  const [lastCommand, setLastCommand] = useState("Ready for voice or keyboard commands.");
  const [transcript, setTranscript] = useState("Say a command to begin.");
  const [assistantLines, setAssistantLines] = useState<string[]>([]);
  const [assistantText, setAssistantText] = useState("");
  const [judge, setJudge] = useState(INITIAL_JUDGE);
  const [errorMessage, setErrorMessage] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [typedInput, setTypedInput] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playAssistant = async (text: string) => {
    if (!text) {
      return;
    }
    try {
      const url = getTtsUrl(text);
      const audio = new Audio(url);
      audioRef.current = audio;
      setStatus("Speaking");
      await audio.play();
      audio.onended = () => setStatus("Idle");
    } catch (error) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setStatus("Idle");
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setStatus("Speaking");
        return;
      }
      setErrorMessage("TTS playback failed.");
      setStatus("Idle");
    }
  };

  const handleResponse = (response: VoiceResponse) => {
    setTranscript(response.transcript || "No transcript.");
    setAssistantLines(response.assistantLines || []);
    setAssistantText(response.assistantText || "");
    setJudge({
      tool: response.judge.tool,
      args: response.judge.args,
      executed: response.judge.executed,
      riskLevel: response.judge.riskLevel ?? "LOW",
      riskScore: response.judge.riskScore ?? 0,
      reasons: response.judge.reasons ?? [],
      requiresConfirmation: response.judge.requiresConfirmation ?? false,
      confirmationState: response.judge.confirmationState ?? "none",
      outcome: response.judge.outcome ?? "unknown",
    });
    setLastCommand(`Server: ${response.judge.confirmationState ?? "ready"}`);
    if (response.assistantText) {
      playAssistant(response.assistantText);
    } else {
      setStatus("Idle");
    }
  };

  const sendText = async (text: string) => {
    setErrorMessage("");
    setStatus("Processing");
    try {
      const response = await sendVoiceRequest({ sessionId, transcript: text });
      handleResponse(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Request failed.");
      setStatus("Idle");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (recorderRef.current?.state === "recording") {
      return;
    }
    setErrorMessage("");
    stopAudio();
    setStatus("Listening");
    try {
      const { recorder, stream } = await createMediaRecorder();
      recorderRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setStatus("Processing");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        try {
          const response = await sendVoiceRequest({ sessionId, audioBlob: blob });
          handleResponse(response);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Request failed.");
          setStatus("Idle");
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 12000);
    } catch (error) {
      setStatus("Idle");
      setErrorMessage("Microphone access failed.");
    }
  };

  useEffect(() => {
    document.body.dataset.largeText = largeText ? "true" : "false";
  }, [largeText]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === " " || key === "r") {
        if (recorderRef.current?.state === "recording") {
          stopRecording();
        } else {
          startRecording();
        }
      }
      if (key === "c" || key === "enter") {
        setLastCommand("Keyboard confirm requested.");
        sendText("confirm");
      }
      if (key === "x" || key === "escape") {
        setLastCommand("Keyboard cancel requested.");
        sendText("cancel");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <main className="shell">
      <header className="shell-header">
        <div>
          <p className="shell-kicker">SpendScribe Demo</p>
          <h1>Safe, spoken money movement</h1>
          <p className="shell-subtitle">
            Voice is primary. Confirm before executing. Cancel clears pending actions.
          </p>
          <div className="status-chip" aria-live="polite">
            Status: {status}
          </div>
        </div>
        <div className="voice-commands" aria-label="Voice commands">
          <div className="command-chip">Say: Confirm</div>
          <div className="command-chip">Say: Cancel</div>
          <div className="command-note">Keyboard: C / Enter = Confirm, X / Esc = Cancel</div>
          <button className="toggle-button" onClick={() => setLargeText((prev) => !prev)}>
            {largeText ? "Standard text" : "Large text"}
          </button>
        </div>
      </header>

      <section className="shell-grid">
        <div className="primary-stack">
          <section className="panel panel-heard" aria-live="polite">
            <h2>I heard</h2>
            <p className="panel-text">{transcript}</p>
          </section>

          <section className="panel panel-willdo">
            <h2>I will do</h2>
            <p className="panel-text">
              {assistantLines.length ? assistantLines[0] : "Awaiting your request."}
            </p>
            <div className="assistant" aria-live="polite" aria-atomic="true">
              {assistantText || " "}
            </div>
            <div className="command-status" aria-live="polite">
              {lastCommand}
            </div>
            {errorMessage ? <div className="error-text">{errorMessage}</div> : null}
            <div className="record-controls">
              <button className="primary-button" onClick={startRecording}>
                Start Listening
              </button>
              <button className="secondary-button" onClick={stopRecording}>
                Stop
              </button>
              <button className="secondary-button" onClick={() => sendText("confirm")}>
                Confirm
              </button>
              <button className="ghost-button" onClick={() => sendText("cancel")}>
                Cancel
              </button>
            </div>
            <div className="text-fallback">
              <label htmlFor="typed-input">Type a command (fallback)</label>
              <div className="text-input-row">
                <input
                  id="typed-input"
                  type="text"
                  value={typedInput}
                  onChange={(event) => setTypedInput(event.target.value)}
                  placeholder="e.g. Pay my electric bill"
                />
                <button
                  className="secondary-button"
                  onClick={() => {
                    if (typedInput.trim()) {
                      sendText(typedInput.trim());
                      setTypedInput("");
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="panel panel-judge" aria-label="Judge panel">
          <div className="judge-header">
            <h2>Judge Panel</h2>
            <span className={`risk-badge risk-${judge.riskLevel.toLowerCase()}`}>{judge.riskLevel}</span>
          </div>
          <div className="judge-row">
            <span>Tool</span>
            <strong>{judge.tool}</strong>
          </div>
          <div className="judge-row">
            <span>Args</span>
            <code>{JSON.stringify(judge.args, null, 2)}</code>
          </div>
          <div className="judge-row">
            <span>Executed</span>
            <strong>{judge.executed ? "Yes" : "No"}</strong>
          </div>
          <div className="judge-row">
            <span>Confirmation</span>
            <strong>{judge.confirmationState}</strong>
          </div>
          <div className="judge-row">
            <span>Requires Confirmation</span>
            <strong>{judge.requiresConfirmation ? "Yes" : "No"}</strong>
          </div>
          <div className="judge-row">
            <span>Risk Score</span>
            <strong>{judge.riskScore}</strong>
          </div>
          <div className="judge-row judge-reasons">
            <span>Reasons</span>
            <ul>
              {judge.reasons.length ? judge.reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>None</li>}
            </ul>
          </div>
          <div className="judge-row">
            <span>Outcome</span>
            <strong>{judge.outcome}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

const mock = {
  heard: "Send forty five dollars to Alice for lunch.",
  willDo: "Propose a $45.00 transfer to Alice. Await confirmation before sending.",
  assistantText:
    "I've set up a transfer of $45.00 to Alice. Just so you know, you haven't paid her before. Would you like me to send it now?",
  judge: {
    tool: "proposeTransfer",
    args: "{ accountId: 'acc_12345', payeeId: 'acc_67890', amount: 45.00 }",
    executed: false,
    risk: "MEDIUM",
    reasons: ["New payee", "Amount above 30-day baseline"],
    requiresConfirmation: true,
  },
};

export default function HomePage() {
  const [lastCommand, setLastCommand] = useState("Ready for voice or keyboard commands.");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "c" || key === "enter") {
        setLastCommand("Keyboard confirm requested.");
      }
      if (key === "x" || key === "escape") {
        setLastCommand("Keyboard cancel requested.");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <main className="shell">
      <header className="shell-header">
        <div>
          <p className="shell-kicker">VoiceBank Demo Shell</p>
          <h1>Safe, spoken money movement</h1>
          <p className="shell-subtitle">
            Voice is primary. Confirm before executing. Cancel clears pending actions.
          </p>
        </div>
        <div className="voice-commands" aria-label="Voice commands">
          <div className="command-chip">Say: Confirm</div>
          <div className="command-chip">Say: Cancel</div>
          <div className="command-note">Keyboard: C / Enter = Confirm, X / Esc = Cancel</div>
        </div>
      </header>

      <section className="shell-grid">
        <div className="primary-stack">
          <section className="panel panel-heard">
            <h2>I heard</h2>
            <p className="panel-text">{mock.heard}</p>
          </section>

          <section className="panel panel-willdo">
            <h2>I will do</h2>
            <p className="panel-text">{mock.willDo}</p>
            <div className="assistant" aria-live="polite" aria-atomic="true">
              {mock.assistantText}
            </div>
            <div className="command-status">{lastCommand}</div>
          </section>
        </div>

        <aside className="panel panel-judge" aria-label="Judge panel">
          <div className="judge-header">
            <h2>Judge Panel</h2>
            <span className={`risk-badge risk-${mock.judge.risk.toLowerCase()}`}>{mock.judge.risk}</span>
          </div>
          <div className="judge-row">
            <span>Tool</span>
            <strong>{mock.judge.tool}</strong>
          </div>
          <div className="judge-row">
            <span>Args</span>
            <code>{mock.judge.args}</code>
          </div>
          <div className="judge-row">
            <span>Executed</span>
            <strong>{mock.judge.executed ? "Yes" : "No"}</strong>
          </div>
          <div className="judge-row">
            <span>Requires Confirmation</span>
            <strong>{mock.judge.requiresConfirmation ? "Yes" : "No"}</strong>
          </div>
          <div className="judge-row judge-reasons">
            <span>Reasons</span>
            <ul>
              {mock.judge.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

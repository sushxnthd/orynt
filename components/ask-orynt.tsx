"use client";

import { FormEvent, useState } from "react";

type QueryResult = { answer: string; evidence: { type: string; id: string; label: string; explanation?: string; ruleVersion?: string }[] };

export function AskOrynt() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy(true); setError("");
    const response = await fetch("/api/query", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error ?? "Query failed"); return; }
    setResult(data);
  }

  return (
    <div style={{ minWidth: 340, maxWidth: 520 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input className="searchBox" style={{ minWidth: 0, flex: 1 }} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask Orynt about signals, students or actions" />
        <button className="button" disabled={busy} type="submit">{busy ? "…" : "Ask"}</button>
      </form>
      {error ? <div className="bad" style={{ fontSize: 11, marginTop: 6 }}>{error}</div> : null}
      {result ? <div className="card cardPad" style={{ marginTop: 10, boxShadow: "none" }}><div style={{ fontSize: 12, lineHeight: 1.5 }}>{result.answer}</div>{result.evidence.length ? <div className="evidence">{result.evidence.slice(0,6).map((e) => <span key={`${e.type}:${e.id}`}>{e.label}</span>)}</div> : null}</div> : null}
    </div>
  );
}

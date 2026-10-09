"use client";

import { FormEvent, useState } from "react";

type QueryResult = { mode: string; answer: string; evidence: { type: string; id: string; label: string; detail?: string }[]; toolCalls: { tool: string; status: string }[]; actionProposal?: { type: "create_task" | "create_intervention"; title: string; rationale: string } };

export function AskOrynt({ expanded = false }: { expanded?: boolean }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy(true); setError(""); setActionState("");
    const response = await fetch("/api/aip/query", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error ?? "Query failed"); return; }
    setResult(data);
  }

  async function confirmAction() {
    if (!result?.actionProposal) return;
    setActionState("writing");
    const response = await fetch("/api/aip/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...result.actionProposal, confirm: true }) });
    const data = await response.json();
    setActionState(response.ok ? `created:${data.id}` : data.error ?? "failed");
  }

  return <div style={{ minWidth: expanded ? undefined : 340, maxWidth: expanded ? undefined : 620 }}><form onSubmit={submit} style={{ display: "flex", gap: 8 }}><input className="searchBox" style={{ minWidth: 0, flex: 1 }} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask Orynt why something changed, who needs attention, or what action is pending"/><button className="button" disabled={busy} type="submit">{busy ? "Inspecting…" : "Ask"}</button></form>{error ? <div className="bad" style={{ fontSize: 11, marginTop: 6 }}>{error}</div> : null}{result ? <div className="card cardPad" style={{ marginTop: 12, boxShadow: "none" }}><div className="eyebrow">{result.mode}</div><div style={{ fontSize: 13, lineHeight: 1.65, marginTop: 8 }}>{result.answer}</div><div className="evidence" style={{ marginTop: 12 }}>{result.toolCalls.map((call) => <span key={call.tool}>{call.tool} · {call.status}</span>)}</div>{result.evidence.length ? <div style={{ marginTop: 14 }}>{result.evidence.slice(0, 12).map((e) => <div className="signal" key={`${e.type}:${e.id}`}><div className="signalTop"><div><h3>{e.label}</h3>{e.detail ? <p>{e.detail}</p> : null}</div><span className="badge stable">{e.type}</span></div></div>)}</div> : null}{result.actionProposal ? <div className="card cardPad" style={{ marginTop: 14, boxShadow: "none" }}><div className="eyebrow">Human-confirmed action</div><strong style={{ display: "block", marginTop: 6 }}>{result.actionProposal.title}</strong><div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{result.actionProposal.rationale}</div><button className="button" onClick={confirmAction} disabled={actionState === "writing"} style={{ marginTop: 10 }}>Confirm {result.actionProposal.type.replaceAll("_", " ")}</button>{actionState ? <div className="muted" style={{ marginTop: 7, fontSize: 11 }}>{actionState}</div> : null}</div> : null}</div> : null}</div>;
}

"use client";
import { FormEvent, useState } from "react";

type Definition = { id: string; kind: string; key: string; name: string; description?: string | null; enabled: boolean; version: number; definition: Record<string, unknown> };
const templates: Record<string, string> = {
  metric: JSON.stringify({ source: "signals", aggregation: "count", filter: { field: "active", equals: true } }, null, 2),
  workflow: JSON.stringify({ action: "create_task", title: "Review {{definition.name}}", description: "Created from Orynt Studio" }, null, 2),
  object_type: JSON.stringify({ properties: { owner: { type: "string" }, status: { type: "string" } } }, null, 2),
};

export function StudioManager({ initial }: { initial: Definition[] }) {
  const [rows, setRows] = useState(initial); const [kind, setKind] = useState("metric"); const [key, setKey] = useState(""); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [definitionText, setDefinitionText] = useState(templates.metric); const [message, setMessage] = useState("");
  function changeKind(next: string) { setKind(next); setDefinitionText(templates[next]); }
  async function submit(event: FormEvent) {
    event.preventDefault(); let definition: Record<string, unknown>;
    try { definition = JSON.parse(definitionText); } catch { return setMessage("Definition must be valid JSON"); }
    const response = await fetch("/api/studio/definitions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, key, name, description, definition, enabled: true }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error ?? "Save failed");
    setRows((current) => [data.definition, ...current.filter((row) => row.id !== data.definition.id)]); setMessage("Saved"); setKey(""); setName(""); setDescription("");
  }
  async function remove(id: string) { const response = await fetch(`/api/studio/definitions/${id}`, { method: "DELETE" }); if (response.ok) setRows((current) => current.filter((row) => row.id !== id)); }
  async function execute(id: string) { setMessage("Executing…"); const response = await fetch(`/api/studio/definitions/${id}/execute`, { method: "POST" }); const data = await response.json(); setMessage(response.ok ? JSON.stringify(data.result) : data.error ?? "Execution failed"); }
  return <div className="grid twoCol"><section className="card cardPad"><h2 className="sectionTitle">Create definition</h2><form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}><select className="searchBox" value={kind} onChange={(e) => changeKind(e.target.value)}><option value="object_type">Object type</option><option value="metric">Metric</option><option value="workflow">Workflow</option></select><input className="searchBox" placeholder="stable_key" value={key} onChange={(e) => setKey(e.target.value)}/><input className="searchBox" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)}/><textarea className="searchBox" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}/><label style={{ display: "grid", gap: 6, fontSize: 12 }}>Definition JSON<textarea className="searchBox" value={definitionText} onChange={(e) => setDefinitionText(e.target.value)} rows={9} spellCheck={false}/></label><button className="button" type="submit">Save definition</button>{message ? <div className="emptyNote" style={{ overflowWrap: "anywhere" }}>{message}</div> : null}</form></section><section className="card cardPad"><h2 className="sectionTitle">Tenant definitions</h2><div style={{ marginTop: 12 }}>{rows.length ? rows.map((row) => <div className="signal" key={row.id}><div className="signalTop"><div><h3>{row.name}</h3><p>{row.kind} · {row.key} · v{row.version}</p></div><div style={{ display: "flex", gap: 6 }}><button className="button" onClick={() => execute(row.id)}>{row.kind === "metric" ? "Evaluate" : row.kind === "workflow" ? "Run" : "Inspect"}</button><button className="button secondary" onClick={() => remove(row.id)}>Delete</button></div></div></div>) : <div className="emptyNote">No custom definitions yet.</div>}</div></section></div>;
}

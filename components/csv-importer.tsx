"use client";

import { FormEvent, useState } from "react";

type Preview = { rows: number; valid: number; errors: { row: number; issues: string[] }[]; canCommit: boolean; checksum: string };

export function CsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState("students");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(mode: "preview" | "commit") {
    if (!file) return;
    setBusy(true); setMessage("");
    const body = new FormData(); body.set("file", file); body.set("kind", kind); body.set("mode", mode);
    const response = await fetch("/api/imports/csv", { method: "POST", body });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Import failed"); if (data.errors) setPreview({ rows: 0, valid: 0, errors: data.errors, canCommit: false, checksum: "" }); return; }
    if (mode === "preview") setPreview(data);
    else { setMessage(`Committed ${data.committed} ${kind} rows.`); setPreview(null); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send("preview"); }

  return (
    <form onSubmit={submit} className="card cardPad" style={{ marginTop: 16 }}>
      <h2 className="sectionTitle" style={{ marginBottom: 14 }}>CSV import</h2>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 10, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>Entity<select value={kind} onChange={(e) => { setKind(e.target.value); setPreview(null); }} style={{ padding: 9, border: "1px solid var(--line)", borderRadius: 8 }}><option value="students">Students</option><option value="attendance">Attendance</option></select></label>
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>CSV file<input type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }} /></label>
        <button className="button secondary" disabled={!file || busy} type="submit">{busy ? "Checking…" : "Preview"}</button>
      </div>
      {preview ? <div style={{ marginTop: 14 }}><div className="evidence"><span>{preview.rows} rows</span><span>{preview.valid} valid</span><span>{preview.errors.length} errors shown</span></div>{preview.errors.length ? <div className="emptyNote" style={{ marginTop: 10 }}>{preview.errors.slice(0,5).map((e) => <div key={e.row}>Row {e.row}: {e.issues.join("; ")}</div>)}</div> : null}{preview.canCommit ? <button type="button" className="button" style={{ marginTop: 12 }} onClick={() => void send("commit")}>Commit import</button> : null}</div> : null}
      {message ? <div className="emptyNote" style={{ marginTop: 12 }}>{message}</div> : null}
    </form>
  );
}

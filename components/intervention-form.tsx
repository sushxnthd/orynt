"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InterventionForm({ students }: { students: { id: string; name: string; class: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const studentIds = form.getAll("studentIds").map(String);
    const payload = { title: String(form.get("title") ?? ""), rationale: String(form.get("rationale") ?? ""), successMetric: String(form.get("successMetric") ?? ""), studentIds, reviewAt: form.get("reviewAt") ? new Date(String(form.get("reviewAt"))).toISOString() : undefined };
    const response = await fetch("/api/interventions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error ?? "Could not create intervention"); return; }
    setOpen(false); router.refresh();
  }

  if (!open) return <button className="button" onClick={() => setOpen(true)}>Create intervention</button>;
  return <form onSubmit={submit} className="card cardPad" style={{ width: "min(560px, 100%)" }}>
    <div style={{ display: "grid", gap: 10 }}>
      <input name="title" required minLength={3} placeholder="Intervention title" style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 8 }}/>
      <textarea name="rationale" required minLength={10} placeholder="Rationale and evidence summary" rows={4} style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 8 }}/>
      <input name="successMetric" required minLength={3} placeholder="Success metric (e.g. follow-up assessment median)" style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 8 }}/>
      <label style={{ fontSize: 12 }}>Review date<input name="reviewAt" type="datetime-local" style={{ display: "block", width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--line)", borderRadius: 8 }}/></label>
      <label style={{ fontSize: 12 }}>Students<select multiple name="studentIds" required size={Math.min(6, Math.max(3, students.length))} style={{ display: "block", width: "100%", marginTop: 6, padding: 8, border: "1px solid var(--line)", borderRadius: 8 }}>{students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.class}</option>)}</select></label>
      {error ? <div className="bad" style={{ fontSize: 12 }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 8 }}><button className="button" disabled={busy} type="submit">{busy ? "Creating…" : "Activate"}</button><button className="button secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </div>
  </form>;
}

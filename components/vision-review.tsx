"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VisionReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function review(next: "reviewing" | "dismissed" | "confirmed" | "resolved") {
    setBusy(true); setError("");
    const response = await fetch(`/api/vision/events/${id}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next, note: `Human review: ${next}` }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error ?? "Review failed"); return; }
    router.refresh();
  }

  return <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
    {status === "new" ? <button className="button secondary" disabled={busy} onClick={() => void review("reviewing")}>Review</button> : null}
    {status === "new" || status === "reviewing" ? <><button className="button secondary" disabled={busy} onClick={() => void review("confirmed")}>Confirm</button><button className="button secondary" disabled={busy} onClick={() => void review("dismissed")}>Dismiss</button></> : null}
    {status === "confirmed" ? <button className="button secondary" disabled={busy} onClick={() => void review("resolved")}>Resolve</button> : null}
    {error ? <span className="bad" style={{ fontSize: 10 }}>{error}</span> : null}
  </div>;
}

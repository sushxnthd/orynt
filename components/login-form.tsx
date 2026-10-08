"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) { setError(data?.error ?? "Sign in failed. Check your credentials and database seed."); return; }
    router.push(data?.home ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6, fontSize: 12 }}>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="username" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}/></label>
      <label style={{ display: "grid", gap: 6, fontSize: 12 }}>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} autoComplete="current-password" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}/></label>
      {error ? <div className="bad" style={{ fontSize: 12 }}>{error}</div> : null}
      <button disabled={busy} className="button" type="submit">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

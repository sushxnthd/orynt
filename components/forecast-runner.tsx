"use client";
import { useState } from "react";

type Target = "school_readiness" | "academic_performance" | "attendance_rate" | "intervention_outcome_delta" | "operational_load";
type Forecast = { target: Target; unit: string; estimate: number; low: number; high: number; calibrationStatus: string; modelVersion: string; samples: number };
const labels: Record<Target, string> = { school_readiness: "School readiness", academic_performance: "Academic performance", attendance_rate: "Attendance rate", intervention_outcome_delta: "Intervention outcome delta", operational_load: "Operational load" };

export function ForecastRunner() {
  const [target, setTarget] = useState<Target>("school_readiness");
  const [horizon, setHorizon] = useState(1);
  const [result, setResult] = useState<Forecast | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true); setError("");
    const response = await fetch("/api/forecast", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target, horizon }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error ?? "Forecast failed");
    setResult(data);
  }
  return <section className="card cardPad"><div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}><label style={{ display: "grid", gap: 6, fontSize: 12 }}>Target<select className="searchBox" value={target} onChange={(e) => setTarget(e.target.value as Target)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label style={{ display: "grid", gap: 6, fontSize: 12 }}>Forecast horizon<input className="searchBox" type="number" min="1" max="12" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}/></label><button className="button" onClick={run} disabled={busy}>{busy ? "Running…" : "Run forecast"}</button></div>{error ? <div className="bad" style={{ marginTop: 8, fontSize: 11 }}>{error}</div> : null}{result ? <div className="grid metrics" style={{ marginTop: 18 }}><div className="card metric"><div className="metricLabel">{labels[result.target]}</div><div className="metricValue">{result.estimate}</div><div className="metricDelta muted">{result.unit} · {result.modelVersion}</div></div><div className="card metric"><div className="metricLabel">Planning interval</div><div className="metricValue" style={{ fontSize: 26 }}>{result.low}–{result.high}</div><div className="metricDelta muted">Residual envelope</div></div><div className="card metric"><div className="metricLabel">Calibration</div><div className="metricValue" style={{ fontSize: 20 }}>{result.calibrationStatus}</div><div className="metricDelta muted">Only marked empirical with enough history</div></div><div className="card metric"><div className="metricLabel">Samples</div><div className="metricValue" style={{ fontSize: 20 }}>{result.samples}</div><div className="metricDelta muted">usable historical observations</div></div></div> : null}{result?.target === "intervention_outcome_delta" ? <div className="emptyNote" style={{ marginTop: 10 }}>Outcome delta preserves the configured metric direction. Orynt does not assume that a positive delta always means a successful intervention.</div> : null}</section>;
}

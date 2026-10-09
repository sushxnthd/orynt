"use client";
import { useState } from "react";

type Forecast = { estimate: number; low: number; high: number; calibrationStatus: string; modelVersion: string; samples: Record<string, number> };
export function ForecastRunner() {
  const [horizon, setHorizon] = useState(1);
  const [result, setResult] = useState<Forecast | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); const response = await fetch("/api/forecast", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ horizon }) }); const data = await response.json(); setBusy(false); if (response.ok) setResult(data); }
  return <section className="card cardPad"><div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}><label style={{ display: "grid", gap: 6, fontSize: 12 }}>Forecast horizon<input className="searchBox" type="number" min="1" max="12" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}/></label><button className="button" onClick={run} disabled={busy}>{busy ? "Running…" : "Run forecast"}</button></div>{result ? <div className="grid metrics" style={{ marginTop: 18 }}><div className="card metric"><div className="metricLabel">Readiness estimate</div><div className="metricValue">{result.estimate}</div><div className="metricDelta muted">{result.modelVersion}</div></div><div className="card metric"><div className="metricLabel">Planning interval</div><div className="metricValue" style={{ fontSize: 26 }}>{result.low}–{result.high}</div><div className="metricDelta muted">90% residual envelope</div></div><div className="card metric"><div className="metricLabel">Calibration</div><div className="metricValue" style={{ fontSize: 20 }}>{result.calibrationStatus}</div><div className="metricDelta muted">Never upgraded without enough history</div></div><div className="card metric"><div className="metricLabel">Samples</div><div className="metricValue" style={{ fontSize: 20 }}>{Object.values(result.samples).join(" / ")}</div><div className="metricDelta muted">academic / attendance / syllabus</div></div></div> : null}</section>;
}

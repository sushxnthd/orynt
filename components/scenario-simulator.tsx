"use client";

import { useMemo, useState } from "react";
import { simulateScenario } from "@/lib/domain/scenario";

export function ScenarioSimulator({ academicAverage, attendancePercent, syllabusPercent }: { academicAverage: number; attendancePercent: number; syllabusPercent: number }) {
  const [sessions, setSessions] = useState(2);
  const [attendanceDelta, setAttendanceDelta] = useState(2);
  const [syllabusDelta, setSyllabusDelta] = useState(5);
  const result = useMemo(() => simulateScenario({ academicAverage, attendancePercent, syllabusPercent, remediationSessions: sessions, attendanceDeltaPp: attendanceDelta, syllabusDeltaPp: syllabusDelta }), [academicAverage, attendancePercent, syllabusPercent, sessions, attendanceDelta, syllabusDelta]);

  return (
    <div className="grid twoCol">
      <section className="card cardPad">
        <h2 className="sectionTitle" style={{ marginBottom: 16 }}>Scenario assumptions</h2>
        <label style={{ display: "grid", gap: 6, marginBottom: 16, fontSize: 12 }}>Additional remediation sessions: <strong>{sessions}</strong><input type="range" min="0" max="10" step="1" value={sessions} onChange={(e) => setSessions(Number(e.target.value))}/></label>
        <label style={{ display: "grid", gap: 6, marginBottom: 16, fontSize: 12 }}>Attendance change: <strong>{attendanceDelta > 0 ? "+" : ""}{attendanceDelta} pp</strong><input type="range" min="-10" max="10" step="1" value={attendanceDelta} onChange={(e) => setAttendanceDelta(Number(e.target.value))}/></label>
        <label style={{ display: "grid", gap: 6, marginBottom: 16, fontSize: 12 }}>Syllabus coverage change: <strong>{syllabusDelta > 0 ? "+" : ""}{syllabusDelta} pp</strong><input type="range" min="-15" max="20" step="1" value={syllabusDelta} onChange={(e) => setSyllabusDelta(Number(e.target.value))}/></label>
        <div className="emptyNote">This is an assumption-driven planning heuristic, not a learned causal model. Orynt exposes the assumptions so administrators can challenge them instead of treating the result as ground truth.</div>
      </section>
      <section className="card cardPad">
        <div className="eyebrow">Projected readiness</div>
        <div style={{ fontSize: 48, fontWeight: 750, letterSpacing: "-.04em", marginTop: 8 }}>{result.estimate}</div>
        <div className="muted" style={{ fontSize: 12 }}>Baseline {result.baseline} · planning interval {result.low}–{result.high}</div>
        <div className="kv" style={{ marginTop: 22 }}><div>Heuristic</div><div>{result.assumptions.model}</div><div>Remediation assumption</div><div>+{result.assumptions.remediationAcademicEffectPp} pp academic effect</div><div>Attendance input</div><div>{result.assumptions.attendanceDeltaPp > 0 ? "+" : ""}{result.assumptions.attendanceDeltaPp} pp</div><div>Syllabus input</div><div>{result.assumptions.syllabusDeltaPp > 0 ? "+" : ""}{result.assumptions.syllabusDeltaPp} pp</div></div>
      </section>
    </div>
  );
}

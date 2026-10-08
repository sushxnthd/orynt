import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getStudentDetail } from "@/lib/data/student";

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireServerAction("student:read");
  const { id } = await params;
  const data = await getStudentDetail(session.tenantId, id);
  if (!data) notFound();
  const { student } = data;
  const primarySignal = data.signals[0];
  const risk = primarySignal?.severity ?? "stable";

  return (
    <AppShell title="Student 360">
      <div className="pageHeader"><div><div className="eyebrow">{student.grade}{student.section} · Student 360</div><h1 className="pageTitle">{student.firstName} {student.lastName}</h1><p className="pageSubtitle">A joined view of current state, evidence, actions and follow-up. Every object is resolved inside the active tenant boundary.</p></div><span className={`badge ${risk}`}>{risk}</span></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Attendance</div><div className="metricValue">{data.attendancePercent == null ? "—" : `${data.attendancePercent}%`}</div><div className="metricDelta muted">{data.attendance.length} recorded days</div></section>
        <section className="card metric"><div className="metricLabel">Academic average</div><div className="metricValue">{data.averagePercent == null ? "—" : `${data.averagePercent}%`}</div><div className="metricDelta muted">{data.results.length} scored assessments</div></section>
        <section className="card metric"><div className="metricLabel">Primary focus</div><div className="metricValue" style={{ fontSize: 18 }}>{primarySignal?.title ?? "No active signal"}</div><div className="metricDelta muted">Evidence-linked</div></section>
        <section className="card metric"><div className="metricLabel">Open actions</div><div className="metricValue">{data.interventions.filter((i) => i.status === "active" || i.status === "review_due").length}</div><div className="metricDelta warn">Human-owned interventions</div></section>
      </div>

      <div className="grid twoCol">
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Evidence and signals</h2><span className="sectionMeta">Rule + provenance retained</span></div>{data.signals.length ? data.signals.map((s) => <article className="signal" key={s.id}><div className="signalTop"><div><h3>{s.title}</h3><p>{s.explanation}</p></div><span className={`badge ${s.severity}`}>{s.severity}</span></div><div className="evidence"><span>Rule {s.ruleVersion}</span>{s.evidence.map((e) => <span key={e.id}>{e.label}{e.value ? `: ${e.value}` : ""}</span>)}</div></article>) : <div className="signal"><div className="emptyNote">No individual signals are active for this student.</div></div>}</section>
        <section className="card cardPad"><h2 className="sectionTitle" style={{ marginBottom: 16 }}>Context</h2><div className="kv"><div>Class</div><div>{student.grade}{student.section}</div><div>Admission number</div><div>{student.admissionNumber ?? "—"}</div><div>External source ID</div><div>{student.externalId ?? "—"}</div><div>Assessment records</div><div>{data.results.length}</div><div>Attendance records</div><div>{data.attendance.length}</div></div></section>
      </div>

      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Assessment history</h2></div><div className="tableWrap"><table><thead><tr><th>Assessment</th><th>Date</th><th>Score</th></tr></thead><tbody>{data.results.map((r) => <tr key={r.id}><td>{r.title}</td><td>{r.occurredOn}</td><td>{r.score}/{r.maxScore}</td></tr>)}</tbody></table></div></section>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Interventions</h2></div>{data.interventions.length ? data.interventions.map((i) => <div className="signal" key={i.id}><div className="signalTop"><h3>{i.title}</h3><span className={`badge ${i.status}`}>{i.status.replace("_", " ")}</span></div><p>{i.rationale}</p></div>) : <div className="signal"><div className="emptyNote">No interventions recorded.</div></div>}</section>
      </div>
    </AppShell>
  );
}

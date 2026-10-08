import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AskOrynt } from "@/components/ask-orynt";
import { requireServerAction } from "@/lib/auth/server";
import { getCommandData } from "@/lib/data/command";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const session = await requireServerAction("command:read");
  const data = await getCommandData(session.tenantId);
  const metrics = [
    { label: "Latest attendance", value: data.metrics.attendance == null ? "—" : `${data.metrics.attendance}%`, delta: data.metrics.attendanceAsOf ? `As of ${data.metrics.attendanceAsOf}` : "No attendance imported", tone: "warn" },
    { label: "Students needing action", value: String(data.metrics.actionSignals), delta: "Active action/critical signals", tone: data.metrics.actionSignals ? "bad" : "good" },
    { label: "Active interventions", value: String(data.metrics.activeInterventions), delta: "Active + review due", tone: "good" },
    { label: "Assessment readiness", value: data.metrics.assessmentReadiness == null ? "—" : `${data.metrics.assessmentReadiness}%`, delta: "Observed scored assessments", tone: "good" },
  ];

  return (
    <AppShell title="School Command">
      <div className="pageHeader">
        <div><div className="eyebrow">Daily operating picture</div><h1 className="pageTitle">What needs attention today?</h1><p className="pageSubtitle">Orynt prioritizes exceptions that can lead to an authorized action. Every material signal retains its evidence and rule provenance.</p></div>
        <AskOrynt />
      </div>

      <div className="grid metrics">{metrics.map((m) => <section className="card metric" key={m.label}><div className="metricLabel">{m.label}</div><div className="metricValue">{m.value}</div><div className={`metricDelta ${m.tone}`}>{m.delta}</div></section>)}</div>

      <div className="grid twoCol">
        <section className="card">
          <div className="sectionHead"><h2 className="sectionTitle">Priority signals</h2><span className="sectionMeta">{data.metrics.actionSignals} require action</span></div>
          {data.signals.length ? data.signals.map((s) => <article className="signal" key={s.id}><div className="signalTop"><div><h3>{s.title}</h3><p>{s.explanation}</p></div><span className={`badge ${s.severity}`}>{s.severity}</span></div><div className="evidence">{s.evidence.map((e) => <span key={e.id}>{e.label}{e.value ? `: ${e.value}` : ""}</span>)}</div></article>) : <div className="signal"><div className="emptyNote">No signals have been generated for this tenant yet.</div></div>}
        </section>

        <section className="card">
          <div className="sectionHead"><h2 className="sectionTitle">Interventions</h2><Link href="/interventions" className="sectionMeta">Open action center →</Link></div>
          {data.interventions.length ? data.interventions.map((i) => <div className="signal" key={i.id}><div className="signalTop"><h3>{i.title}</h3><span className={`badge ${i.status}`}>{i.status.replace("_", " ")}</span></div><p>{i.studentCount} students · {i.successMetric ?? "success metric not set"}</p><div className="evidence"><span>{i.outcomeValue ? `Outcome ${i.outcomeValue}` : "Outcome pending"}</span></div></div>) : <div className="signal"><div className="emptyNote">No interventions yet.</div></div>}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="sectionHead"><h2 className="sectionTitle">Student operating context</h2><Link href="/students" className="sectionMeta">All students →</Link></div>
        <div className="tableWrap"><table><thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Average</th><th>Current focus</th><th>State</th></tr></thead><tbody>{data.students.slice(0,20).map((s) => <tr key={s.id}><td><Link className="rowLink" href={`/students/${s.id}`}>{s.name}</Link></td><td>{s.class}</td><td>{s.attendance == null ? "—" : `${s.attendance}%`}</td><td>{s.average == null ? "—" : `${s.average}%`}</td><td>{s.focus}</td><td><span className={`badge ${s.risk}`}>{s.risk}</span></td></tr>)}</tbody></table></div>
      </section>
    </AppShell>
  );
}

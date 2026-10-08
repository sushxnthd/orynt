import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { demoSignals, demoStudents } from "@/lib/demo";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = demoStudents.find((s) => s.id === id);
  if (!student) notFound();
  const relatedSignals = demoSignals.filter((s) => s.title.includes(student.class) || s.explanation.toLowerCase().includes(student.focus.toLowerCase().split(" ")[0]));

  return (
    <AppShell title="Student 360">
      <div className="pageHeader">
        <div><div className="eyebrow">{student.class} · Student 360</div><h1 className="pageTitle">{student.name}</h1><p className="pageSubtitle">A joined view of current state, evidence, actions and follow-up. Sensitive fields are intended to be filtered by the policy layer.</p></div>
        <span className={`badge ${student.risk}`}>{student.risk}</span>
      </div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Attendance</div><div className="metricValue">{student.attendance}%</div><div className="metricDelta muted">Rolling term</div></section>
        <section className="card metric"><div className="metricLabel">Academic average</div><div className="metricValue">{student.average}%</div><div className={`metricDelta ${student.trend < 0 ? "bad" : "good"}`}>{student.trend > 0 ? "+" : ""}{student.trend} pp / 30d</div></section>
        <section className="card metric"><div className="metricLabel">Primary focus</div><div className="metricValue" style={{ fontSize: 18 }}>{student.focus}</div><div className="metricDelta muted">Evidence-linked</div></section>
        <section className="card metric"><div className="metricLabel">Open actions</div><div className="metricValue">1</div><div className="metricDelta warn">Review due this cycle</div></section>
      </div>

      <div className="grid twoCol">
        <section className="card">
          <div className="sectionHead"><h2 className="sectionTitle">Evidence and signals</h2><span className="sectionMeta">No opaque risk score</span></div>
          {(relatedSignals.length ? relatedSignals : demoSignals.slice(0,1)).map((s) => <article className="signal" key={s.id}>
            <div className="signalTop"><div><h3>{s.title}</h3><p>{s.explanation}</p></div><span className={`badge ${s.severity}`}>{s.severity}</span></div>
            <div className="evidence">{s.evidence.map((e) => <span key={e}>{e}</span>)}</div>
          </article>)}
        </section>
        <section className="card cardPad">
          <h2 className="sectionTitle" style={{ marginBottom: 16 }}>Context</h2>
          <div className="kv"><div>Class</div><div>{student.class}</div><div>Data state</div><div>Current through 9 Oct 2026</div><div>Primary owner</div><div>Grade coordinator</div><div>Intervention consent</div><div>School policy basis</div><div>Last source sync</div><div>08:42 today</div></div>
        </section>
      </div>

      <section className="card cardPad" style={{ marginTop: 16 }}>
        <h2 className="sectionTitle" style={{ marginBottom: 16 }}>Action history</h2>
        <ol className="timeline"><li><strong>Signal generated</strong><br/><span className="muted">Rule evidence attached; no automated disciplinary action.</span></li><li><strong>Coordinator reviewed context</strong><br/><span className="muted">Attendance and concept-level assessment evidence inspected.</span></li><li><strong>Intervention assigned</strong><br/><span className="muted">Follow-up is measured against the recorded baseline.</span></li></ol>
      </section>
    </AppShell>
  );
}

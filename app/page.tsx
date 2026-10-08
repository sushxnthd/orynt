import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AskOrynt } from "@/components/ask-orynt";
import { demoInterventions, demoSchool, demoSignals, demoStudents } from "@/lib/demo";

export default function CommandPage() {
  return (
    <AppShell title="School Command">
      <div className="pageHeader">
        <div>
          <div className="eyebrow">Daily operating picture</div>
          <h1 className="pageTitle">What needs attention today?</h1>
          <p className="pageSubtitle">Orynt prioritizes exceptions that can lead to an authorized action. Every material signal retains its evidence and rule provenance.</p>
        </div>
        <AskOrynt />
      </div>

      <div className="grid metrics">
        {demoSchool.metrics.map((m) => (
          <section className="card metric" key={m.label}>
            <div className="metricLabel">{m.label}</div>
            <div className="metricValue">{m.value}</div>
            <div className={`metricDelta ${m.tone}`}>{m.delta}</div>
          </section>
        ))}
      </div>

      <div className="grid twoCol">
        <section className="card">
          <div className="sectionHead"><h2 className="sectionTitle">Priority signals</h2><span className="sectionMeta">3 require review</span></div>
          {demoSignals.map((s) => (
            <article className="signal" key={s.id}>
              <div className="signalTop"><div><h3>{s.title}</h3><p>{s.explanation}</p></div><span className={`badge ${s.severity}`}>{s.severity}</span></div>
              <div className="evidence">{s.evidence.map((e) => <span key={e}>{e}</span>)}</div>
            </article>
          ))}
        </section>

        <section className="card">
          <div className="sectionHead"><h2 className="sectionTitle">Interventions</h2><Link href="/interventions" className="sectionMeta">Open action center →</Link></div>
          {demoInterventions.map((i) => (
            <div className="signal" key={i.id}>
              <div className="signalTop"><h3>{i.title}</h3><span className={`badge ${i.status}`}>{i.status.replace("_", " ")}</span></div>
              <p>{i.students} students · owner {i.owner} · review {i.review}</p>
              <div className="evidence"><span>{i.outcome}</span></div>
            </div>
          ))}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="sectionHead"><h2 className="sectionTitle">Students surfaced by current signals</h2><Link href="/students" className="sectionMeta">All students →</Link></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Average</th><th>Trend</th><th>Current focus</th><th>State</th></tr></thead>
          <tbody>{demoStudents.map((s) => <tr key={s.id}>
            <td><Link className="rowLink" href={`/students/${s.id}`}>{s.name}</Link></td><td>{s.class}</td><td>{s.attendance}%</td><td>{s.average}%</td><td className={s.trend < 0 ? "bad" : "good"}>{s.trend > 0 ? "+" : ""}{s.trend} pp</td><td>{s.focus}</td><td><span className={`badge ${s.risk}`}>{s.risk}</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </AppShell>
  );
}

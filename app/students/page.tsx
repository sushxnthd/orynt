import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { demoStudents } from "@/lib/demo";

export default function StudentsPage() {
  return (
    <AppShell title="Students">
      <div className="pageHeader">
        <div><div className="eyebrow">Student 360</div><h1 className="pageTitle">Student operating context</h1><p className="pageSubtitle">Academic, attendance, intervention and evidence context—scoped by role and school policy.</p></div>
        <div className="searchBox">Search student, class, signal or concept</div>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Current student population</h2><span className="sectionMeta">Synthetic tenant · 4 shown</span></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Average</th><th>30-day trend</th><th>Focus</th><th>State</th></tr></thead>
          <tbody>{demoStudents.map((s) => <tr key={s.id}>
            <td><Link className="rowLink" href={`/students/${s.id}`}>{s.name}</Link></td><td>{s.class}</td><td>{s.attendance}%</td><td>{s.average}%</td><td className={s.trend < 0 ? "bad" : "good"}>{s.trend > 0 ? "+" : ""}{s.trend} pp</td><td>{s.focus}</td><td><span className={`badge ${s.risk}`}>{s.risk}</span></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </AppShell>
  );
}

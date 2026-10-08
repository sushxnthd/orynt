import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireServerSession } from "@/lib/auth/server";
import { getCommandData } from "@/lib/data/command";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await requireServerSession();
  const data = await getCommandData(session.tenantId);
  return (
    <AppShell title="Students">
      <div className="pageHeader">
        <div><div className="eyebrow">Student 360</div><h1 className="pageTitle">Student operating context</h1><p className="pageSubtitle">Academic, attendance, intervention and evidence context—scoped by role and school policy.</p></div>
        <div className="searchBox">Use Ask Orynt to locate a student by name</div>
      </div>
      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Current student population</h2><span className="sectionMeta">{data.students.length} loaded</span></div>
        <div className="tableWrap"><table><thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Average</th><th>Focus</th><th>State</th></tr></thead><tbody>{data.students.map((s) => <tr key={s.id}><td><Link className="rowLink" href={`/students/${s.id}`}>{s.name}</Link></td><td>{s.class}</td><td>{s.attendance == null ? "—" : `${s.attendance}%`}</td><td>{s.average == null ? "—" : `${s.average}%`}</td><td>{s.focus}</td><td><span className={`badge ${s.risk}`}>{s.risk}</span></td></tr>)}</tbody></table></div>
      </section>
    </AppShell>
  );
}

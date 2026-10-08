import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getAttendanceData } from "@/lib/data/attendance";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await requireServerAction("attendance:read");
  const data = await getAttendanceData(session.tenantId);
  const summary = data.latestSummary;
  const rate = summary.total ? Math.round(((summary.present + summary.late) / summary.total) * 1000) / 10 : null;
  return (
    <AppShell title="Attendance">
      <div className="pageHeader"><div><div className="eyebrow">Presence + participation</div><h1 className="pageTitle">Attendance operations</h1><p className="pageSubtitle">Treat absence as an operational signal with transparent context, not an automatic judgment about a student.</p></div><div className="sectionMeta">Latest modeled day: {data.latestDay ?? "—"}</div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Latest attendance</div><div className="metricValue">{rate == null ? "—" : `${rate}%`}</div><div className="metricDelta muted">Present + late</div></section>
        <section className="card metric"><div className="metricLabel">Absent</div><div className="metricValue">{summary.absent}</div><div className="metricDelta bad">Latest modeled day</div></section>
        <section className="card metric"><div className="metricLabel">Late</div><div className="metricValue">{summary.late}</div><div className="metricDelta warn">Latest modeled day</div></section>
        <section className="card metric"><div className="metricLabel">Below 90%</div><div className="metricValue">{data.exceptions.length}</div><div className="metricDelta warn">Requires context before action</div></section>
      </div>
      <div className="grid twoCol">
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Class attendance</h2><span className="sectionMeta">Recorded evidence</span></div><div className="tableWrap"><table><thead><tr><th>Class</th><th>Students</th><th>Attendance</th><th>Below 90%</th></tr></thead><tbody>{data.classes.map((row) => <tr key={row.className}><td className="rowLink">{row.className}</td><td>{row.students}</td><td>{row.attendance == null ? "—" : `${row.attendance}%`}</td><td>{row.below90}</td></tr>)}</tbody></table></div></section>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Attendance exceptions</h2><span className="sectionMeta">Human review queue</span></div>{data.exceptions.length ? data.exceptions.map((student) => <div className="signal" key={student.id}><div className="signalTop"><div><h3><Link href={`/students/${student.id}`}>{student.name}</Link></h3><p>{student.className} · {student.absences} recorded absences · latest: {student.latest}</p></div><span className={`badge ${student.percent !== null && student.percent < 82 ? "critical" : "action"}`}>{student.percent}%</span></div></div>) : <div className="signal"><div className="emptyNote">No student is below the configured review threshold.</div></div>}</section>
      </div>
      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Student attendance register</h2></div><div className="tableWrap"><table><thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Absences</th><th>Latest status</th></tr></thead><tbody>{data.students.map((student) => <tr key={student.id}><td><Link className="rowLink" href={`/students/${student.id}`}>{student.name}</Link></td><td>{student.className}</td><td>{student.percent == null ? "—" : `${student.percent}%`}</td><td>{student.absences}</td><td>{student.latest}</td></tr>)}</tbody></table></div></section>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getSelfProgress } from "@/lib/data/portal";

export const dynamic = "force-dynamic";

export default async function MyProgressPage() {
  const session = await requireServerAction("self:read");
  const student = await getSelfProgress(session.tenantId, session.userId);
  if (!student) notFound();
  return (
    <AppShell title="My Progress">
      <div className="pageHeader"><div><div className="eyebrow">Student portal · {student.className}</div><h1 className="pageTitle">{student.name}</h1><p className="pageSubtitle">Your own academic and attendance evidence, with a deliberately narrower view than internal staff workspaces.</p></div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Attendance</div><div className="metricValue">{student.attendancePercent == null ? "—" : `${student.attendancePercent}%`}</div><div className="metricDelta muted">Your recorded attendance</div></section>
        <section className="card metric"><div className="metricLabel">Assessment average</div><div className="metricValue">{student.averagePercent == null ? "—" : `${student.averagePercent}%`}</div><div className="metricDelta muted">Scored evidence currently loaded</div></section>
        <section className="card metric"><div className="metricLabel">Assessments</div><div className="metricValue">{student.assessments.length}</div><div className="metricDelta muted">Visible to you</div></section>
        <section className="card metric"><div className="metricLabel">Support plans</div><div className="metricValue">{student.support.length}</div><div className="metricDelta muted">Active/reviewed support context</div></section>
      </div>
      <div className="grid twoCol">
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Assessment history</h2></div><div className="tableWrap"><table><thead><tr><th>Assessment</th><th>Date</th><th>Score</th></tr></thead><tbody>{student.assessments.map((item) => <tr key={item.id}><td className="rowLink">{item.title}</td><td>{item.occurredOn}</td><td>{item.score}/{item.maxScore}</td></tr>)}</tbody></table></div></section>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Current support</h2><span className="sectionMeta">Internal staff notes are not exposed</span></div>{student.support.length ? student.support.map((item) => <div className="signal" key={item.id}><div className="signalTop"><h3>{item.title}</h3><span className={`badge ${item.status}`}>{item.status.replace("_", " ")}</span></div><p>{item.successMetric ?? "Progress will be reviewed against the school's recorded outcome measure."}{item.reviewAt ? ` · review ${new Date(item.reviewAt).toLocaleString("en-IN", { dateStyle: "medium" })}` : ""}</p></div>) : <div className="signal"><div className="emptyNote">No current support plan is visible.</div></div>}</section>
      </div>
      <section className="card cardPad" style={{ marginTop: 16 }}><h2 className="sectionTitle" style={{ marginBottom: 10 }}>Privacy boundary</h2><div className="emptyNote">This portal is resolved from the verified user↔student relationship. It does not expose unrelated students, staff deliberation, counselor notes, Vision events, internal risk queues or school-wide analytics.</div></section>
    </AppShell>
  );
}

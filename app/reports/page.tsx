import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getAcademicsData } from "@/lib/data/academics";
import { getAttendanceData } from "@/lib/data/attendance";
import { getCommandData } from "@/lib/data/command";
import { getOperationsData } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await requireServerAction("reports:read");
  const [command, academics, attendance, operations] = await Promise.all([
    getCommandData(session.tenantId),
    getAcademicsData(session.tenantId),
    getAttendanceData(session.tenantId),
    getOperationsData(session.tenantId),
  ]);
  const reviewDue = command.interventions.filter((i) => i.status === "review_due").length;
  const weakestCourse = [...academics.courses].filter((c) => c.average !== null).sort((a, b) => (a.average ?? 101) - (b.average ?? 101))[0];

  return (
    <AppShell title="Reports">
      <div className="pageHeader"><div><div className="eyebrow">Management review</div><h1 className="pageTitle">Evidence-ready school brief</h1><p className="pageSubtitle">A repeatable operating review assembled from the same objects Orynt uses for daily action, avoiding a separate manual reporting workflow.</p></div><a className="button secondary" href="/api/reports/executive">Export JSON</a></div>

      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Action-level signals</div><div className="metricValue">{command.metrics.actionSignals}</div><div className="metricDelta bad">Current active queue</div></section>
        <section className="card metric"><div className="metricLabel">Attendance exceptions</div><div className="metricValue">{attendance.exceptions.length}</div><div className="metricDelta warn">Below 90% modeled attendance</div></section>
        <section className="card metric"><div className="metricLabel">Interventions review due</div><div className="metricValue">{reviewDue}</div><div className="metricDelta warn">Outcome check required</div></section>
        <section className="card metric"><div className="metricLabel">Open operational tasks</div><div className="metricValue">{operations.metrics.openTasks}</div><div className="metricDelta muted">Execution queue</div></section>
      </div>

      <div className="grid twoCol">
        <section className="card cardPad"><div className="eyebrow">Academic</div><h2 style={{ margin: "7px 0 10px", fontSize: 20 }}>{weakestCourse ? `${weakestCourse.className} ${weakestCourse.subject}` : "No scored course evidence"}</h2><p className="pageSubtitle">{weakestCourse ? `Lowest currently observed course average: ${weakestCourse.average}%. Teacher: ${weakestCourse.teacher}. Syllabus coverage: ${weakestCourse.syllabusComplete ?? "untracked"}${weakestCourse.syllabusComplete == null ? "" : "%"}.` : "Import assessments to populate comparative course evidence."}</p></section>
        <section className="card cardPad"><div className="eyebrow">Attendance</div><h2 style={{ margin: "7px 0 10px", fontSize: 20 }}>{attendance.latestDay ?? "No day loaded"}</h2><p className="pageSubtitle">Latest modeled day: {attendance.latestSummary.present} present, {attendance.latestSummary.late} late, {attendance.latestSummary.absent} absent, {attendance.latestSummary.excused} excused. {attendance.exceptions.length} students are below the configured 90% review threshold.</p></section>
      </div>

      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Priority evidence</h2><span className="sectionMeta">Claims trace to Orynt objects</span></div>{command.signals.slice(0,8).map((signal) => <article className="signal" key={signal.id}><div className="signalTop"><div><h3>{signal.title}</h3><p>{signal.explanation}</p></div><span className={`badge ${signal.severity}`}>{signal.severity}</span></div><div className="evidence"><span>Rule {signal.ruleVersion}</span>{signal.evidence.map((item) => <span key={item.id}>{item.label}{item.value ? `: ${item.value}` : ""}</span>)}</div></article>)}</section>

      <section className="card" style={{ marginTop: 16 }}><div className="sectionHead"><h2 className="sectionTitle">Actions and execution</h2></div><div className="tableWrap"><table><thead><tr><th>Intervention</th><th>Status</th><th>Students</th><th>Success metric</th><th>Outcome</th></tr></thead><tbody>{command.interventions.map((item) => <tr key={item.id}><td className="rowLink">{item.title}</td><td>{item.status.replace("_", " ")}</td><td>{item.studentCount}</td><td>{item.successMetric ?? "—"}</td><td>{item.outcomeValue ?? "Pending"}</td></tr>)}</tbody></table></div></section>
    </AppShell>
  );
}

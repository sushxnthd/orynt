import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getAcademicsData } from "@/lib/data/academics";

export const dynamic = "force-dynamic";

export default async function AcademicsPage() {
  const session = await requireServerAction("academics:read");
  const data = await getAcademicsData(session.tenantId);
  const measured = data.courses.filter((course) => course.average !== null);
  const overall = measured.length ? Math.round((measured.reduce((sum, course) => sum + (course.average ?? 0), 0) / measured.length) * 10) / 10 : null;
  const tracked = data.courses.filter((course) => course.syllabusComplete !== null);
  const syllabus = tracked.length ? Math.round(tracked.reduce((sum, course) => sum + (course.syllabusComplete ?? 0), 0) / tracked.length) : null;

  return (
    <AppShell title="Academics">
      <div className="pageHeader"><div><div className="eyebrow">Teaching + learning</div><h1 className="pageTitle">Academic operating picture</h1><p className="pageSubtitle">Connect cohort performance, curriculum coverage and assignment execution so remediation is based on specific evidence rather than aggregate marks alone.</p></div></div>
      <div className="grid metrics">
        <section className="card metric"><div className="metricLabel">Measured course average</div><div className="metricValue">{overall == null ? "—" : `${overall}%`}</div><div className="metricDelta muted">Across courses with scored evidence</div></section>
        <section className="card metric"><div className="metricLabel">Syllabus coverage</div><div className="metricValue">{syllabus == null ? "—" : `${syllabus}%`}</div><div className="metricDelta muted">Taught/reviewed tracked concepts</div></section>
        <section className="card metric"><div className="metricLabel">Assessments</div><div className="metricValue">{data.assessments.length}</div><div className="metricDelta muted">Tenant records</div></section>
        <section className="card metric"><div className="metricLabel">Assignments</div><div className="metricValue">{data.assignments.length}</div><div className="metricDelta muted">Current modeled work</div></section>
      </div>

      <section className="card">
        <div className="sectionHead"><h2 className="sectionTitle">Course health</h2><span className="sectionMeta">Class → subject → teacher → evidence</span></div>
        <div className="tableWrap"><table><thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th>Assessments</th><th>Observed average</th><th>Syllabus</th><th>Assignment completion</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.id}><td className="rowLink">{course.className}</td><td>{course.subject}</td><td>{course.teacher}</td><td>{course.assessmentCount}</td><td>{course.average == null ? "—" : `${course.average}%`}</td><td>{course.syllabusComplete == null ? "—" : `${course.syllabusComplete}%`}</td><td>{course.submissionRate == null ? "—" : `${course.submissionRate}%`}</td></tr>)}</tbody></table></div>
      </section>

      <div className="grid twoCol" style={{ marginTop: 16 }}>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Curriculum coverage</h2></div>{data.concepts.length ? data.concepts.map((concept) => <div className="signal" key={concept.id}><div className="signalTop"><h3>{concept.concept}</h3><span className={`badge ${concept.status === "reviewed" || concept.status === "taught" ? "stable" : "watch"}`}>{concept.status.replace("_", " ")}</span></div><p>{concept.evidence ?? "No evidence note recorded"}</p></div>) : <div className="signal"><div className="emptyNote">No concept coverage has been recorded.</div></div>}</section>
        <section className="card"><div className="sectionHead"><h2 className="sectionTitle">Assignments</h2></div>{data.assignments.length ? data.assignments.map((assignment) => <div className="signal" key={assignment.id}><div className="signalTop"><h3>{assignment.title}</h3><span className="badge watch">{assignment.submissions} submissions</span></div><p>{assignment.concept ?? "General course work"} · due {new Date(assignment.dueAt).toLocaleString("en-IN")}</p></div>) : <div className="signal"><div className="emptyNote">No assignments modeled.</div></div>}</section>
      </div>
    </AppShell>
  );
}

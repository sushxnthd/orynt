import { AppShell } from "@/components/app-shell";
import { requireServerAction } from "@/lib/auth/server";
import { getFamilyProgress } from "@/lib/data/portal";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const session = await requireServerAction("dependent:read");
  const students = await getFamilyProgress(session.tenantId, session.userId);
  return (
    <AppShell title="Family">
      <div className="pageHeader"><div><div className="eyebrow">Guardian portal</div><h1 className="pageTitle">Family progress</h1><p className="pageSubtitle">Only students linked to this verified guardian account are shown. Internal staff analytics and unrelated student records remain inaccessible.</p></div></div>
      {students.length ? students.map((student) => <section className="card" key={student.id} style={{ marginBottom: 16 }}>
        <div className="sectionHead"><div><h2 className="sectionTitle">{student.name} · {student.className}</h2><span className="sectionMeta">Verified dependent relationship</span></div></div>
        <div className="grid metrics" style={{ padding: 16, marginBottom: 0 }}>
          <div className="metric"><div className="metricLabel">Attendance</div><div className="metricValue">{student.attendancePercent == null ? "—" : `${student.attendancePercent}%`}</div></div>
          <div className="metric"><div className="metricLabel">Assessment average</div><div className="metricValue">{student.averagePercent == null ? "—" : `${student.averagePercent}%`}</div></div>
          <div className="metric"><div className="metricLabel">Visible assessments</div><div className="metricValue">{student.assessments.length}</div></div>
          <div className="metric"><div className="metricLabel">Support plans</div><div className="metricValue">{student.support.length}</div></div>
        </div>
        <div className="grid twoCol" style={{ padding: "0 16px 16px" }}>
          <div><div className="sectionTitle" style={{ marginBottom: 8 }}>Recent assessments</div>{student.assessments.slice(0,5).map((item) => <div className="signal" key={item.id}><div className="signalTop"><h3>{item.title}</h3><span>{item.score}/{item.maxScore}</span></div><p>{item.occurredOn}</p></div>)}</div>
          <div><div className="sectionTitle" style={{ marginBottom: 8 }}>Support</div>{student.support.length ? student.support.map((item) => <div className="signal" key={item.id}><div className="signalTop"><h3>{item.title}</h3><span className={`badge ${item.status}`}>{item.status.replace("_", " ")}</span></div><p>{item.successMetric ?? "Outcome measure recorded by the school."}</p></div>) : <div className="emptyNote">No current support plan is visible.</div>}</div>
        </div>
      </section>) : <section className="card cardPad"><div className="emptyNote">No active verified dependent relationship is attached to this account.</div></section>}
    </AppShell>
  );
}

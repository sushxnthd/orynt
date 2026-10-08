import { AppShell } from "@/components/app-shell";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import { requireServerAction } from "@/lib/auth/server";
import { getAcademicsData } from "@/lib/data/academics";
import { getAttendanceData } from "@/lib/data/attendance";

export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const session = await requireServerAction("reports:read");
  const [academics, attendance] = await Promise.all([getAcademicsData(session.tenantId), getAttendanceData(session.tenantId)]);
  const course = academics.courses.find((item) => item.average !== null) ?? academics.courses[0];
  const classAttendance = attendance.classes.find((item) => item.className === course?.className);
  const academicAverage = course?.average ?? 70;
  const attendancePercent = classAttendance?.attendance ?? 90;
  const syllabusPercent = course?.syllabusComplete ?? 60;
  return (
    <AppShell title="Scenario Lab">
      <div className="pageHeader"><div><div className="eyebrow">Decision support</div><h1 className="pageTitle">Explore assumptions before changing the school</h1><p className="pageSubtitle">Orynt separates scenario planning from prediction. Until a school has enough validated historical evidence, the simulator uses transparent, bounded assumptions rather than pretending a black-box model knows the causal effect.</p></div></div>
      <section className="card cardPad" style={{ marginBottom: 16 }}><div className="kv"><div>Modeled course</div><div>{course ? `${course.className} · ${course.subject}` : "Fallback demonstration baseline"}</div><div>Academic baseline</div><div>{academicAverage}%</div><div>Attendance baseline</div><div>{attendancePercent}%</div><div>Syllabus baseline</div><div>{syllabusPercent}%</div><div>Evidence status</div><div>{course ? "Derived from current tenant records" : "No current course records; demonstration defaults in use"}</div></div></section>
      <ScenarioSimulator academicAverage={academicAverage} attendancePercent={attendancePercent} syllabusPercent={syllabusPercent}/>
      <section className="card cardPad" style={{ marginTop: 16 }}><h2 className="sectionTitle" style={{ marginBottom: 10 }}>When this becomes a real forecast</h2><div className="emptyNote">Replace heuristic coefficients only after Orynt can estimate out-of-sample calibration on sufficient school history, compare against simple baselines, expose uncertainty, monitor drift and demonstrate that recommendations improve decisions in a controlled pilot. The current output is for planning conversations, not automated student decisions.</div></section>
    </AppShell>
  );
}

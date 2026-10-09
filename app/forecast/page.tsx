import { AppShell } from "@/components/app-shell";
import { ForecastRunner } from "@/components/forecast-runner";
import { ScenarioSimulator } from "@/components/scenario-simulator";
import { requireServerAction } from "@/lib/auth/server";
import { getAcademicsData } from "@/lib/data/academics";
import { getAttendanceData } from "@/lib/data/attendance";

export const dynamic = "force-dynamic";
export default async function ForecastPage() {
  const session = await requireServerAction("forecast:read");
  const [academics, attendance] = await Promise.all([getAcademicsData(session.tenantId), getAttendanceData(session.tenantId)]);
  const course = academics.courses.find((item) => item.average !== null) ?? academics.courses[0];
  const classAttendance = attendance.classes.find((item) => item.className === course?.className);
  const academicAverage = course?.average ?? 70;
  const attendancePercent = classAttendance?.attendance ?? 90;
  const syllabusPercent = course?.syllabusComplete ?? 60;
  return <AppShell title="Orynt Forecast"><div className="pageHeader"><div><div className="eyebrow">Calibrated when evidence permits</div><h1 className="pageTitle">Forecast, then stress-test the decision</h1><p className="pageSubtitle">Forecast uses historical tenant records and exposes whether its interval is empirically calibrated or still a conservative baseline. Scenario Lab remains assumption-driven and separate from prediction.</p></div></div><ForecastRunner/><div style={{ marginTop: 16 }}><ScenarioSimulator academicAverage={academicAverage} attendancePercent={attendancePercent} syllabusPercent={syllabusPercent}/></div></AppShell>;
}

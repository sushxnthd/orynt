import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { assessments, attendance, results } from "@/lib/db/schema";
import { syllabusProgress } from "@/lib/db/extended-schema";

export async function getForecastInputs(tenantId: string) {
  const db = getDb();
  const [assessmentRows, resultRows, attendanceRows, syllabusRows] = await Promise.all([
    db.select().from(assessments).where(eq(assessments.tenantId, tenantId)).orderBy(asc(assessments.occurredOn)),
    db.select().from(results).where(eq(results.tenantId, tenantId)),
    db.select().from(attendance).where(eq(attendance.tenantId, tenantId)).orderBy(asc(attendance.day)),
    db.select().from(syllabusProgress).where(eq(syllabusProgress.tenantId, tenantId)),
  ]);
  const resultByAssessment = new Map<string, typeof resultRows>();
  for (const row of resultRows) resultByAssessment.set(row.assessmentId, [...(resultByAssessment.get(row.assessmentId) ?? []), row]);
  const academic = assessmentRows.map((assessment) => {
    const rows = (resultByAssessment.get(assessment.id) ?? []).filter((row) => !row.absent);
    if (!rows.length) return null;
    const max = Number(assessment.maxScore);
    return rows.reduce((sum, row) => sum + Number(row.score) / max * 100, 0) / rows.length;
  }).filter((value): value is number => value !== null);
  const days = new Map<string, { present: number; total: number }>();
  for (const row of attendanceRows) {
    const day = days.get(row.day) ?? { present: 0, total: 0 };
    day.total += 1;
    if (row.status === "present" || row.status === "late") day.present += 1;
    days.set(row.day, day);
  }
  const attendanceSeries = [...days.values()].map((day) => day.total ? day.present / day.total * 100 : 0);
  const completed = syllabusRows.filter((row) => row.status === "taught" || row.status === "reviewed").length;
  const syllabusCurrent = syllabusRows.length ? completed / syllabusRows.length * 100 : 0;
  const syllabus = syllabusRows.length ? [syllabusCurrent] : [];
  return { academic, attendance: attendanceSeries, syllabus };
}

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { assessments, attendance, interventions, results } from "@/lib/db/schema";
import { incidents, syllabusProgress, tasks } from "@/lib/db/extended-schema";

function dayKey(value: Date | string) {
  return (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10);
}

export async function getForecastInputs(tenantId: string) {
  const db = getDb();
  const [assessmentRows, resultRows, attendanceRows, syllabusRows, interventionRows, taskRows, incidentRows] = await Promise.all([
    db.select().from(assessments).where(eq(assessments.tenantId, tenantId)).orderBy(asc(assessments.occurredOn)),
    db.select().from(results).where(eq(results.tenantId, tenantId)),
    db.select().from(attendance).where(eq(attendance.tenantId, tenantId)).orderBy(asc(attendance.day)),
    db.select().from(syllabusProgress).where(eq(syllabusProgress.tenantId, tenantId)),
    db.select().from(interventions).where(eq(interventions.tenantId, tenantId)).orderBy(asc(interventions.createdAt)),
    db.select().from(tasks).where(eq(tasks.tenantId, tenantId)).orderBy(asc(tasks.createdAt)),
    db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).orderBy(asc(incidents.occurredAt)),
  ]);

  const resultByAssessment = new Map<string, typeof resultRows>();
  for (const row of resultRows) resultByAssessment.set(row.assessmentId, [...(resultByAssessment.get(row.assessmentId) ?? []), row]);
  const academic = assessmentRows.map((assessment) => {
    const rows = (resultByAssessment.get(assessment.id) ?? []).filter((row) => !row.absent);
    if (!rows.length) return null;
    const max = Number(assessment.maxScore);
    return max > 0 ? rows.reduce((sum, row) => sum + Number(row.score) / max * 100, 0) / rows.length : null;
  }).filter((value): value is number => value !== null && Number.isFinite(value));

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

  // Outcome deltas preserve metric direction rather than pretending every intervention metric is "higher is better".
  const interventionOutcomeDelta = interventionRows.flatMap((row) => row.baselineValue !== null && row.outcomeValue !== null ? [Number(row.outcomeValue) - Number(row.baselineValue)] : []).filter(Number.isFinite);

  const operationalByDay = new Map<string, number>();
  for (const row of taskRows) operationalByDay.set(dayKey(row.createdAt), (operationalByDay.get(dayKey(row.createdAt)) ?? 0) + 1);
  for (const row of incidentRows) operationalByDay.set(dayKey(row.occurredAt), (operationalByDay.get(dayKey(row.occurredAt)) ?? 0) + 1);
  const operationalLoad = [...operationalByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, count]) => count);

  return { academic, attendance: attendanceSeries, syllabus, interventionOutcomeDelta, operationalLoad };
}

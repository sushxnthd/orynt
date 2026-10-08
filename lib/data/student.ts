import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { assessments, attendance, interventionStudents, interventions, results, signalEvidence, signals, students } from "@/lib/db/schema";

export async function getStudentDetail(tenantId: string, studentId: string) {
  const db = getDb();
  const [student] = await db.select().from(students).where(and(eq(students.id, studentId), eq(students.tenantId, tenantId))).limit(1);
  if (!student) return null;
  const attendanceRows = await db.select().from(attendance).where(and(eq(attendance.tenantId, tenantId), eq(attendance.studentId, studentId))).orderBy(desc(attendance.day));
  const resultRows = await db.select({ id: results.id, score: results.score, maxScore: assessments.maxScore, title: assessments.title, occurredOn: assessments.occurredOn }).from(results).innerJoin(assessments, eq(results.assessmentId, assessments.id)).where(and(eq(results.tenantId, tenantId), eq(results.studentId, studentId))).orderBy(desc(assessments.occurredOn));
  const signalRows = await db.select().from(signals).where(and(eq(signals.tenantId, tenantId), eq(signals.studentId, studentId))).orderBy(desc(signals.generatedAt));
  const evidenceRows = signalRows.length ? await db.select().from(signalEvidence).where(inArray(signalEvidence.signalId, signalRows.map((s) => s.id))) : [];
  const evidenceBySignal = new Map<string, typeof evidenceRows>();
  for (const item of evidenceRows) evidenceBySignal.set(item.signalId, [...(evidenceBySignal.get(item.signalId) ?? []), item]);
  const links = await db.select().from(interventionStudents).where(eq(interventionStudents.studentId, studentId));
  const interventionRows = links.length ? await db.select().from(interventions).where(and(eq(interventions.tenantId, tenantId), inArray(interventions.id, links.map((l) => l.interventionId)))) : [];

  const attended = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
  const percentages = resultRows.map((r) => Number(r.maxScore) > 0 ? (Number(r.score) / Number(r.maxScore)) * 100 : NaN).filter(Number.isFinite);
  return {
    student,
    attendancePercent: attendanceRows.length ? Math.round((attended / attendanceRows.length) * 1000) / 10 : null,
    averagePercent: percentages.length ? Math.round((percentages.reduce((a,b) => a+b, 0) / percentages.length) * 10) / 10 : null,
    attendance: attendanceRows,
    results: resultRows,
    signals: signalRows.map((signal) => ({ ...signal, evidence: evidenceBySignal.get(signal.id) ?? [] })),
    interventions: interventionRows,
  };
}

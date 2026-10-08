import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { ScopedIdentity } from "@/lib/auth/scope";
import { accessAllows } from "@/lib/auth/scope";
import { getDb } from "@/lib/db/client";
import { assessments, attendance, classes, courseOfferings, interventionStudents, interventions, results, signalEvidence, signals, students } from "@/lib/db/schema";

export async function getStudentDetail(tenantId: string, studentId: string, identity?: ScopedIdentity) {
  const db = getDb();
  const [student] = await db.select().from(students).where(and(eq(students.id, studentId), eq(students.tenantId, tenantId))).limit(1);
  if (!student) return null;

  const classRows = await db.select().from(classes).where(and(eq(classes.tenantId, tenantId), eq(classes.grade, student.grade), eq(classes.section, student.section)));
  const studentClass = classRows[0];
  const classCourses = studentClass ? await db.select().from(courseOfferings).where(and(eq(courseOfferings.tenantId, tenantId), eq(courseOfferings.classId, studentClass.id))) : [];
  const visibleCourses = identity ? classCourses.filter((course) => accessAllows(identity, { grade: student.grade, classId: studentClass?.id, subjectId: course.subjectId })) : classCourses;
  const studentAllowed = !identity || (identity.scope?.subjectIds?.length ? visibleCourses.length > 0 : accessAllows(identity, { grade: student.grade, classId: studentClass?.id }));
  if (!studentAllowed) return null;

  const visibleCourseIds = new Set(visibleCourses.map((course) => course.id));
  const attendanceRows = await db.select().from(attendance).where(and(eq(attendance.tenantId, tenantId), eq(attendance.studentId, studentId))).orderBy(desc(attendance.day));
  const rawResults = await db.select({ id: results.id, score: results.score, maxScore: assessments.maxScore, title: assessments.title, occurredOn: assessments.occurredOn, courseOfferingId: assessments.courseOfferingId }).from(results).innerJoin(assessments, eq(results.assessmentId, assessments.id)).where(and(eq(results.tenantId, tenantId), eq(results.studentId, studentId))).orderBy(desc(assessments.occurredOn));
  const resultRows = identity?.scope?.subjectIds?.length || identity?.scope?.classIds?.length || identity?.scope?.grades?.length
    ? rawResults.filter((row) => visibleCourseIds.has(row.courseOfferingId))
    : rawResults;
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

import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import type { ScopedIdentity } from "@/lib/auth/scope";
import { accessAllows, hasExplicitScope } from "@/lib/auth/scope";
import { getDb } from "@/lib/db/client";
import { assessments, attendance, classes, courseOfferings, interventionStudents, interventions, results, signalEvidence, signals, students } from "@/lib/db/schema";

export async function getCommandData(tenantId: string, identity?: ScopedIdentity) {
  const db = getDb();
  const [allStudents, classRows, courses] = await Promise.all([
    db.select().from(students).where(eq(students.tenantId, tenantId)).limit(5000),
    db.select().from(classes).where(eq(classes.tenantId, tenantId)),
    db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, tenantId)),
  ]);
  const classByKey = new Map(classRows.map((row) => [`${row.grade}:${row.section}`, row]));
  const visibleCourses = identity ? courses.filter((course) => {
    const cls = classRows.find((row) => row.id === course.classId);
    return accessAllows(identity, { grade: cls?.grade, classId: course.classId, subjectId: course.subjectId });
  }) : courses;
  const visibleCourseIds = new Set(visibleCourses.map((course) => course.id));
  const visibleClassIds = new Set(visibleCourses.map((course) => course.classId));
  const scoped = identity ? hasExplicitScope(identity.scope) : false;
  const studentRows = identity ? allStudents.filter((student) => {
    const cls = classByKey.get(`${student.grade}:${student.section}`);
    if (!cls) return accessAllows(identity, { grade: student.grade });
    if (identity.scope?.subjectIds?.length) return visibleClassIds.has(cls.id);
    return accessAllows(identity, { grade: student.grade, classId: cls.id });
  }) : allStudents;
  const studentIds = studentRows.map((s) => s.id);
  const allowedStudentIds = new Set(studentIds);

  const attendanceRows = studentIds.length
    ? await db.select().from(attendance).where(inArray(attendance.studentId, studentIds))
    : [];
  const rawResultRows = studentIds.length
    ? await db.select({ studentId: results.studentId, score: results.score, maxScore: assessments.maxScore, occurredOn: assessments.occurredOn, courseOfferingId: assessments.courseOfferingId }).from(results).innerJoin(assessments, eq(results.assessmentId, assessments.id)).where(inArray(results.studentId, studentIds))
    : [];
  const resultRows = scoped ? rawResultRows.filter((row) => visibleCourseIds.has(row.courseOfferingId)) : rawResultRows;

  const allSignalRows = await db.select().from(signals).where(eq(signals.tenantId, tenantId)).orderBy(desc(signals.generatedAt)).limit(500);
  const signalRows = identity ? allSignalRows.filter((signal) => {
    if (signal.studentId) return allowedStudentIds.has(signal.studentId);
    if (signal.classId) return visibleClassIds.has(signal.classId);
    return !hasExplicitScope(identity.scope);
  }).slice(0, 10) : allSignalRows.slice(0, 10);
  const signalIds = signalRows.map((s) => s.id);
  const evidenceRows = signalIds.length ? await db.select().from(signalEvidence).where(inArray(signalEvidence.signalId, signalIds)) : [];
  const evidenceBySignal = new Map<string, typeof evidenceRows>();
  for (const item of evidenceRows) evidenceBySignal.set(item.signalId, [...(evidenceBySignal.get(item.signalId) ?? []), item]);

  const allInterventionRows = await db.select().from(interventions).where(eq(interventions.tenantId, tenantId)).orderBy(desc(interventions.createdAt)).limit(500);
  const allInterventionIds = allInterventionRows.map((i) => i.id);
  const allLinkedStudents = allInterventionIds.length ? await db.select().from(interventionStudents).where(inArray(interventionStudents.interventionId, allInterventionIds)) : [];
  const linksByIntervention = new Map<string, typeof allLinkedStudents>();
  for (const link of allLinkedStudents) linksByIntervention.set(link.interventionId, [...(linksByIntervention.get(link.interventionId) ?? []), link]);
  const interventionRows = identity ? allInterventionRows.filter((intervention) => {
    const links = linksByIntervention.get(intervention.id) ?? [];
    return links.some((link) => allowedStudentIds.has(link.studentId));
  }).slice(0, 10) : allInterventionRows.slice(0, 10);
  const interventionCounts = new Map<string, number>();
  for (const intervention of interventionRows) {
    const links = linksByIntervention.get(intervention.id) ?? [];
    interventionCounts.set(intervention.id, identity ? links.filter((link) => allowedStudentIds.has(link.studentId)).length : links.length);
  }

  const attendanceByStudent = new Map<string, { present: number; total: number }>();
  for (const row of attendanceRows) {
    const stat = attendanceByStudent.get(row.studentId) ?? { present: 0, total: 0 };
    stat.total += 1;
    if (row.status === "present" || row.status === "late") stat.present += 1;
    attendanceByStudent.set(row.studentId, stat);
  }
  const resultsByStudent = new Map<string, number[]>();
  for (const row of resultRows) {
    const max = Number(row.maxScore); const score = Number(row.score);
    if (max > 0 && Number.isFinite(score)) resultsByStudent.set(row.studentId, [...(resultsByStudent.get(row.studentId) ?? []), (score / max) * 100]);
  }
  const signalByStudent = new Map(signalRows.filter((s) => s.studentId).map((s) => [s.studentId!, s]));

  const studentView = studentRows.map((student) => {
    const att = attendanceByStudent.get(student.id);
    const scores = resultsByStudent.get(student.id) ?? [];
    const signal = signalByStudent.get(student.id);
    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      class: `${student.grade}${student.section}`,
      attendance: att?.total ? Math.round((att.present / att.total) * 1000) / 10 : null,
      average: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
      focus: signal?.title ?? "No active individual signal",
      risk: signal?.severity ?? "stable",
    };
  });

  const latestAttendanceDay = attendanceRows.map((r) => r.day).sort().at(-1);
  const latestDayRows = latestAttendanceDay ? attendanceRows.filter((r) => r.day === latestAttendanceDay) : [];
  const latestPresent = latestDayRows.filter((r) => r.status === "present" || r.status === "late").length;
  const allPercentages = resultRows.map((r) => Number(r.maxScore) > 0 ? (Number(r.score) / Number(r.maxScore)) * 100 : NaN).filter(Number.isFinite);

  return {
    metrics: {
      attendance: latestDayRows.length ? Math.round((latestPresent / latestDayRows.length) * 1000) / 10 : null,
      actionSignals: signalRows.filter((s) => s.active && (s.severity === "action" || s.severity === "critical")).length,
      activeInterventions: interventionRows.filter((i) => ["active", "review_due"].includes(i.status)).length,
      assessmentReadiness: allPercentages.length ? Math.round((allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length) * 10) / 10 : null,
      attendanceAsOf: latestAttendanceDay ?? null,
    },
    signals: signalRows.map((signal) => ({ ...signal, evidence: evidenceBySignal.get(signal.id) ?? [] })),
    interventions: interventionRows.map((intervention) => ({ ...intervention, studentCount: interventionCounts.get(intervention.id) ?? 0 })),
    students: studentView,
  };
}

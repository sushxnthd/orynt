import "server-only";
import { eq } from "drizzle-orm";
import type { ScopedIdentity } from "@/lib/auth/scope";
import { accessAllows } from "@/lib/auth/scope";
import { getDb } from "@/lib/db/client";
import { assessments, classes, concepts, courseOfferings, results, staff, subjects } from "@/lib/db/schema";
import { assignments, assignmentSubmissions, syllabusProgress } from "@/lib/db/extended-schema";

export async function getAcademicsData(tenantId: string, identity?: ScopedIdentity) {
  const db = getDb();
  const [allCourses, classRows, subjectRows, staffRows, allAssessments, allResults, conceptRows, allProgress, allAssignments, allSubmissions] = await Promise.all([
    db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, tenantId)),
    db.select().from(classes).where(eq(classes.tenantId, tenantId)),
    db.select().from(subjects).where(eq(subjects.tenantId, tenantId)),
    db.select().from(staff).where(eq(staff.tenantId, tenantId)),
    db.select().from(assessments).where(eq(assessments.tenantId, tenantId)),
    db.select().from(results).where(eq(results.tenantId, tenantId)),
    db.select().from(concepts).where(eq(concepts.tenantId, tenantId)),
    db.select().from(syllabusProgress).where(eq(syllabusProgress.tenantId, tenantId)),
    db.select().from(assignments).where(eq(assignments.tenantId, tenantId)),
    db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.tenantId, tenantId)),
  ]);

  const classById = new Map(classRows.map((row) => [row.id, row]));
  const subjectById = new Map(subjectRows.map((row) => [row.id, row]));
  const staffById = new Map(staffRows.map((row) => [row.id, row]));
  const courses = identity ? allCourses.filter((course) => {
    const cls = classById.get(course.classId);
    return accessAllows(identity, { grade: cls?.grade, classId: course.classId, subjectId: course.subjectId });
  }) : allCourses;
  const courseIds = new Set(courses.map((course) => course.id));
  const assessmentRows = allAssessments.filter((row) => courseIds.has(row.courseOfferingId));
  const assessmentIds = new Set(assessmentRows.map((row) => row.id));
  const resultRows = allResults.filter((row) => assessmentIds.has(row.assessmentId));
  const progressRows = allProgress.filter((row) => courseIds.has(row.courseOfferingId));
  const assignmentRows = allAssignments.filter((row) => courseIds.has(row.courseOfferingId));
  const assignmentIds = new Set(assignmentRows.map((row) => row.id));
  const submissionRows = allSubmissions.filter((row) => assignmentIds.has(row.assignmentId));

  const assessmentById = new Map(assessmentRows.map((row) => [row.id, row]));
  const conceptById = new Map(conceptRows.map((row) => [row.id, row]));
  const submissionsByAssignment = new Map<string, typeof submissionRows>();
  for (const submission of submissionRows) submissionsByAssignment.set(submission.assignmentId, [...(submissionsByAssignment.get(submission.assignmentId) ?? []), submission]);

  const courseViews = courses.map((course) => {
    const cls = classById.get(course.classId);
    const subject = subjectById.get(course.subjectId);
    const teacher = course.teacherStaffId ? staffById.get(course.teacherStaffId) : undefined;
    const courseAssessments = assessmentRows.filter((a) => a.courseOfferingId === course.id);
    const courseAssessmentIds = new Set(courseAssessments.map((a) => a.id));
    const percentages = resultRows.filter((r) => courseAssessmentIds.has(r.assessmentId) && !r.absent).map((r) => {
      const assessment = assessmentById.get(r.assessmentId);
      return assessment && Number(assessment.maxScore) > 0 ? (Number(r.score) / Number(assessment.maxScore)) * 100 : NaN;
    }).filter(Number.isFinite);
    const progress = progressRows.filter((row) => row.courseOfferingId === course.id);
    const complete = progress.filter((row) => row.status === "taught" || row.status === "reviewed").length;
    const courseAssignments = assignmentRows.filter((a) => a.courseOfferingId === course.id);
    const submissions = courseAssignments.flatMap((a) => submissionsByAssignment.get(a.id) ?? []);
    const submitted = submissions.filter((s) => s.status === "submitted" || s.status === "late").length;
    return {
      id: course.id,
      className: cls ? `${cls.grade}${cls.section}` : "Unknown",
      subject: subject?.name ?? "Unknown subject",
      teacher: teacher?.name ?? "Unassigned",
      assessmentCount: courseAssessments.length,
      average: percentages.length ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10 : null,
      syllabusComplete: progress.length ? Math.round((complete / progress.length) * 100) : null,
      assignments: courseAssignments.length,
      submissionRate: submissions.length ? Math.round((submitted / submissions.length) * 100) : null,
    };
  });

  return {
    courses: courseViews,
    concepts: progressRows.map((row) => ({
      id: row.id,
      courseOfferingId: row.courseOfferingId,
      concept: conceptById.get(row.conceptId)?.name ?? "Unknown concept",
      status: row.status,
      evidence: row.evidence,
    })),
    assessments: assessmentRows.map((assessment) => {
      const course = courses.find((c) => c.id === assessment.courseOfferingId);
      return {
        ...assessment,
        className: classById.get(course?.classId ?? "")?.name ?? "Unknown",
        subject: subjectById.get(course?.subjectId ?? "")?.name ?? "Unknown",
      };
    }),
    assignments: assignmentRows.map((assignment) => ({
      ...assignment,
      concept: assignment.conceptId ? conceptById.get(assignment.conceptId)?.name ?? null : null,
      submissions: submissionsByAssignment.get(assignment.id)?.length ?? 0,
    })),
  };
}

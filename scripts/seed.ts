import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import {
  assessments, assessmentConcepts, attendance, classes, concepts, courseOfferings,
  interventionEvents, interventionStudents, interventions, memberships, results,
  signalEvidence, signals, staff, students, subjects, tenants, users, visionEvents,
} from "../lib/db/schema";

async function main() {
  const db = getDb();
  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "orynt-academy")).limit(1);
  if (existing.length) {
    console.log("Orynt Academy already exists; seed is intentionally idempotent by tenant slug.");
    return;
  }

  const [tenant] = await db.insert(tenants).values({ name: "Orynt Academy", slug: "orynt-academy" }).returning();
  const [principal] = await db.insert(users).values({
    email: "principal@orynt.local",
    name: "Dr. Ananya Kapoor",
    passwordHash: await hash("orynt-demo-2026", 12),
  }).returning();
  await db.insert(memberships).values({ tenantId: tenant.id, userId: principal.id, role: "principal" });

  const [chemTeacher, mathTeacher] = await db.insert(staff).values([
    { tenantId: tenant.id, name: "Rohan Sharma", title: "PGT Chemistry" },
    { tenantId: tenant.id, name: "Nandita Iyer", title: "TGT Mathematics" },
  ]).returning();
  const [chemistry, mathematics] = await db.insert(subjects).values([
    { tenantId: tenant.id, code: "CHEM", name: "Chemistry" },
    { tenantId: tenant.id, code: "MATH", name: "Mathematics" },
  ]).returning();
  const [class12c, class10b, class9a] = await db.insert(classes).values([
    { tenantId: tenant.id, name: "12C", grade: "12", section: "C", homeroomStaffId: chemTeacher.id },
    { tenantId: tenant.id, name: "10B", grade: "10", section: "B" },
    { tenantId: tenant.id, name: "9A", grade: "9", section: "A", homeroomStaffId: mathTeacher.id },
  ]).returning();

  const seededStudents = await db.insert(students).values([
    { tenantId: tenant.id, externalId: "S001", admissionNumber: "OA-12031", firstName: "Aarav", lastName: "Mehta", grade: "12", section: "C" },
    { tenantId: tenant.id, externalId: "S002", admissionNumber: "OA-12042", firstName: "Isha", lastName: "Rao", grade: "12", section: "C" },
    { tenantId: tenant.id, externalId: "S003", admissionNumber: "OA-10087", firstName: "Kabir", lastName: "Singh", grade: "10", section: "B" },
    { tenantId: tenant.id, externalId: "S004", admissionNumber: "OA-09015", firstName: "Meera", lastName: "Nair", grade: "9", section: "A" },
  ]).returning();
  const [aarav, isha, kabir, meera] = seededStudents;

  const [chemCourse, mathCourse] = await db.insert(courseOfferings).values([
    { tenantId: tenant.id, classId: class12c.id, subjectId: chemistry.id, teacherStaffId: chemTeacher.id, academicYear: "2026-27" },
    { tenantId: tenant.id, classId: class9a.id, subjectId: mathematics.id, teacherStaffId: mathTeacher.id, academicYear: "2026-27" },
  ]).returning();

  const [electrochem, nernst, factorisation] = await db.insert(concepts).values([
    { tenantId: tenant.id, subjectId: chemistry.id, name: "Electrochemistry", curriculumCode: "CBSE12-CHEM-U2" },
    { tenantId: tenant.id, subjectId: chemistry.id, name: "Nernst Equation", curriculumCode: "CBSE12-CHEM-U2-NERNST" },
    { tenantId: tenant.id, subjectId: mathematics.id, name: "Factorisation", curriculumCode: "CBSE9-MATH-POLY-FAC" },
  ]).returning();

  const [chemAssessment, mathAssessment] = await db.insert(assessments).values([
    { tenantId: tenant.id, courseOfferingId: chemCourse.id, title: "Electrochemistry Checkpoint", occurredOn: "2026-10-05", maxScore: "30" },
    { tenantId: tenant.id, courseOfferingId: mathCourse.id, title: "Polynomial Skills Check", occurredOn: "2026-10-06", maxScore: "20" },
  ]).returning();
  await db.insert(assessmentConcepts).values([
    { assessmentId: chemAssessment.id, conceptId: electrochem.id, weight: "0.55" },
    { assessmentId: chemAssessment.id, conceptId: nernst.id, weight: "0.45" },
    { assessmentId: mathAssessment.id, conceptId: factorisation.id, weight: "1" },
  ]);
  await db.insert(results).values([
    { tenantId: tenant.id, assessmentId: chemAssessment.id, studentId: aarav.id, score: "17" },
    { tenantId: tenant.id, assessmentId: chemAssessment.id, studentId: isha.id, score: "27" },
    { tenantId: tenant.id, assessmentId: mathAssessment.id, studentId: meera.id, score: "14" },
  ]);

  await db.insert(attendance).values([
    { tenantId: tenant.id, studentId: aarav.id, day: "2026-09-21", status: "absent" },
    { tenantId: tenant.id, studentId: aarav.id, day: "2026-09-22", status: "absent" },
    { tenantId: tenant.id, studentId: aarav.id, day: "2026-10-08", status: "present" },
    { tenantId: tenant.id, studentId: isha.id, day: "2026-10-08", status: "present" },
    { tenantId: tenant.id, studentId: kabir.id, day: "2026-10-07", status: "absent" },
    { tenantId: tenant.id, studentId: kabir.id, day: "2026-10-08", status: "absent" },
    { tenantId: tenant.id, studentId: meera.id, day: "2026-10-08", status: "present" },
  ]);

  const [chemSignal, attendanceSignal] = await db.insert(signals).values([
    { tenantId: tenant.id, classId: class12c.id, type: "concept_mastery_drop", severity: "action", title: "12C Chemistry performance decline", explanation: "Electrochemistry mastery is below the cohort's prior-unit baseline; missed prerequisite instruction is concentrated among affected students.", score: "0.72", confidence: "0.91", ruleVersion: "concept-drop-v1.0" },
    { tenantId: tenant.id, studentId: kabir.id, classId: class10b.id, type: "attendance_deterioration", severity: "critical", title: "Attendance deterioration", explanation: "Rolling absence threshold crossed with concurrent completion decline. Requires human review before action.", score: "0.86", confidence: "0.95", ruleVersion: "attendance-v2.1" },
  ]).returning();
  await db.insert(signalEvidence).values([
    { signalId: chemSignal.id, sourceType: "assessment", sourceId: chemAssessment.id, label: "Electrochemistry checkpoint", value: "58% cohort median" },
    { signalId: chemSignal.id, sourceType: "attendance", sourceId: aarav.id, label: "Prerequisite absences", value: "2 recorded absences" },
    { signalId: attendanceSignal.id, sourceType: "attendance", sourceId: kabir.id, label: "Rolling attendance", value: "82.1%" },
  ]);

  const [intervention] = await db.insert(interventions).values({
    tenantId: tenant.id,
    title: "12C electrochemistry prerequisite recovery",
    rationale: "Restore prerequisite coverage for affected students before the next electrochemistry assessment.",
    ownerUserId: principal.id,
    createdByUserId: principal.id,
    status: "active",
    reviewAt: new Date("2026-10-12T09:00:00+05:30"),
    successMetric: "Median score on aligned follow-up assessment",
    baselineValue: "58",
  }).returning();
  await db.insert(interventionStudents).values([{ interventionId: intervention.id, studentId: aarav.id }]);
  await db.insert(interventionEvents).values({ tenantId: tenant.id, interventionId: intervention.id, actorUserId: principal.id, type: "created", note: "Synthetic seed intervention" });

  await db.insert(visionEvents).values([
    { tenantId: tenant.id, cameraExternalId: "CAM-NST-02", zone: "North stairwell", eventType: "crowding", status: "new", confidence: "0.94", occurredAt: new Date("2026-10-09T08:03:00+05:30"), metadata: { peopleEstimate: 31, threshold: 24 } },
    { tenantId: tenant.id, cameraExternalId: "CAM-LAB-04", zone: "Lab corridor", eventType: "camera_offline", status: "reviewing", confidence: "1", occurredAt: new Date("2026-10-09T07:51:00+05:30") },
    { tenantId: tenant.id, cameraExternalId: "CAM-LIB-01", zone: "Library", eventType: "after_hours_occupancy", status: "confirmed", confidence: "0.88", occurredAt: new Date("2026-10-08T18:42:00+05:30") },
  ]);

  console.log("Seeded Orynt Academy");
  console.log("Demo login: principal@orynt.local / orynt-demo-2026");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

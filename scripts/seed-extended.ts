import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import { classes, concepts, courseOfferings, memberships, staff, students, tenants, users, visionEvents } from "../lib/db/schema";
import { assignments, assignmentSubmissions, classMeetings, guardianStudentLinks, incidents, retentionPolicies, rooms, sourceSystems, studentUserLinks, syllabusProgress, tasks, timetableSlots } from "../lib/db/extended-schema";

async function ensureUser(email: string, name: string, password: string) {
  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email, name, passwordHash: await hash(password, 12) }).returning();
  return created;
}

async function main() {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "orynt-academy")).limit(1);
  if (!tenant) throw new Error("Run the core seed before seed-extended");

  const [principal] = await db.select().from(users).where(eq(users.email, "principal@orynt.local")).limit(1);
  if (!principal) throw new Error("Synthetic principal is missing");

  const classRows = await db.select().from(classes).where(eq(classes.tenantId, tenant.id));
  const class12c = classRows.find((c) => c.grade === "12" && c.section === "C");
  const class9a = classRows.find((c) => c.grade === "9" && c.section === "A");
  if (!class12c || !class9a) throw new Error("Synthetic classes are missing");

  const courseRows = await db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, tenant.id));
  const chemCourse = courseRows.find((c) => c.classId === class12c.id);
  const mathCourse = courseRows.find((c) => c.classId === class9a.id);
  if (!chemCourse || !mathCourse) throw new Error("Synthetic course offerings are missing");

  const staffRows = await db.select().from(staff).where(eq(staff.tenantId, tenant.id));
  const chemTeacher = staffRows.find((s) => s.name === "Rohan Sharma");
  const mathTeacher = staffRows.find((s) => s.name === "Nandita Iyer");

  const studentRows = await db.select().from(students).where(eq(students.tenantId, tenant.id));
  const aarav = studentRows.find((s) => s.externalId === "S001");
  const isha = studentRows.find((s) => s.externalId === "S002");
  const meera = studentRows.find((s) => s.externalId === "S004");
  if (!aarav || !isha || !meera) throw new Error("Synthetic students are missing");

  const conceptRows = await db.select().from(concepts).where(eq(concepts.tenantId, tenant.id));
  const electrochem = conceptRows.find((c) => c.name === "Electrochemistry");
  const factorisation = conceptRows.find((c) => c.name === "Factorisation");
  if (!electrochem || !factorisation) throw new Error("Synthetic concepts are missing");

  const seededRooms = await db.insert(rooms).values([
    { tenantId: tenant.id, name: "Chemistry Lab 2", building: "Science Block", zone: "Lab corridor", capacity: 34 },
    { tenantId: tenant.id, name: "Room 9A", building: "Academic Block A", zone: "Level 1", capacity: 36 },
    { tenantId: tenant.id, name: "Library", building: "Central Block", zone: "Library", capacity: 80 },
  ]).onConflictDoNothing().returning();
  const roomRows = seededRooms.length ? seededRooms : await db.select().from(rooms).where(eq(rooms.tenantId, tenant.id));
  const chemistryLab = roomRows.find((r) => r.name === "Chemistry Lab 2")!;
  const room9a = roomRows.find((r) => r.name === "Room 9A")!;

  const insertedSlots = await db.insert(timetableSlots).values([
    { tenantId: tenant.id, classId: class12c.id, courseOfferingId: chemCourse.id, roomId: chemistryLab.id, dayOfWeek: 5, period: 2, startsAt: "08:45:00", endsAt: "09:30:00" },
    { tenantId: tenant.id, classId: class9a.id, courseOfferingId: mathCourse.id, roomId: room9a.id, dayOfWeek: 5, period: 3, startsAt: "09:30:00", endsAt: "10:15:00" },
  ]).onConflictDoNothing().returning();
  const slotRows = insertedSlots.length ? insertedSlots : await db.select().from(timetableSlots).where(eq(timetableSlots.tenantId, tenant.id));
  const chemSlot = slotRows.find((s) => s.courseOfferingId === chemCourse.id)!;
  const mathSlot = slotRows.find((s) => s.courseOfferingId === mathCourse.id)!;

  const existingMeetings = await db.select({ id: classMeetings.id }).from(classMeetings).where(eq(classMeetings.tenantId, tenant.id)).limit(1);
  if (!existingMeetings.length) {
    await db.insert(classMeetings).values([
      { tenantId: tenant.id, timetableSlotId: chemSlot.id, courseOfferingId: chemCourse.id, scheduledOn: "2026-10-09", teacherStaffId: chemTeacher?.id, status: "completed", coverageNote: "Electrochemistry remediation and Nernst equation worked examples" },
      { tenantId: tenant.id, timetableSlotId: mathSlot.id, courseOfferingId: mathCourse.id, scheduledOn: "2026-10-09", teacherStaffId: mathTeacher?.id, status: "substituted", substituteStaffId: chemTeacher?.id, coverageNote: "Factorisation practice set; substitute coverage recorded" },
    ]);
  }

  const existingAssignments = await db.select().from(assignments).where(eq(assignments.tenantId, tenant.id));
  let chemistryAssignment = existingAssignments.find((a) => a.title === "Electrochemistry recovery set");
  let mathAssignment = existingAssignments.find((a) => a.title === "Factorisation practice set");
  if (!chemistryAssignment || !mathAssignment) {
    const created = await db.insert(assignments).values([
      { tenantId: tenant.id, courseOfferingId: chemCourse.id, conceptId: electrochem.id, title: "Electrochemistry recovery set", assignedAt: new Date("2026-10-09T10:30:00+05:30"), dueAt: new Date("2026-10-12T18:00:00+05:30"), maxScore: "20" },
      { tenantId: tenant.id, courseOfferingId: mathCourse.id, conceptId: factorisation.id, title: "Factorisation practice set", assignedAt: new Date("2026-10-09T10:30:00+05:30"), dueAt: new Date("2026-10-11T18:00:00+05:30"), maxScore: "15" },
    ]).returning();
    chemistryAssignment ??= created.find((a) => a.title === "Electrochemistry recovery set");
    mathAssignment ??= created.find((a) => a.title === "Factorisation practice set");
  }
  if (!chemistryAssignment || !mathAssignment) throw new Error("Could not seed assignments");

  await db.insert(assignmentSubmissions).values([
    { tenantId: tenant.id, assignmentId: chemistryAssignment.id, studentId: aarav.id, status: "assigned" },
    { tenantId: tenant.id, assignmentId: chemistryAssignment.id, studentId: isha.id, status: "submitted", submittedAt: new Date("2026-10-10T17:10:00+05:30"), score: "18" },
    { tenantId: tenant.id, assignmentId: mathAssignment.id, studentId: meera.id, status: "submitted", submittedAt: new Date("2026-10-10T16:20:00+05:30"), score: "12" },
  ]).onConflictDoNothing();

  await db.insert(syllabusProgress).values([
    { tenantId: tenant.id, courseOfferingId: chemCourse.id, conceptId: electrochem.id, status: "in_progress", taughtAt: new Date("2026-10-09T09:30:00+05:30"), evidence: "Class meeting + checkpoint assessment" },
    { tenantId: tenant.id, courseOfferingId: mathCourse.id, conceptId: factorisation.id, status: "taught", taughtAt: new Date("2026-10-09T10:15:00+05:30"), evidence: "Class meeting coverage note" },
  ]).onConflictDoNothing();

  const [coreIntervention] = await db.query.interventions.findFirst({ where: (table, { eq }) => eq(table.tenantId, tenant.id) }).then((row) => [row]);
  const existingTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.tenantId, tenant.id)).limit(1);
  if (!existingTasks.length) {
    await db.insert(tasks).values([
      { tenantId: tenant.id, title: "Review 12C recovery results", description: "Compare follow-up electrochemistry evidence with the recorded intervention baseline.", ownerUserId: principal.id, createdByUserId: principal.id, interventionId: coreIntervention?.id, status: "open", dueAt: new Date("2026-10-12T15:00:00+05:30") },
      { tenantId: tenant.id, title: "Resolve Lab corridor camera outage", ownerUserId: principal.id, createdByUserId: principal.id, status: "in_progress", dueAt: new Date("2026-10-09T13:00:00+05:30") },
    ]);
  }

  const [libraryEvent] = await db.select().from(visionEvents).where(and(eq(visionEvents.tenantId, tenant.id), eq(visionEvents.zone, "Library"))).limit(1);
  const existingIncidents = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.tenantId, tenant.id)).limit(1);
  if (!existingIncidents.length && libraryEvent) {
    await db.insert(incidents).values({ tenantId: tenant.id, title: "After-hours library occupancy review", category: "safety", zone: "Library", occurredAt: libraryEvent.occurredAt, status: "resolved", ownerUserId: principal.id, visionEventId: libraryEvent.id, summary: "Vision event escalated for human review.", resolution: "Authorized staff activity confirmed; no student identity inference required." });
  }

  await db.insert(sourceSystems).values([
    { tenantId: tenant.id, name: "Core SIS CSV", kind: "csv", health: "healthy", lastSuccessfulSyncAt: new Date("2026-10-09T08:42:00+05:30"), lastAttemptAt: new Date("2026-10-09T08:42:00+05:30"), freshnessMinutes: 60, config: { entities: ["students", "attendance"] } },
    { tenantId: tenant.id, name: "Vision Gateway", kind: "vision_events", health: "stale", lastSuccessfulSyncAt: new Date("2026-10-09T07:51:00+05:30"), lastAttemptAt: new Date("2026-10-09T08:45:00+05:30"), freshnessMinutes: 15, errorMessage: "CAM-LAB-04 offline" },
  ]).onConflictDoNothing();

  await db.insert(retentionPolicies).values([
    { tenantId: tenant.id, dataClass: "vision_event_metadata", retainDays: 30, legalBasis: "school safety / configured institutional policy" },
    { tenantId: tenant.id, dataClass: "vision_snapshots", retainDays: 15, legalBasis: "configured school safety retention" },
    { tenantId: tenant.id, dataClass: "audit_events", retainDays: 365, legalBasis: "security and accountability" },
  ]).onConflictDoNothing();

  const studentUser = await ensureUser("aarav@orynt.local", "Aarav Mehta", "orynt-student-2026");
  const parentUser = await ensureUser("parent.aarav@orynt.local", "Neha Mehta", "orynt-parent-2026");
  await db.insert(memberships).values([
    { tenantId: tenant.id, userId: studentUser.id, role: "student" },
    { tenantId: tenant.id, userId: parentUser.id, role: "parent" },
  ]).onConflictDoNothing();
  await db.insert(studentUserLinks).values({ tenantId: tenant.id, userId: studentUser.id, studentId: aarav.id }).onConflictDoNothing();
  await db.insert(guardianStudentLinks).values({ tenantId: tenant.id, userId: parentUser.id, studentId: aarav.id, relationship: "parent" }).onConflictDoNothing();

  console.log("Seeded extended Orynt Academy operations and relationship-scoped portal accounts");
  console.log("Student login: aarav@orynt.local / orynt-student-2026");
  console.log("Parent login: parent.aarav@orynt.local / orynt-parent-2026");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

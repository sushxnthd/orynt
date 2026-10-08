import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { accessAllows } from "../lib/auth/scope";
import { closeDb, getDb } from "../lib/db/client";
import { classes, memberships, students, subjects, tenants, users } from "../lib/db/schema";
import type { Scope } from "../lib/auth/policy";

async function main() {
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "orynt-academy")).limit(1);
  assert(tenant, "synthetic tenant missing");
  const [teacher] = await db.select().from(users).where(eq(users.email, "rohan@orynt.local")).limit(1);
  assert(teacher, "scoped teacher missing");
  const [membership] = await db.select().from(memberships).where(and(eq(memberships.tenantId, tenant.id), eq(memberships.userId, teacher.id))).limit(1);
  assert(membership, "teacher membership missing");
  const identity = { role: membership.role, scope: (membership.scope ?? {}) as Scope };

  const classRows = await db.select().from(classes).where(eq(classes.tenantId, tenant.id));
  const class12c = classRows.find((row) => row.grade === "12" && row.section === "C");
  const class10b = classRows.find((row) => row.grade === "10" && row.section === "B");
  assert(class12c && class10b, "synthetic classes missing");
  const subjectRows = await db.select().from(subjects).where(eq(subjects.tenantId, tenant.id));
  const chemistry = subjectRows.find((row) => row.code === "CHEM");
  const mathematics = subjectRows.find((row) => row.code === "MATH");
  assert(chemistry && mathematics, "synthetic subjects missing");

  assert.equal(accessAllows(identity, { grade: "12", classId: class12c.id, subjectId: chemistry.id }), true, "teacher must access assigned 12C Chemistry");
  assert.equal(accessAllows(identity, { grade: "12", classId: class12c.id, subjectId: mathematics.id }), false, "teacher must not access 12C Mathematics");
  assert.equal(accessAllows(identity, { grade: "10", classId: class10b.id, subjectId: chemistry.id }), false, "teacher must not access 10B");

  const studentRows = await db.select().from(students).where(eq(students.tenantId, tenant.id));
  const aarav = studentRows.find((row) => row.externalId === "S001");
  const kabir = studentRows.find((row) => row.externalId === "S003");
  assert(aarav && kabir, "synthetic students missing");
  const classForStudent = (student: typeof aarav) => classRows.find((row) => row.grade === student.grade && row.section === student.section);
  const aaravClass = classForStudent(aarav);
  const kabirClass = classForStudent(kabir);
  assert(aaravClass && kabirClass, "student class mapping missing");
  assert.equal(accessAllows(identity, { grade: aarav.grade, classId: aaravClass.id, subjectId: chemistry.id }), true);
  assert.equal(accessAllows(identity, { grade: kabir.grade, classId: kabirClass.id, subjectId: chemistry.id }), false);

  console.log("Scope smoke test passed: assigned class/subject allowed; unrelated class/subject denied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

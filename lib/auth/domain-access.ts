import "server-only";
import { and, eq } from "drizzle-orm";
import type { ScopedIdentity } from "./scope";
import { accessAllows } from "./scope";
import { getDb } from "@/lib/db/client";
import { classes, courseOfferings, students } from "@/lib/db/schema";

export async function getAuthorizedCourse(tenantId: string, courseOfferingId: string, identity: ScopedIdentity) {
  const db = getDb();
  const [course] = await db.select().from(courseOfferings).where(and(eq(courseOfferings.id, courseOfferingId), eq(courseOfferings.tenantId, tenantId))).limit(1);
  if (!course) return null;
  const [cls] = await db.select().from(classes).where(and(eq(classes.id, course.classId), eq(classes.tenantId, tenantId))).limit(1);
  if (!cls) return null;
  if (!accessAllows(identity, { grade: cls.grade, classId: cls.id, subjectId: course.subjectId })) return null;
  return { course, class: cls };
}

export async function getAuthorizedStudent(tenantId: string, studentId: string, identity: ScopedIdentity) {
  const db = getDb();
  const [student] = await db.select().from(students).where(and(eq(students.id, studentId), eq(students.tenantId, tenantId))).limit(1);
  if (!student) return null;
  const [cls] = await db.select().from(classes).where(and(eq(classes.tenantId, tenantId), eq(classes.grade, student.grade), eq(classes.section, student.section))).limit(1);
  if (!cls) return accessAllows(identity, { grade: student.grade }) ? { student, class: null } : null;
  if (identity.scope?.subjectIds?.length) {
    const courses = await db.select().from(courseOfferings).where(and(eq(courseOfferings.tenantId, tenantId), eq(courseOfferings.classId, cls.id)));
    if (!courses.some((course) => accessAllows(identity, { grade: cls.grade, classId: cls.id, subjectId: course.subjectId }))) return null;
  } else if (!accessAllows(identity, { grade: cls.grade, classId: cls.id })) {
    return null;
  }
  return { student, class: cls };
}

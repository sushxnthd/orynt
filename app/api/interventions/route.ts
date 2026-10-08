import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { accessAllows } from "@/lib/auth/scope";
import { getRequestSession } from "@/lib/auth/request";
import { getCommandData } from "@/lib/data/command";
import { getDb } from "@/lib/db/client";
import { auditEvents, classes, courseOfferings, interventionEvents, interventionStudents, interventions, students } from "@/lib/db/schema";

const createSchema = z.object({
  title: z.string().min(3).max(180),
  rationale: z.string().min(10).max(4000),
  studentIds: z.array(z.string().uuid()).min(1).max(200),
  dueAt: z.string().datetime().optional(),
  reviewAt: z.string().datetime().optional(),
  successMetric: z.string().min(3).max(300),
  baselineValue: z.number().finite().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "intervention:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const data = await getCommandData(session.tenantId, session);
  return NextResponse.json({ interventions: data.interventions });
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "intervention:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid intervention", details: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const uniqueStudentIds = [...new Set(parsed.data.studentIds)];
  const targetStudents = await db.select().from(students).where(and(eq(students.tenantId, session.tenantId), inArray(students.id, uniqueStudentIds)));
  if (targetStudents.length !== uniqueStudentIds.length) return NextResponse.json({ error: "One or more students are outside your tenant or do not exist" }, { status: 400 });

  const [classRows, courses] = await Promise.all([
    db.select().from(classes).where(eq(classes.tenantId, session.tenantId)),
    db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, session.tenantId)),
  ]);
  const classByKey = new Map(classRows.map((row) => [`${row.grade}:${row.section}`, row]));
  const outsideScope = targetStudents.filter((student) => {
    const cls = classByKey.get(`${student.grade}:${student.section}`);
    if (!cls) return !accessAllows(session, { grade: student.grade });
    if (session.scope?.subjectIds?.length) {
      return !courses.some((course) => course.classId === cls.id && accessAllows(session, { grade: student.grade, classId: cls.id, subjectId: course.subjectId }));
    }
    return !accessAllows(session, { grade: student.grade, classId: cls.id });
  });
  if (outsideScope.length) return NextResponse.json({ error: "One or more students are outside your authorized grade/class/subject scope" }, { status: 403 });

  const created = await db.transaction(async (tx) => {
    const [intervention] = await tx.insert(interventions).values({
      tenantId: session.tenantId,
      title: parsed.data.title,
      rationale: parsed.data.rationale,
      ownerUserId: session.userId,
      createdByUserId: session.userId,
      status: "active",
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      reviewAt: parsed.data.reviewAt ? new Date(parsed.data.reviewAt) : undefined,
      successMetric: parsed.data.successMetric,
      baselineValue: parsed.data.baselineValue === undefined ? undefined : String(parsed.data.baselineValue),
    }).returning();

    await tx.insert(interventionStudents).values(uniqueStudentIds.map((studentId) => ({ interventionId: intervention.id, studentId })));
    await tx.insert(interventionEvents).values({ tenantId: session.tenantId, interventionId: intervention.id, actorUserId: session.userId, type: "created", note: "Intervention activated with recorded rationale and baseline." });
    await tx.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "intervention.create", entityType: "intervention", entityId: intervention.id, reason: parsed.data.rationale, after: intervention });
    return intervention;
  });

  return NextResponse.json({ intervention: created }, { status: 201 });
}

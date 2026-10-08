import { and, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, interventionEvents, interventionStudents, interventions, students } from "@/lib/db/schema";

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
  const db = getDb();
  const rows = await db.select().from(interventions).where(eq(interventions.tenantId, session.tenantId)).orderBy(desc(interventions.createdAt)).limit(200);
  return NextResponse.json({ interventions: rows });
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "intervention:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid intervention", details: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const uniqueStudentIds = [...new Set(parsed.data.studentIds)];
  const allowedStudents = await db.select({ id: students.id }).from(students).where(and(eq(students.tenantId, session.tenantId), inArray(students.id, uniqueStudentIds)));
  if (allowedStudents.length !== uniqueStudentIds.length) return NextResponse.json({ error: "One or more students are outside your tenant or do not exist" }, { status: 400 });

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

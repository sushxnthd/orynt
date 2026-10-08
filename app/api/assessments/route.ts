import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getAuthorizedCourse } from "@/lib/auth/domain-access";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { assessments, auditEvents } from "@/lib/db/schema";

const schema = z.object({
  courseOfferingId: z.string().uuid(),
  title: z.string().min(3).max(180),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxScore: z.number().positive().max(10000),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "assessment:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment", details: parsed.error.flatten() }, { status: 400 });
  const authorized = await getAuthorizedCourse(session.tenantId, parsed.data.courseOfferingId, session);
  if (!authorized) return NextResponse.json({ error: "Course is outside your authorized scope" }, { status: 403 });

  const db = getDb();
  const [assessment] = await db.insert(assessments).values({
    tenantId: session.tenantId,
    courseOfferingId: parsed.data.courseOfferingId,
    title: parsed.data.title,
    occurredOn: parsed.data.occurredOn,
    maxScore: String(parsed.data.maxScore),
  }).returning();
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "assessment.create", entityType: "assessment", entityId: assessment.id, reason: "Authorized assessment creation", after: assessment });
  return NextResponse.json({ assessment }, { status: 201 });
}

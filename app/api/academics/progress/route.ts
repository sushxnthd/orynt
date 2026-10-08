import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getAuthorizedCourse } from "@/lib/auth/domain-access";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, concepts } from "@/lib/db/schema";
import { syllabusProgress } from "@/lib/db/extended-schema";

const schema = z.object({
  courseOfferingId: z.string().uuid(),
  conceptId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "taught", "reviewed"]),
  evidence: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "academics:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid curriculum progress update", details: parsed.error.flatten() }, { status: 400 });

  const courseAccess = await getAuthorizedCourse(session.tenantId, parsed.data.courseOfferingId, session);
  if (!courseAccess) return NextResponse.json({ error: "Course is outside your authorized scope" }, { status: 403 });
  const db = getDb();
  const [concept] = await db.select().from(concepts).where(and(eq(concepts.id, parsed.data.conceptId), eq(concepts.tenantId, session.tenantId))).limit(1);
  if (!concept || concept.subjectId !== courseAccess.course.subjectId) return NextResponse.json({ error: "Concept does not belong to the authorized course subject" }, { status: 400 });

  const now = new Date();
  const [row] = await db.insert(syllabusProgress).values({
    tenantId: session.tenantId,
    courseOfferingId: parsed.data.courseOfferingId,
    conceptId: parsed.data.conceptId,
    status: parsed.data.status,
    taughtAt: parsed.data.status === "taught" || parsed.data.status === "reviewed" ? now : undefined,
    reviewedAt: parsed.data.status === "reviewed" ? now : undefined,
    evidence: parsed.data.evidence,
  }).onConflictDoUpdate({
    target: [syllabusProgress.courseOfferingId, syllabusProgress.conceptId],
    set: {
      status: parsed.data.status,
      ...(parsed.data.status === "taught" || parsed.data.status === "reviewed" ? { taughtAt: now } : {}),
      ...(parsed.data.status === "reviewed" ? { reviewedAt: now } : {}),
      evidence: parsed.data.evidence,
      updatedAt: now,
    },
  }).returning();
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "academics.progress_upsert", entityType: "syllabus_progress", entityId: row.id, reason: parsed.data.evidence ?? "Curriculum progress update", after: row });
  return NextResponse.json({ progress: row });
}

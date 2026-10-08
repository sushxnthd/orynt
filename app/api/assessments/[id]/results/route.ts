import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getAuthorizedCourse, getAuthorizedStudent } from "@/lib/auth/domain-access";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { assessments, auditEvents, results } from "@/lib/db/schema";

const schema = z.object({
  results: z.array(z.object({
    studentId: z.string().uuid(),
    score: z.number().min(0).max(10000),
    absent: z.boolean().default(false),
  })).min(1).max(250),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "assessment:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid result batch", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await params;
  const db = getDb();
  const [assessment] = await db.select().from(assessments).where(and(eq(assessments.id, id), eq(assessments.tenantId, session.tenantId))).limit(1);
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  const courseAccess = await getAuthorizedCourse(session.tenantId, assessment.courseOfferingId, session);
  if (!courseAccess) return NextResponse.json({ error: "Assessment is outside your authorized scope" }, { status: 403 });
  const maxScore = Number(assessment.maxScore);

  const unique = new Map(parsed.data.results.map((row) => [row.studentId, row]));
  const targets = await Promise.all([...unique.values()].map(async (row) => ({ row, target: await getAuthorizedStudent(session.tenantId, row.studentId, session) })));
  const invalid = targets.filter(({ row, target }) => !target || target.class?.id !== courseAccess.class.id || (!row.absent && row.score > maxScore));
  if (invalid.length) return NextResponse.json({ error: "One or more result rows are outside the assessment class/scope or exceed max score", students: invalid.map(({ row }) => row.studentId) }, { status: 400 });

  await db.transaction(async (tx) => {
    for (const { row } of targets) {
      await tx.insert(results).values({ tenantId: session.tenantId, assessmentId: assessment.id, studentId: row.studentId, score: String(row.score), absent: row.absent })
        .onConflictDoUpdate({ target: [results.assessmentId, results.studentId], set: { score: String(row.score), absent: row.absent, updatedAt: new Date() } });
    }
    await tx.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "assessment.results_upsert", entityType: "assessment", entityId: assessment.id, reason: "Authorized result batch update", after: { assessmentId: assessment.id, rows: targets.length } });
  });

  return NextResponse.json({ ok: true, assessmentId: assessment.id, updated: targets.length });
}

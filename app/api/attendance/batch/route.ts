import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getAuthorizedStudent } from "@/lib/auth/domain-access";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { attendance, auditEvents } from "@/lib/db/schema";

const schema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({ studentId: z.string().uuid(), status: z.enum(["present", "absent", "late", "excused"]) })).min(1).max(250),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "attendance:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid attendance batch", details: parsed.error.flatten() }, { status: 400 });

  const unique = new Map(parsed.data.records.map((row) => [row.studentId, row]));
  const authorized = await Promise.all([...unique.values()].map(async (row) => ({ row, target: await getAuthorizedStudent(session.tenantId, row.studentId, session) })));
  const denied = authorized.filter((entry) => !entry.target).map((entry) => entry.row.studentId);
  if (denied.length) return NextResponse.json({ error: "One or more students are outside your authorized scope", denied }, { status: 403 });

  const db = getDb();
  await db.transaction(async (tx) => {
    for (const { row } of authorized) {
      await tx.insert(attendance).values({ tenantId: session.tenantId, studentId: row.studentId, day: parsed.data.day, status: row.status, source: `manual:${session.userId}` })
        .onConflictDoUpdate({ target: [attendance.studentId, attendance.day], set: { status: row.status, source: `manual:${session.userId}`, updatedAt: new Date() } });
    }
    await tx.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "attendance.batch_upsert", entityType: "attendance_day", entityId: parsed.data.day, reason: "Authorized attendance register update", after: { day: parsed.data.day, records: authorized.length } });
  });
  return NextResponse.json({ ok: true, day: parsed.data.day, updated: authorized.length });
}

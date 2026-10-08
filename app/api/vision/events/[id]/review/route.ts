import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, visionEvents } from "@/lib/db/schema";

const bodySchema = z.object({
  status: z.enum(["reviewing", "dismissed", "confirmed", "resolved"]),
  note: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "vision:review"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  const { id } = await params;
  const db = getDb();
  const [before] = await db.select().from(visionEvents).where(and(eq(visionEvents.id, id), eq(visionEvents.tenantId, session.tenantId))).limit(1);
  if (!before) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const [after] = await db.update(visionEvents).set({ status: parsed.data.status, reviewNote: parsed.data.note, reviewedByUserId: session.userId, reviewedAt: new Date(), updatedAt: new Date() }).where(and(eq(visionEvents.id, id), eq(visionEvents.tenantId, session.tenantId))).returning();
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "vision.review", entityType: "vision_event", entityId: id, reason: parsed.data.note, before, after });
  return NextResponse.json({ event: after });
}

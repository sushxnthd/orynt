import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, memberships, visionEvents } from "@/lib/db/schema";
import { incidents } from "@/lib/db/extended-schema";

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(220),
  category: z.string().min(2).max(80),
  zone: z.string().max(120).optional(),
  occurredAt: z.string().datetime(),
  status: z.enum(["open", "investigating", "resolved", "dismissed"]).default("open"),
  ownerUserId: z.string().uuid().optional(),
  visionEventId: z.string().uuid().optional(),
  summary: z.string().max(4000).optional(),
  resolution: z.string().max(4000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "operations:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid incident", details: parsed.error.flatten() }, { status: 400 });
  const db = getDb();

  if (parsed.data.ownerUserId) {
    const [membership] = await db.select({ userId: memberships.userId }).from(memberships).where(and(eq(memberships.tenantId, session.tenantId), eq(memberships.userId, parsed.data.ownerUserId))).limit(1);
    if (!membership) return NextResponse.json({ error: "Incident owner is not a member of this school" }, { status: 400 });
  }
  if (parsed.data.visionEventId) {
    const [event] = await db.select({ id: visionEvents.id }).from(visionEvents).where(and(eq(visionEvents.id, parsed.data.visionEventId), eq(visionEvents.tenantId, session.tenantId))).limit(1);
    if (!event) return NextResponse.json({ error: "Linked Vision event was not found in this school" }, { status: 400 });
  }

  let before: typeof incidents.$inferSelect | null = null;
  let incident: typeof incidents.$inferSelect;
  if (parsed.data.id) {
    [before] = await db.select().from(incidents).where(and(eq(incidents.id, parsed.data.id), eq(incidents.tenantId, session.tenantId))).limit(1);
    if (!before) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    [incident] = await db.update(incidents).set({ title: parsed.data.title, category: parsed.data.category, zone: parsed.data.zone, occurredAt: new Date(parsed.data.occurredAt), status: parsed.data.status, ownerUserId: parsed.data.ownerUserId, visionEventId: parsed.data.visionEventId, summary: parsed.data.summary, resolution: parsed.data.resolution, updatedAt: new Date() }).where(and(eq(incidents.id, parsed.data.id), eq(incidents.tenantId, session.tenantId))).returning();
  } else {
    [incident] = await db.insert(incidents).values({ tenantId: session.tenantId, title: parsed.data.title, category: parsed.data.category, zone: parsed.data.zone, occurredAt: new Date(parsed.data.occurredAt), status: parsed.data.status, ownerUserId: parsed.data.ownerUserId, visionEventId: parsed.data.visionEventId, summary: parsed.data.summary, resolution: parsed.data.resolution }).returning();
  }
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: before ? "incident.update" : "incident.create", entityType: "incident", entityId: incident.id, reason: parsed.data.summary ?? parsed.data.title, before: before ?? undefined, after: incident });
  return NextResponse.json({ incident }, { status: before ? 200 : 201 });
}

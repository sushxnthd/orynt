import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, memberships } from "@/lib/db/schema";
import { tasks } from "@/lib/db/extended-schema";

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(3000).optional(),
  ownerUserId: z.string().uuid().optional(),
  interventionId: z.string().uuid().optional(),
  status: z.enum(["open", "in_progress", "blocked", "done", "cancelled"]).default("open"),
  dueAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "operations:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task", details: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  if (parsed.data.ownerUserId) {
    const [membership] = await db.select({ userId: memberships.userId }).from(memberships).where(and(eq(memberships.tenantId, session.tenantId), eq(memberships.userId, parsed.data.ownerUserId))).limit(1);
    if (!membership) return NextResponse.json({ error: "Task owner is not a member of this school" }, { status: 400 });
  }

  let before: typeof tasks.$inferSelect | null = null;
  let task: typeof tasks.$inferSelect;
  const completedAt = parsed.data.status === "done" ? new Date() : null;
  if (parsed.data.id) {
    [before] = await db.select().from(tasks).where(and(eq(tasks.id, parsed.data.id), eq(tasks.tenantId, session.tenantId))).limit(1);
    if (!before) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    [task] = await db.update(tasks).set({ title: parsed.data.title, description: parsed.data.description, ownerUserId: parsed.data.ownerUserId, interventionId: parsed.data.interventionId, status: parsed.data.status, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null, completedAt, updatedAt: new Date() }).where(and(eq(tasks.id, parsed.data.id), eq(tasks.tenantId, session.tenantId))).returning();
  } else {
    [task] = await db.insert(tasks).values({ tenantId: session.tenantId, title: parsed.data.title, description: parsed.data.description, ownerUserId: parsed.data.ownerUserId, createdByUserId: session.userId, interventionId: parsed.data.interventionId, status: parsed.data.status, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined, completedAt }).returning();
  }
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: before ? "task.update" : "task.create", entityType: "task", entityId: task.id, reason: parsed.data.description ?? parsed.data.title, before: before ?? undefined, after: task });
  return NextResponse.json({ task }, { status: before ? 200 : 201 });
}

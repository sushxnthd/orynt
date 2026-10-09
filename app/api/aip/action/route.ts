import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, interventions } from "@/lib/db/schema";
import { tasks } from "@/lib/db/extended-schema";

const schema = z.object({ type: z.enum(["create_task", "create_intervention"]), title: z.string().min(3).max(200), rationale: z.string().min(3).max(3000), confirm: z.literal(true) });
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Explicit confirmation is required" }, { status: 400 });
  const db = getDb();
  if (parsed.data.type === "create_task") {
    try { assertCan(session.role, "operations:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
    const [row] = await db.insert(tasks).values({ tenantId: session.tenantId, title: parsed.data.title, description: parsed.data.rationale, createdByUserId: session.userId }).returning();
    await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "aip.task_create", entityType: "task", entityId: row.id, reason: parsed.data.rationale, after: row });
    return NextResponse.json({ id: row.id, type: "task" }, { status: 201 });
  }
  try { assertCan(session.role, "intervention:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const [row] = await db.insert(interventions).values({ tenantId: session.tenantId, title: parsed.data.title, rationale: parsed.data.rationale, createdByUserId: session.userId, status: "draft" }).returning();
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "aip.intervention_create", entityType: "intervention", entityId: row.id, reason: parsed.data.rationale, after: row });
  return NextResponse.json({ id: row.id, type: "intervention" }, { status: 201 });
}

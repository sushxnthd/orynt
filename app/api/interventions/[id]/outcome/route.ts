import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, interventionEvents, interventions } from "@/lib/db/schema";

const schema = z.object({ outcomeValue: z.number().finite(), note: z.string().min(3).max(3000), complete: z.boolean().default(true) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "intervention:close"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid outcome", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await params;
  const db = getDb();
  const [before] = await db.select().from(interventions).where(and(eq(interventions.id, id), eq(interventions.tenantId, session.tenantId))).limit(1);
  if (!before) return NextResponse.json({ error: "Intervention not found" }, { status: 404 });

  const [after] = await db.update(interventions).set({ outcomeValue: String(parsed.data.outcomeValue), outcomeNote: parsed.data.note, status: parsed.data.complete ? "completed" : "review_due", updatedAt: new Date() }).where(and(eq(interventions.id, id), eq(interventions.tenantId, session.tenantId))).returning();
  await db.insert(interventionEvents).values({ tenantId: session.tenantId, interventionId: id, actorUserId: session.userId, type: parsed.data.complete ? "completed" : "outcome_recorded", note: parsed.data.note, payload: { outcomeValue: parsed.data.outcomeValue } });
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "intervention.outcome", entityType: "intervention", entityId: id, reason: parsed.data.note, before, after });
  return NextResponse.json({ intervention: after });
}

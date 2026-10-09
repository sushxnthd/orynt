import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { studioDefinitions } from "@/lib/db/frontier-schema";

const schema = z.object({ kind: z.enum(["object_type", "metric", "workflow"]), key: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/), name: z.string().min(2).max(120), description: z.string().max(1000).optional(), definition: z.record(z.unknown()).default({}), enabled: z.boolean().default(true) });
export async function GET(request: NextRequest) {
  const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "studio:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const rows = await getDb().select().from(studioDefinitions).where(eq(studioDefinitions.tenantId, session.tenantId)).orderBy(desc(studioDefinitions.updatedAt));
  return NextResponse.json({ definitions: rows });
}
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "studio:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid definition", details: parsed.error.flatten() }, { status: 400 });
  const db = getDb(); const [row] = await db.insert(studioDefinitions).values({ tenantId: session.tenantId, createdByUserId: session.userId, ...parsed.data }).onConflictDoUpdate({ target: [studioDefinitions.tenantId, studioDefinitions.kind, studioDefinitions.key], set: { name: parsed.data.name, description: parsed.data.description, definition: parsed.data.definition, enabled: parsed.data.enabled, updatedAt: new Date() } }).returning();
  return NextResponse.json({ definition: row }, { status: 201 });
}

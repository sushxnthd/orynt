import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { studioDefinitions } from "@/lib/db/frontier-schema";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "studio:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params; const [row] = await getDb().delete(studioDefinitions).where(and(eq(studioDefinitions.id, id), eq(studioDefinitions.tenantId, session.tenantId))).returning({ id: studioDefinitions.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 }); return NextResponse.json({ deleted: row.id });
}

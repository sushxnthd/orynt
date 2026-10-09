import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { studioDefinitions } from "@/lib/db/frontier-schema";
import { evaluateMetric, executeWorkflow } from "@/lib/studio/engine";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "studio:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const [definition] = await getDb().select().from(studioDefinitions).where(and(eq(studioDefinitions.id, id), eq(studioDefinitions.tenantId, session.tenantId))).limit(1);
  if (!definition || !definition.enabled) return NextResponse.json({ error: "Definition not found or disabled" }, { status: 404 });
  try {
    if (definition.kind === "metric") return NextResponse.json({ kind: "metric", result: await evaluateMetric(session.tenantId, definition.definition) });
    if (definition.kind === "workflow") {
      try { assertCan(session.role, "studio:write"); } catch { return NextResponse.json({ error: "Studio workflow execution requires write permission" }, { status: 403 }); }
      return NextResponse.json({ kind: "workflow", result: await executeWorkflow(session, definition.name, definition.definition) });
    }
    return NextResponse.json({ kind: "object_type", result: { schema: definition.definition } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Execution failed" }, { status: 400 });
  }
}

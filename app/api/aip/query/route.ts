import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerWithAip } from "@/lib/aip/engine";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";

const schema = z.object({ question: z.string().min(2).max(700) });
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "aip:use"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  const result = await answerWithAip(session, parsed.data.question);
  await getDb().insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "aip.query", entityType: "aip", reason: "Permission-filtered AIP query", after: { mode: result.mode, tools: result.toolCalls.map((item) => item.tool), evidenceCount: result.evidence.length } });
  return NextResponse.json(result);
}

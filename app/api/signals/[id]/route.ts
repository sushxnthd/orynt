import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { signalEvidence, signals } from "@/lib/db/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "school:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;
  const db = getDb();
  const [signal] = await db.select().from(signals).where(and(eq(signals.id, id), eq(signals.tenantId, session.tenantId))).limit(1);
  if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  const evidence = await db.select().from(signalEvidence).where(eq(signalEvidence.signalId, signal.id));
  return NextResponse.json({ signal, evidence, explanationContract: { ruleVersion: signal.ruleVersion, confidence: signal.confidence, automatedDecision: false } });
}

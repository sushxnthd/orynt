import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { scenarioRuns } from "@/lib/db/frontier-schema";
import { simulateScenario } from "@/lib/domain/scenario";

const schema = z.object({ label: z.string().min(2).max(120).default("Scenario"), academicAverage: z.number().min(0).max(100), attendancePercent: z.number().min(0).max(100), syllabusPercent: z.number().min(0).max(100), remediationSessions: z.number().int().min(0).max(12), attendanceDeltaPp: z.number().min(-20).max(20), syllabusDeltaPp: z.number().min(-30).max(30) });
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "forecast:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scenario", details: parsed.error.flatten() }, { status: 400 });
  const { label, ...inputs } = parsed.data;
  const result = simulateScenario(inputs);
  const [run] = await getDb().insert(scenarioRuns).values({ tenantId: session.tenantId, createdByUserId: session.userId, label, inputs, result, modelVersion: result.assumptions.model }).returning();
  return NextResponse.json({ id: run.id, ...result });
}

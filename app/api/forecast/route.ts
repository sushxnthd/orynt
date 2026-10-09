import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getForecastInputs } from "@/lib/data/forecast";
import { getDb } from "@/lib/db/client";
import { forecastRuns } from "@/lib/db/frontier-schema";
import { forecastReadiness } from "@/lib/forecast/engine";

const schema = z.object({ horizon: z.number().int().min(1).max(12).default(1) });
export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "forecast:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid horizon" }, { status: 400 });
  const inputs = await getForecastInputs(session.tenantId);
  const result = forecastReadiness({ ...inputs, horizon: parsed.data.horizon });
  const [run] = await getDb().insert(forecastRuns).values({ tenantId: session.tenantId, createdByUserId: session.userId, targetType: "school_readiness", horizon: parsed.data.horizon, estimate: String(result.estimate), low: String(result.low), high: String(result.high), calibrationStatus: result.calibrationStatus, modelVersion: result.modelVersion, evidence: { samples: { academic: inputs.academic.length, attendance: inputs.attendance.length, syllabus: inputs.syllabus.length }, components: result.components } }).returning();
  return NextResponse.json({ runId: run.id, ...result, samples: { academic: inputs.academic.length, attendance: inputs.attendance.length, syllabus: inputs.syllabus.length } });
}

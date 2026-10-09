import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getForecastInputs } from "@/lib/data/forecast";
import { getDb } from "@/lib/db/client";
import { forecastRuns } from "@/lib/db/frontier-schema";
import { forecastNumericSeries, forecastReadiness, forecastSeries } from "@/lib/forecast/engine";

const targets = ["school_readiness", "academic_performance", "attendance_rate", "intervention_outcome_delta", "operational_load"] as const;
const schema = z.object({ target: z.enum(targets).default("school_readiness"), horizon: z.number().int().min(1).max(12).default(1) });

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "forecast:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid forecast request" }, { status: 400 });
  const inputs = await getForecastInputs(session.tenantId);
  const horizon = parsed.data.horizon;
  let result: { estimate: number; low: number; high: number; calibrationStatus: "empirical" | "baseline"; modelVersion: string; samples: number; [key: string]: unknown };
  let unit = "index";
  if (parsed.data.target === "school_readiness") {
    result = forecastReadiness({ academic: inputs.academic, attendance: inputs.attendance, syllabus: inputs.syllabus, horizon });
  } else if (parsed.data.target === "academic_performance") {
    result = forecastSeries(inputs.academic, horizon); unit = "percent";
  } else if (parsed.data.target === "attendance_rate") {
    result = forecastSeries(inputs.attendance, horizon); unit = "percent";
  } else if (parsed.data.target === "intervention_outcome_delta") {
    result = forecastNumericSeries(inputs.interventionOutcomeDelta, horizon); unit = "metric_delta";
  } else {
    result = forecastNumericSeries(inputs.operationalLoad, horizon, { min: 0 }); unit = "events_per_period";
  }
  const [run] = await getDb().insert(forecastRuns).values({ tenantId: session.tenantId, createdByUserId: session.userId, targetType: parsed.data.target, horizon, estimate: String(result.estimate), low: String(result.low), high: String(result.high), calibrationStatus: result.calibrationStatus, modelVersion: result.modelVersion, evidence: { unit, samples: result.samples, target: parsed.data.target, inputs: { academic: inputs.academic.length, attendance: inputs.attendance.length, syllabus: inputs.syllabus.length, interventionOutcomeDelta: inputs.interventionOutcomeDelta.length, operationalLoad: inputs.operationalLoad.length } } }).returning();
  return NextResponse.json({ runId: run.id, target: parsed.data.target, unit, ...result });
}

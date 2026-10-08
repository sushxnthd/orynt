import { NextRequest, NextResponse } from "next/server";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getAcademicsData } from "@/lib/data/academics";
import { getAttendanceData } from "@/lib/data/attendance";
import { getCommandData } from "@/lib/data/command";
import { getOperationsData } from "@/lib/data/operations";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "reports:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const [command, academics, attendance, operations] = await Promise.all([
    getCommandData(session.tenantId),
    getAcademicsData(session.tenantId),
    getAttendanceData(session.tenantId),
    getOperationsData(session.tenantId),
  ]);
  const body = {
    report: "orynt-executive-review",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    tenantId: session.tenantId,
    generatedForRole: session.role,
    metrics: {
      attendance: command.metrics.attendance,
      actionSignals: command.metrics.actionSignals,
      activeInterventions: command.metrics.activeInterventions,
      assessmentReadiness: command.metrics.assessmentReadiness,
      attendanceExceptions: attendance.exceptions.length,
      openOperationalTasks: operations.metrics.openTasks,
      openIncidents: operations.metrics.openIncidents,
    },
    signals: command.signals.map((signal) => ({ id: signal.id, severity: signal.severity, title: signal.title, explanation: signal.explanation, ruleVersion: signal.ruleVersion, evidence: signal.evidence.map((e) => ({ label: e.label, value: e.value, sourceType: e.sourceType, sourceId: e.sourceId })) })),
    interventions: command.interventions.map((item) => ({ id: item.id, title: item.title, status: item.status, studentCount: item.studentCount, successMetric: item.successMetric, baselineValue: item.baselineValue, outcomeValue: item.outcomeValue })),
    courses: academics.courses,
    classAttendance: attendance.classes,
    operations: { metrics: operations.metrics, tasks: operations.tasks, incidents: operations.incidents },
  };
  return NextResponse.json(body, { headers: { "content-disposition": `attachment; filename="orynt-executive-${new Date().toISOString().slice(0,10)}.json"` } });
}

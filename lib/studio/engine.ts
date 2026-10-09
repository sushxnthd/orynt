import { eq } from "drizzle-orm";
import type { Session } from "@/lib/auth/session";
import { assertCan } from "@/lib/auth/policy";
import { getDb } from "@/lib/db/client";
import { auditEvents, interventions, signals, students, visionEvents } from "@/lib/db/schema";
import { incidents, tasks } from "@/lib/db/extended-schema";

const sources = ["students", "signals", "interventions", "tasks", "incidents", "vision_events"] as const;
type MetricSource = typeof sources[number];
const allowedFilterFields = new Set(["active", "grade", "section", "severity", "status", "eventType", "zone", "category"]);

async function sourceRows(tenantId: string, source: MetricSource) {
  const db = getDb();
  if (source === "students") return db.select().from(students).where(eq(students.tenantId, tenantId)).limit(10000);
  if (source === "signals") return db.select().from(signals).where(eq(signals.tenantId, tenantId)).limit(10000);
  if (source === "interventions") return db.select().from(interventions).where(eq(interventions.tenantId, tenantId)).limit(10000);
  if (source === "tasks") return db.select().from(tasks).where(eq(tasks.tenantId, tenantId)).limit(10000);
  if (source === "incidents") return db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).limit(10000);
  return db.select().from(visionEvents).where(eq(visionEvents.tenantId, tenantId)).limit(10000);
}

export async function evaluateMetric(tenantId: string, definition: Record<string, unknown>) {
  const source = definition.source;
  if (typeof source !== "string" || !sources.includes(source as MetricSource)) throw new Error("unsupported_metric_source");
  if (definition.aggregation !== "count") throw new Error("unsupported_metric_aggregation");
  const rows = await sourceRows(tenantId, source as MetricSource);
  const filter = definition.filter;
  let selected: Record<string, unknown>[] = rows as unknown as Record<string, unknown>[];
  if (filter && typeof filter === "object") {
    const field = (filter as Record<string, unknown>).field;
    const equals = (filter as Record<string, unknown>).equals;
    if (typeof field !== "string" || !allowedFilterFields.has(field)) throw new Error("unsupported_metric_filter");
    selected = selected.filter((row) => row[field] === equals);
  }
  return { value: selected.length, aggregation: "count", source, truncated: rows.length === 10000 };
}

export async function executeWorkflow(session: Session, name: string, definition: Record<string, unknown>) {
  assertCan(session.role, "operations:write");
  if (definition.action !== "create_task") throw new Error("unsupported_workflow_action");
  const title = typeof definition.title === "string" ? definition.title.replaceAll("{{definition.name}}", name).slice(0, 200) : `Studio workflow: ${name}`;
  const description = typeof definition.description === "string" ? definition.description.slice(0, 3000) : `Created by Orynt Studio workflow ${name}`;
  const db = getDb();
  const [task] = await db.insert(tasks).values({ tenantId: session.tenantId, title, description, createdByUserId: session.userId }).returning();
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "studio.workflow_execute", entityType: "task", entityId: task.id, reason: `Executed Studio workflow ${name}`, after: task });
  return { taskId: task.id, title: task.title };
}

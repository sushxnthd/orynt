import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { Session } from "@/lib/auth/session";
import { can } from "@/lib/auth/policy";
import { getDb } from "@/lib/db/client";
import { interventions, signals, students, visionEvents } from "@/lib/db/schema";
import { incidents, tasks } from "@/lib/db/extended-schema";
import type { AipEvidence } from "./types";

export type AipToolName = "signals.list" | "interventions.list" | "vision.list" | "students.search" | "operations.summary";

export async function runAipTool(session: Session, tool: AipToolName, args: Record<string, unknown>) {
  const db = getDb();
  if (tool === "signals.list") {
    if (!can(session.role, "command:read")) throw new Error("permission_denied");
    const rows = await db.select().from(signals).where(eq(signals.tenantId, session.tenantId)).orderBy(desc(signals.generatedAt)).limit(12);
    return rows.map<AipEvidence>((row) => ({ type: "signal", id: row.id, label: `${row.title} · ${row.severity}`, detail: row.explanation }));
  }
  if (tool === "interventions.list") {
    if (!can(session.role, "intervention:read")) throw new Error("permission_denied");
    const rows = await db.select().from(interventions).where(eq(interventions.tenantId, session.tenantId)).orderBy(desc(interventions.createdAt)).limit(12);
    return rows.map<AipEvidence>((row) => ({ type: "intervention", id: row.id, label: `${row.title} · ${row.status}`, detail: row.rationale }));
  }
  if (tool === "vision.list") {
    if (!can(session.role, "vision:read")) throw new Error("permission_denied");
    const rows = await db.select().from(visionEvents).where(eq(visionEvents.tenantId, session.tenantId)).orderBy(desc(visionEvents.occurredAt)).limit(12);
    return rows.map<AipEvidence>((row) => ({ type: "vision_event", id: row.id, label: `${row.eventType} · ${row.zone} · ${row.status}` }));
  }
  if (tool === "students.search") {
    if (!can(session.role, "student:read")) throw new Error("permission_denied");
    const query = String(args.query ?? "").trim();
    if (query.length < 2) return [];
    const terms = query.split(/\s+/).filter(Boolean).slice(0, 4);
    const predicates = terms.flatMap((term) => [ilike(students.firstName, `%${term}%`), ilike(students.lastName, `%${term}%`)]);
    const match = predicates.length ? or(...predicates) : undefined;
    if (!match) return [];
    const rows = await db.select().from(students).where(and(eq(students.tenantId, session.tenantId), match)).limit(10);
    return rows.map<AipEvidence>((row) => ({ type: "student", id: row.id, label: `${row.firstName} ${row.lastName} · ${row.grade}${row.section}` }));
  }
  if (tool === "operations.summary") {
    if (!can(session.role, "operations:read")) throw new Error("permission_denied");
    const [taskRows, incidentRows] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.tenantId, session.tenantId)).orderBy(desc(tasks.createdAt)).limit(12),
      db.select().from(incidents).where(eq(incidents.tenantId, session.tenantId)).orderBy(desc(incidents.occurredAt)).limit(12),
    ]);
    return [
      ...taskRows.map<AipEvidence>((row) => ({ type: "task", id: row.id, label: `${row.title} · ${row.status}` })),
      ...incidentRows.map<AipEvidence>((row) => ({ type: "incident", id: row.id, label: `${row.title} · ${row.status}`, detail: row.summary ?? undefined })),
    ];
  }
  return [];
}

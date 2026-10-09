import { desc, eq } from "drizzle-orm";
import type { Session } from "@/lib/auth/session";
import { can } from "@/lib/auth/policy";
import { getCommandData } from "@/lib/data/command";
import { getDb } from "@/lib/db/client";
import { visionEvents } from "@/lib/db/schema";
import { incidents, tasks } from "@/lib/db/extended-schema";
import type { AipEvidence } from "./types";

export type AipToolName = "signals.list" | "interventions.list" | "vision.list" | "students.search" | "operations.summary";

export async function runAipTool(session: Session, tool: AipToolName, args: Record<string, unknown>) {
  const db = getDb();
  if (tool === "signals.list") {
    if (!can(session.role, "command:read")) throw new Error("permission_denied");
    const data = await getCommandData(session.tenantId, session);
    return data.signals.map<AipEvidence>((row) => ({ type: "signal", id: row.id, label: `${row.title} · ${row.severity}`, detail: row.explanation }));
  }
  if (tool === "interventions.list") {
    if (!can(session.role, "intervention:read")) throw new Error("permission_denied");
    const data = await getCommandData(session.tenantId, session);
    return data.interventions.map<AipEvidence>((row) => ({ type: "intervention", id: row.id, label: `${row.title} · ${row.status}`, detail: row.rationale }));
  }
  if (tool === "vision.list") {
    if (!can(session.role, "vision:read")) throw new Error("permission_denied");
    const rows = await db.select().from(visionEvents).where(eq(visionEvents.tenantId, session.tenantId)).orderBy(desc(visionEvents.occurredAt)).limit(12);
    return rows.map<AipEvidence>((row) => ({ type: "vision_event", id: row.id, label: `${row.eventType} · ${row.zone} · ${row.status}` }));
  }
  if (tool === "students.search") {
    if (!can(session.role, "student:read")) throw new Error("permission_denied");
    const query = String(args.query ?? "").trim().toLowerCase();
    if (query.length < 2) return [];
    const data = await getCommandData(session.tenantId, session);
    return data.students.filter((row) => row.name.toLowerCase().includes(query)).slice(0, 10).map<AipEvidence>((row) => ({ type: "student", id: row.id, label: `${row.name} · ${row.class}`, detail: row.focus }));
  }
  if (tool === "operations.summary") {
    if (!can(session.role, "operations:read")) throw new Error("permission_denied");
    if (["teacher", "counselor", "student", "parent"].includes(session.role)) throw new Error("permission_denied");
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

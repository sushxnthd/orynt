import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { connectorFetch, type ConnectorKind } from "@/lib/connectors/registry";
import { normalizeStudents, type StudentMapping } from "@/lib/connectors/normalize";
import { getDb } from "@/lib/db/client";
import { sourceSystems } from "@/lib/db/extended-schema";
import { connectorSyncs } from "@/lib/db/frontier-schema";
import { students } from "@/lib/db/schema";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "connector:manage"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params; const db = getDb(); const [source] = await db.select().from(sourceSystems).where(and(eq(sourceSystems.id, id), eq(sourceSystems.tenantId, session.tenantId))).limit(1); if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  const config = (source.config ?? {}) as Record<string, unknown>; const secretRef = typeof config.secretRef === "string" ? config.secretRef : undefined; const [sync] = await db.insert(connectorSyncs).values({ tenantId: session.tenantId, sourceSystemId: source.id, entity: "students", status: "running", startedAt: new Date() }).returning();
  try {
    const kind = source.kind as ConnectorKind;
    const result = await connectorFetch({ kind, baseUrl: String(config.baseUrl ?? ""), endpoint: typeof config.endpoint === "string" ? config.endpoint : undefined, token: secretRef ? process.env[secretRef] : undefined }, "students");
    if (!result.ok) throw new Error(`HTTP ${result.status}`);
    const normalized = normalizeStudents(kind, result.body, (config.mapping ?? {}) as StudentMapping);
    let written = 0;
    for (const student of normalized) {
      await db.insert(students).values({ tenantId: session.tenantId, externalId: student.externalId, admissionNumber: student.admissionNumber, firstName: student.firstName, lastName: student.lastName, grade: student.grade, section: student.section, metadata: { sourceSystemId: source.id } }).onConflictDoUpdate({ target: [students.tenantId, students.externalId], set: { admissionNumber: student.admissionNumber, firstName: student.firstName, lastName: student.lastName, grade: student.grade, section: student.section, metadata: { sourceSystemId: source.id }, updatedAt: new Date() } });
      written += 1;
    }
    await db.update(connectorSyncs).set({ status: "completed", rowsRead: normalized.length, rowsWritten: written, completedAt: new Date() }).where(eq(connectorSyncs.id, sync.id));
    await db.update(sourceSystems).set({ health: "healthy", lastAttemptAt: new Date(), lastSuccessfulSyncAt: new Date(), errorMessage: null, updatedAt: new Date() }).where(eq(sourceSystems.id, source.id));
    return NextResponse.json({ syncId: sync.id, rowsRead: normalized.length, rowsWritten: written, contentType: result.contentType });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connector failed"; await db.update(connectorSyncs).set({ status: "failed", error: message, completedAt: new Date() }).where(eq(connectorSyncs.id, sync.id)); await db.update(sourceSystems).set({ health: "error", lastAttemptAt: new Date(), errorMessage: message, updatedAt: new Date() }).where(eq(sourceSystems.id, source.id)); return NextResponse.json({ error: message }, { status: 400 });
  }
}

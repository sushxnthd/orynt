import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { auditEvents, imports } from "@/lib/db/schema";
import { retentionPolicies, sourceSystems } from "@/lib/db/extended-schema";

export async function getPlatformHealth(tenantId: string) {
  const db = getDb();
  const [sources, policies, audit, importRows] = await Promise.all([
    db.select().from(sourceSystems).where(eq(sourceSystems.tenantId, tenantId)),
    db.select().from(retentionPolicies).where(eq(retentionPolicies.tenantId, tenantId)),
    db.select().from(auditEvents).where(eq(auditEvents.tenantId, tenantId)).orderBy(desc(auditEvents.createdAt)).limit(100),
    db.select().from(imports).where(eq(imports.tenantId, tenantId)).orderBy(desc(imports.createdAt)).limit(50),
  ]);
  return {
    sources,
    policies,
    audit,
    imports: importRows,
    metrics: {
      healthySources: sources.filter((s) => s.health === "healthy").length,
      unhealthySources: sources.filter((s) => s.health === "stale" || s.health === "error").length,
      enabledRetentionPolicies: policies.filter((p) => p.enabled).length,
      auditEvents: audit.length,
    },
  };
}

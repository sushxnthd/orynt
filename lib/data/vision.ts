import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { visionEvents } from "@/lib/db/schema";

export async function getVisionData(tenantId: string) {
  const db = getDb();
  const events = await db.select().from(visionEvents).where(eq(visionEvents.tenantId, tenantId)).orderBy(desc(visionEvents.occurredAt)).limit(100);
  return {
    events,
    awaitingReview: events.filter((e) => e.status === "new" || e.status === "reviewing").length,
    confirmed: events.filter((e) => e.status === "confirmed").length,
  };
}

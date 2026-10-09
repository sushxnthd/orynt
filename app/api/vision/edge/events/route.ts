import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { edgeAgents } from "@/lib/db/frontier-schema";
import { visionEvents } from "@/lib/db/schema";

const allowed = ["crowding", "queue_buildup", "after_hours_occupancy", "restricted_zone_entry", "possible_fall", "camera_outage", "camera_tamper", "evacuation_occupancy"] as const;
const safeMetadata = z.object({
  person_count: z.number().int().min(0).max(10000).optional(),
  queue_length: z.number().int().min(0).max(10000).optional(),
  occupancy: z.number().int().min(0).max(10000).optional(),
  basis: z.enum(["bbox_orientation", "person_count", "camera_health", "zone_rule"]).optional(),
  privacy: z.enum(["no-face-recognition", "ephemeral-person-detection"]).optional(),
  identity_tracking: z.literal(false).optional(),
  frame_lag_ms: z.number().min(0).max(600000).optional(),
}).strip().default({});
const schema = z.object({
  cameraExternalId: z.string().min(1).max(120),
  zone: z.string().min(1).max(120),
  eventType: z.enum(allowed),
  confidence: z.number().min(0).max(1).optional(),
  occurredAt: z.string().datetime(),
  metadata: safeMetadata,
});

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-orynt-edge-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hash = createHash("sha256").update(token).digest("hex");
  const db = getDb();
  const [agent] = await db.select().from(edgeAgents).where(eq(edgeAgents.tokenHash, hash)).limit(1);
  if (!agent?.active) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event", details: parsed.error.flatten() }, { status: 400 });
  const [event] = await db.insert(visionEvents).values({
    tenantId: agent.tenantId,
    cameraExternalId: parsed.data.cameraExternalId,
    zone: parsed.data.zone,
    eventType: parsed.data.eventType,
    confidence: parsed.data.confidence == null ? undefined : String(parsed.data.confidence),
    occurredAt: new Date(parsed.data.occurredAt),
    metadata: { ...parsed.data.metadata, edgeAgentId: agent.id },
  }).returning();
  await db.update(edgeAgents).set({ lastSeenAt: new Date(), updatedAt: new Date() }).where(eq(edgeAgents.id, agent.id));
  return NextResponse.json({ id: event.id }, { status: 201 });
}

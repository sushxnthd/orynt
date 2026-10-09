import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { sourceSystems } from "@/lib/db/extended-schema";

const schema = z.object({ name: z.string().min(2).max(120), kind: z.string().min(2).max(80), baseUrl: z.string().url(), endpoint: z.string().max(500).optional(), secretRef: z.string().regex(/^[A-Z][A-Z0-9_]{2,80}$/).optional(), freshnessMinutes: z.number().int().positive().max(10080).default(1440) });
export async function POST(request: NextRequest) { const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { assertCan(session.role, "connector:manage"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); } const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid source" }, { status: 400 }); const db = getDb(); const [row] = await db.insert(sourceSystems).values({ tenantId: session.tenantId, name: parsed.data.name, kind: parsed.data.kind, freshnessMinutes: parsed.data.freshnessMinutes, config: { baseUrl: parsed.data.baseUrl, endpoint: parsed.data.endpoint, secretRef: parsed.data.secretRef } }).onConflictDoUpdate({ target: [sourceSystems.tenantId, sourceSystems.name], set: { kind: parsed.data.kind, freshnessMinutes: parsed.data.freshnessMinutes, config: { baseUrl: parsed.data.baseUrl, endpoint: parsed.data.endpoint, secretRef: parsed.data.secretRef }, updatedAt: new Date() } }).returning(); return NextResponse.json({ source: row }, { status: 201 }); }

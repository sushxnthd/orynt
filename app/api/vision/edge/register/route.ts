import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { edgeAgents } from "@/lib/db/frontier-schema";

const schema = z.object({ name: z.string().min(2).max(120) });
export async function POST(request: NextRequest) { const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { assertCan(session.role, "settings:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); } const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid edge agent" }, { status: 400 }); const token = `orynt_edge_${randomBytes(32).toString("base64url")}`; const tokenHash = createHash("sha256").update(token).digest("hex"); const [agent] = await getDb().insert(edgeAgents).values({ tenantId: session.tenantId, name: parsed.data.name, tokenHash }).returning({ id: edgeAgents.id, name: edgeAgents.name }); return NextResponse.json({ agent, token, warning: "This token is shown once. Store it in the edge host secret store." }, { status: 201 }); }

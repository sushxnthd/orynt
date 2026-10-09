import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { connectorRequest } from "@/lib/connectors/registry";

const schema = z.object({ kind: z.enum(["fedena", "oneroster", "edfi", "generic-rest", "teachmint-assisted", "entab-assisted", "edunext-assisted"]), baseUrl: z.string().url(), token: z.string().max(4000).optional(), endpoint: z.string().max(500).optional(), entity: z.string().max(80).default("students") });
export async function POST(request: NextRequest) { const session = await getRequestSession(request); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { assertCan(session.role, "connector:manage"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); } const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid connector configuration" }, { status: 400 }); try { const result = await connectorRequest(parsed.data, parsed.data.entity); return NextResponse.json(result); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Connector failed" }, { status: 400 }); } }

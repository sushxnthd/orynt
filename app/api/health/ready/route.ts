import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
export async function GET() { try { await getDb().execute(sql`select 1`); return NextResponse.json({ status: "ready" }); } catch { return NextResponse.json({ status: "not_ready" }, { status: 503 }); } }

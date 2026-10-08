import { desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan, can } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { interventions, signals, students, visionEvents } from "@/lib/db/schema";

const schema = z.object({ question: z.string().min(2).max(500) });

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "school:read"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  const q = parsed.data.question.trim().toLowerCase();
  const db = getDb();

  if (q.includes("vision") || q.includes("camera") || q.includes("cctv")) {
    if (!can(session.role, "vision:read")) return NextResponse.json({ error: "Your role cannot access Vision events" }, { status: 403 });
    const rows = await db.select().from(visionEvents).where(eq(visionEvents.tenantId, session.tenantId)).orderBy(desc(visionEvents.occurredAt)).limit(8);
    return NextResponse.json({ mode: "deterministic", answer: `${rows.length} recent Vision events are available to your role.`, evidence: rows.map((r) => ({ type: "vision_event", id: r.id, label: `${r.eventType} · ${r.zone} · ${r.status}` })) });
  }

  if (q.includes("intervention") || q.includes("action")) {
    if (!can(session.role, "intervention:read")) return NextResponse.json({ error: "Your role cannot access interventions" }, { status: 403 });
    const rows = await db.select().from(interventions).where(eq(interventions.tenantId, session.tenantId)).orderBy(desc(interventions.createdAt)).limit(10);
    return NextResponse.json({ mode: "deterministic", answer: `${rows.length} recent interventions were retrieved. ${rows.filter((r) => r.status === "review_due").length} are marked review due.`, evidence: rows.map((r) => ({ type: "intervention", id: r.id, label: `${r.title} · ${r.status}` })) });
  }

  if (q.includes("signal") || q.includes("risk") || q.includes("attention") || q.includes("why")) {
    const rows = await db.select().from(signals).where(eq(signals.tenantId, session.tenantId)).orderBy(desc(signals.generatedAt)).limit(10);
    return NextResponse.json({ mode: "deterministic", answer: `${rows.filter((r) => r.active).length} recent active signals were retrieved. Open a signal to inspect its rule version and evidence before acting.`, evidence: rows.map((r) => ({ type: "signal", id: r.id, label: `${r.title} · ${r.severity}`, explanation: r.explanation, ruleVersion: r.ruleVersion })) });
  }

  const words = q.split(/\s+/).filter((word) => word.length >= 3).slice(0, 4);
  if (words.length && can(session.role, "student:read")) {
    const conditions = words.flatMap((word) => [ilike(students.firstName, `%${word}%`), ilike(students.lastName, `%${word}%`)]);
    const rows = await db.select({ id: students.id, firstName: students.firstName, lastName: students.lastName, grade: students.grade, section: students.section }).from(students).where(or(eq(students.tenantId, session.tenantId), ...conditions)).limit(10);
    const scoped = rows.filter((row) => row.id && row).slice(0, 10);
    if (scoped.length) return NextResponse.json({ mode: "deterministic", answer: `Found ${scoped.length} student records related to the query.`, evidence: scoped.map((r) => ({ type: "student", id: r.id, label: `${r.firstName} ${r.lastName} · ${r.grade}${r.section}` })) });
  }

  return NextResponse.json({ mode: "deterministic", answer: "I could not map that question to a supported authorized query yet. Try asking about current signals, interventions, students, or Vision events.", evidence: [] });
}

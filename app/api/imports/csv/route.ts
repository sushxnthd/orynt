import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { attendance, auditEvents, imports, students } from "@/lib/db/schema";
import { parseCsv, rowsToObjects } from "@/lib/import/csv";

export const runtime = "nodejs";

const studentSchema = z.object({ externalId: z.string().min(1), firstName: z.string().min(1), lastName: z.string().min(1), grade: z.string().min(1), section: z.string().min(1), admissionNumber: z.string().optional() });
const attendanceSchema = z.object({ externalId: z.string().min(1), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["present", "absent", "late", "excused"]) });

type Mapping = Record<string, string>;
function remap(row: Record<string, string>, fields: string[], mapping: Mapping) {
  return Object.fromEntries(fields.map((field) => [field, row[mapping[field] ?? field] ?? ""]));
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "import:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const mode = String(form.get("mode") ?? "preview");
  if (!(file instanceof File) || !["students", "attendance"].includes(kind) || !["preview", "commit"].includes(mode)) return NextResponse.json({ error: "Expected CSV file, supported kind and mode" }, { status: 400 });
  if (file.size > 5_000_000) return NextResponse.json({ error: "File exceeds 5 MB import limit" }, { status: 413 });

  let mapping: Mapping = {};
  try { mapping = JSON.parse(String(form.get("mapping") ?? "{}")); } catch { return NextResponse.json({ error: "mapping must be valid JSON" }, { status: 400 }); }
  const text = await file.text();
  const checksum = createHash("sha256").update(text).digest("hex");
  let objects: Record<string, string>[];
  try { objects = rowsToObjects(parseCsv(text)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "CSV parse failed" }, { status: 400 }); }
  if (!objects.length) return NextResponse.json({ error: "No data rows found" }, { status: 400 });
  if (objects.length > 10_000) return NextResponse.json({ error: "Import is limited to 10,000 rows per file" }, { status: 413 });

  const valid: Record<string, string>[] = [];
  const errors: { row: number; issues: string[] }[] = [];
  for (let i = 0; i < objects.length; i++) {
    const raw = kind === "students"
      ? remap(objects[i], ["externalId", "firstName", "lastName", "grade", "section", "admissionNumber"], mapping)
      : remap(objects[i], ["externalId", "day", "status"], mapping);
    const parsed = kind === "students" ? studentSchema.safeParse(raw) : attendanceSchema.safeParse(raw);
    if (parsed.success) valid.push(parsed.data as Record<string, string>);
    else errors.push({ row: i + 2, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
  }

  if (mode === "preview") return NextResponse.json({ kind, checksum, rows: objects.length, valid: valid.length, errors: errors.slice(0, 100), canCommit: valid.length > 0 && errors.length === 0 });
  if (errors.length) return NextResponse.json({ error: "Import contains invalid rows", errors: errors.slice(0, 100) }, { status: 400 });

  const db = getDb();
  await db.transaction(async (tx) => {
    if (kind === "students") {
      for (const row of valid) {
        await tx.insert(students).values({
          tenantId: session.tenantId, externalId: row.externalId, admissionNumber: row.admissionNumber || undefined,
          firstName: row.firstName, lastName: row.lastName, grade: row.grade, section: row.section,
        }).onConflictDoUpdate({
          target: [students.tenantId, students.externalId],
          set: { admissionNumber: row.admissionNumber || undefined, firstName: row.firstName, lastName: row.lastName, grade: row.grade, section: row.section, updatedAt: new Date() },
        });
      }
    } else {
      const externalIds = [...new Set(valid.map((row) => row.externalId))];
      const matched = await tx.select({ id: students.id, externalId: students.externalId }).from(students).where(and(eq(students.tenantId, session.tenantId), inArray(students.externalId, externalIds)));
      const byExternal = new Map(matched.map((s) => [s.externalId, s.id]));
      const missing = externalIds.filter((id) => !byExternal.has(id));
      if (missing.length) throw new Error(`Unknown student external IDs: ${missing.slice(0, 10).join(", ")}`);
      for (const row of valid) {
        const studentId = byExternal.get(row.externalId)!;
        await tx.insert(attendance).values({ tenantId: session.tenantId, studentId, day: row.day, status: row.status as "present" | "absent" | "late" | "excused", source: `csv:${file.name}` })
          .onConflictDoUpdate({ target: [attendance.studentId, attendance.day], set: { status: row.status as "present" | "absent" | "late" | "excused", source: `csv:${file.name}`, updatedAt: new Date() } });
      }
    }
    const [record] = await tx.insert(imports).values({ tenantId: session.tenantId, kind, filename: file.name, status: "committed", rowCount: valid.length, errorCount: 0, mapping, checksum, createdByUserId: session.userId }).returning();
    await tx.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: "import.commit", entityType: "import", entityId: record.id, reason: `${kind} CSV import`, after: { filename: file.name, checksum, rows: valid.length } });
  });

  return NextResponse.json({ ok: true, kind, checksum, committed: valid.length });
}

import type { ConnectorKind } from "./registry";

export type StudentMapping = {
  externalId?: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  section?: string;
  defaultGrade?: string;
  defaultSection?: string;
};

export type NormalizedStudent = {
  externalId: string;
  admissionNumber?: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
};

function valueAt(record: Record<string, unknown>, path?: string) {
  if (!path) return undefined;
  let value: unknown = record;
  for (const part of path.split(".")) {
    if (!value || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return Array.isArray(value) ? value[0] : value;
}

function text(value: unknown) { return value == null ? "" : String(value).trim(); }

function splitBatch(batch: string) {
  const normalized = batch.trim();
  const match = normalized.match(/(?:grade|class|std)?\s*([0-9]{1,2}|[A-Za-z]+)\s*[-/ ]\s*([A-Za-z0-9]+)$/i);
  return match ? { grade: match[1], section: match[2] } : { grade: normalized, section: "A" };
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function xmlTag(block: string, names: string[]) {
  for (const name of names) {
    const expression = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i");
    const match = block.match(expression);
    if (match) return decodeXml(match[1].replace(/<[^>]+>/g, "").trim());
  }
  return "";
}

function normalizeFedenaXml(body: string, mapping: StudentMapping): NormalizedStudent[] {
  const blocks = [...body.matchAll(/<student(?:\s[^>]*)?>([\s\S]*?)<\/student>/gi)].map((match) => match[1]);
  return blocks.flatMap((block) => {
    const externalId = xmlTag(block, ["id", "student-id", "admission-no", "admission_no"]);
    const firstName = xmlTag(block, ["first-name", "first_name", "firstName"]);
    const lastName = xmlTag(block, ["last-name", "last_name", "lastName"]) || "—";
    const admissionNumber = xmlTag(block, ["admission-no", "admission_no"]);
    const batch = xmlTag(block, ["batch-name", "batch_name", "batch"]);
    const parsed = splitBatch(batch || mapping.defaultGrade || "");
    const grade = mapping.defaultGrade || parsed.grade;
    const section = mapping.defaultSection || parsed.section;
    return externalId && firstName && grade && section ? [{ externalId, admissionNumber: admissionNumber || undefined, firstName, lastName, grade, section }] : [];
  });
}

function extractRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["students", "users", "data", "items", "value"]) {
    if (Array.isArray(object[key])) return (object[key] as unknown[]).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
  }
  return [];
}

export function normalizeStudents(kind: ConnectorKind, body: string, mapping: StudentMapping = {}) {
  if (kind === "fedena" && body.trim().startsWith("<")) return normalizeFedenaXml(body, mapping);
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return []; }
  const records = extractRecords(payload);
  const defaults: StudentMapping = kind === "oneroster" ? { externalId: "sourcedId", firstName: "givenName", lastName: "familyName", grade: "grades.0" } : kind === "edfi" ? { externalId: "studentUniqueId", firstName: "firstName", lastName: "lastSurname" } : {};
  const fields = { ...defaults, ...mapping };
  return records.flatMap((record) => {
    const externalId = text(valueAt(record, fields.externalId));
    const firstName = text(valueAt(record, fields.firstName));
    const lastName = text(valueAt(record, fields.lastName)) || "—";
    const grade = text(valueAt(record, fields.grade)) || fields.defaultGrade || "";
    const section = text(valueAt(record, fields.section)) || fields.defaultSection || "";
    const admissionNumber = text(valueAt(record, fields.admissionNumber));
    return externalId && firstName && grade && section ? [{ externalId, firstName, lastName, grade, section, admissionNumber: admissionNumber || undefined }] : [];
  });
}

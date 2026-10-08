import { describe, expect, it } from "vitest";
import { accessAllows, hasExplicitScope } from "@/lib/auth/scope";

describe("Orynt object scope", () => {
  it("fails closed for teachers and counselors without explicit scope", () => {
    expect(accessAllows({ role: "teacher", scope: {} }, { grade: "12", classId: "c12" })).toBe(false);
    expect(accessAllows({ role: "counselor", scope: {} }, { grade: "12", classId: "c12" })).toBe(false);
  });

  it("keeps school administrators unrestricted when no object scope is configured", () => {
    expect(accessAllows({ role: "principal", scope: {} }, { grade: "12", classId: "c12", subjectId: "chem" })).toBe(true);
  });

  it("requires every configured dimension to match", () => {
    const identity = { role: "teacher" as const, scope: { grades: ["12"], classIds: ["c12"], subjectIds: ["chem"] } };
    expect(accessAllows(identity, { grade: "12", classId: "c12", subjectId: "chem" })).toBe(true);
    expect(accessAllows(identity, { grade: "12", classId: "c12", subjectId: "math" })).toBe(false);
    expect(accessAllows(identity, { grade: "12", classId: "c12" })).toBe(false);
  });

  it("recognizes explicit scope", () => {
    expect(hasExplicitScope({})).toBe(false);
    expect(hasExplicitScope({ classIds: ["c12"] })).toBe(true);
  });
});

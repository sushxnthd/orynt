import { describe, expect, it } from "vitest";
import { can, scopeAllows } from "@/lib/auth/policy";

describe("Orynt policy", () => {
  it("does not allow a teacher to review Vision incidents", () => {
    expect(can("teacher", "vision:review")).toBe(false);
  });

  it("allows a principal to review Vision incidents", () => {
    expect(can("principal", "vision:review")).toBe(true);
  });

  it("enforces grade scope", () => {
    expect(scopeAllows({ grades: ["9", "10"] }, { grade: "10" })).toBe(true);
    expect(scopeAllows({ grades: ["9", "10"] }, { grade: "12" })).toBe(false);
  });

  it("keeps parent permissions narrow", () => {
    expect(can("parent", "student:read")).toBe(true);
    expect(can("parent", "student:sensitive-read")).toBe(false);
    expect(can("parent", "assessment:write")).toBe(false);
  });
});

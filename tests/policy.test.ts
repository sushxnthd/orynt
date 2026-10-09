import { describe, expect, it } from "vitest";
import { can, scopeAllows } from "@/lib/auth/policy";

describe("Orynt policy", () => {
  it("does not allow a teacher to review Vision incidents", () => {
    expect(can("teacher", "vision:review")).toBe(false);
  });

  it("allows a principal to review Vision incidents", () => {
    expect(can("principal", "vision:review")).toBe(true);
  });

  it("separates command-center access from generic school metadata", () => {
    expect(can("principal", "command:read")).toBe(true);
    expect(can("teacher", "command:read")).toBe(false);
    expect(can("parent", "command:read")).toBe(false);
  });

  it("grants operational writes only to authorized staff roles", () => {
    expect(can("principal", "operations:write")).toBe(true);
    expect(can("coordinator", "operations:write")).toBe(true);
    expect(can("it_admin", "operations:write")).toBe(true);
    expect(can("teacher", "operations:write")).toBe(false);
    expect(can("parent", "operations:write")).toBe(false);
    expect(can("student", "operations:write")).toBe(false);
  });

  it("allows scoped teaching roles to record curriculum and meeting progress", () => {
    expect(can("teacher", "academics:write")).toBe(true);
    expect(can("teacher", "meeting:write")).toBe(true);
    expect(can("coordinator", "academics:write")).toBe(true);
    expect(can("principal", "meeting:write")).toBe(true);
  });

  it("enforces grade scope", () => {
    expect(scopeAllows({ grades: ["9", "10"] }, { grade: "10" })).toBe(true);
    expect(scopeAllows({ grades: ["9", "10"] }, { grade: "12" })).toBe(false);
  });

  it("does not grant broad student records to parent/student roles before relationship scoping exists", () => {
    expect(can("parent", "student:read")).toBe(false);
    expect(can("parent", "student:sensitive-read")).toBe(false);
    expect(can("parent", "intervention:read")).toBe(false);
    expect(can("student", "student:read")).toBe(false);
  });
});

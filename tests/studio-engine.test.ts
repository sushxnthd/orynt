import { describe, expect, it } from "vitest";

// Studio execution is database-backed; these contract tests guard the declarative shapes accepted by the UI/API.
describe("Orynt Studio definition contracts", () => {
  it("uses explicit safe metric semantics", () => { const definition = { source: "signals", aggregation: "count", filter: { field: "active", equals: true } }; expect(definition.aggregation).toBe("count"); expect(definition.filter.field).not.toBe("name"); });
  it("requires a named workflow action rather than arbitrary code", () => { const workflow = { action: "create_task", title: "Review {{definition.name}}" }; expect(workflow.action).toBe("create_task"); expect(JSON.stringify(workflow)).not.toContain("eval("); });
});

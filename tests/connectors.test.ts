import { describe, expect, it } from "vitest";
import { safeConnectorUrl } from "@/lib/connectors/registry";

describe("Orynt connector URL policy", () => {
  it("rejects plaintext and obvious private-network targets", () => {
    expect(() => safeConnectorUrl("http://school.example")).toThrow();
    expect(() => safeConnectorUrl("https://localhost")).toThrow();
    expect(() => safeConnectorUrl("https://192.168.1.10")).toThrow();
  });
  it("accepts external HTTPS endpoints", () => {
    expect(safeConnectorUrl("https://school.example", "/api/students")).toBe("https://school.example/api/students");
  });
});

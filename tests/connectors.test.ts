import { describe, expect, it } from "vitest";
import { isPrivateAddress, safeConnectorUrl } from "@/lib/connectors/registry";

describe("Orynt connector URL policy", () => {
  it("rejects plaintext and obvious private-network targets", () => {
    expect(() => safeConnectorUrl("http://school.example")).toThrow();
    expect(() => safeConnectorUrl("https://localhost")).toThrow();
    expect(() => safeConnectorUrl("https://192.168.1.10")).toThrow();
  });
  it("recognizes private, loopback and link-local resolved addresses", () => {
    expect(isPrivateAddress("10.0.0.3")).toBe(true);
    expect(isPrivateAddress("172.20.1.2")).toBe(true);
    expect(isPrivateAddress("169.254.10.2")).toBe(true);
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("fd00::1")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
  });
  it("accepts syntactically external HTTPS endpoints before DNS verification", () => {
    expect(safeConnectorUrl("https://school.example", "/api/students")).toBe("https://school.example/api/students");
  });
});

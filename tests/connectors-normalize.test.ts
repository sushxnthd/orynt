import { describe, expect, it } from "vitest";
import { normalizeStudents } from "@/lib/connectors/normalize";

describe("connector normalization", () => {
  it("normalizes OneRoster-style users with configured section", () => { const body = JSON.stringify({ users: [{ sourcedId: "u1", givenName: "Aarav", familyName: "Mehta", grades: ["12"] }] }); expect(normalizeStudents("oneroster", body, { defaultSection: "C" })[0]).toMatchObject({ externalId: "u1", firstName: "Aarav", grade: "12", section: "C" }); });
  it("normalizes Fedena XML student search payloads", () => { const xml = "<students><student><id>7</id><admission-no>A7</admission-no><first-name>Riya</first-name><last-name>Shah</last-name><batch-name>10-A</batch-name></student></students>"; expect(normalizeStudents("fedena", xml)[0]).toMatchObject({ externalId: "7", admissionNumber: "A7", firstName: "Riya", grade: "10", section: "A" }); });
});

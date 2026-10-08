import { describe, expect, it } from "vitest";
import { deriveStudentSignals } from "@/lib/domain/signal-engine";

describe("deriveStudentSignals", () => {
  it("returns no signal for a stable student", () => {
    expect(deriveStudentSignals({ studentId: "s1", attendance28d: 96, attendancePrevious28d: 95, assessmentMean30d: 82, assessmentPrevious30d: 80 })).toHaveLength(0);
  });

  it("creates evidence-backed attendance and academic signals", () => {
    const signals = deriveStudentSignals({ studentId: "s2", attendance28d: 80, attendancePrevious28d: 94, assessmentMean30d: 61, assessmentPrevious30d: 80, completionRate30d: 62, completionPrevious30d: 84 });
    expect(signals.map((s) => s.type)).toEqual(["attendance_deterioration", "academic_drop", "combined_risk"]);
    expect(signals[0].ruleVersion).toBe("attendance-v2.1");
    expect(signals[0].evidence.length).toBeGreaterThan(0);
    expect(signals[2].explanation).toContain("human review");
  });

  it("does not invent an academic decline when comparable assessment history is missing", () => {
    const signals = deriveStudentSignals({ studentId: "s3", attendance28d: 96, attendancePrevious28d: 96, assessmentMean30d: 55, assessmentPrevious30d: null });
    expect(signals.some((s) => s.type === "academic_drop")).toBe(false);
  });
});

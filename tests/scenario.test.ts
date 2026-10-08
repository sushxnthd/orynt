import { describe, expect, it } from "vitest";
import { readinessIndex, simulateScenario } from "@/lib/domain/scenario";

describe("Orynt scenario engine", () => {
  it("keeps readiness within 0..100", () => {
    expect(readinessIndex({ academicAverage: 100, attendancePercent: 100, syllabusPercent: 100 })).toBe(100);
    expect(readinessIndex({ academicAverage: 0, attendancePercent: 0, syllabusPercent: 0 })).toBe(0);
  });

  it("shows a positive but diminishing remediation effect", () => {
    const base = { academicAverage: 60, attendancePercent: 90, syllabusPercent: 70, attendanceDeltaPp: 0, syllabusDeltaPp: 0 };
    const one = simulateScenario({ ...base, remediationSessions: 1 });
    const four = simulateScenario({ ...base, remediationSessions: 4 });
    expect(four.estimate).toBeGreaterThan(one.estimate);
    expect(four.assumptions.remediationAcademicEffectPp).toBeLessThan(4 * one.assumptions.remediationAcademicEffectPp);
  });

  it("returns explicit uncertainty bounds and model identity", () => {
    const result = simulateScenario({ academicAverage: 72, attendancePercent: 92, syllabusPercent: 80, remediationSessions: 2, attendanceDeltaPp: 3, syllabusDeltaPp: 5 });
    expect(result.low).toBeLessThan(result.estimate);
    expect(result.high).toBeGreaterThan(result.estimate);
    expect(result.assumptions.model).toBe("transparent-heuristic-v1");
  });
});

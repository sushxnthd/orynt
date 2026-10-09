import { describe, expect, it } from "vitest";
import { forecastNumericSeries, forecastReadiness, forecastSeries } from "@/lib/forecast/engine";

describe("Orynt Forecast", () => {
  it("uses conservative baseline intervals on short histories", () => { const result = forecastSeries([70, 72, 74], 1); expect(result.calibrationStatus).toBe("baseline"); expect(result.low).toBeLessThan(result.estimate); expect(result.high).toBeGreaterThan(result.estimate); });
  it("marks sufficiently long residual histories empirical", () => { const result = forecastSeries([60, 61, 63, 64, 65, 67, 68, 70, 71, 72], 1); expect(result.calibrationStatus).toBe("empirical"); expect(result.samples).toBe(10); });
  it("keeps readiness forecasts bounded", () => { const result = forecastReadiness({ academic: [95, 97, 99], attendance: [99, 100, 100], syllabus: [90, 95, 100] }); expect(result.estimate).toBeLessThanOrEqual(100); expect(result.high).toBeLessThanOrEqual(100); });
  it("supports non-percentage operational series without negative load", () => { const result = forecastNumericSeries([2, 3, 3, 5, 4], 1, { min: 0 }); expect(result.low).toBeGreaterThanOrEqual(0); expect(result.samples).toBe(5); });
});

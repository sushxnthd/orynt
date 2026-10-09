export type SeriesForecast = {
  estimate: number;
  low: number;
  high: number;
  slope: number;
  calibrationStatus: "empirical" | "baseline";
  samples: number;
  modelVersion: "trend-conformal-v1";
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;

function quantile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const base = Math.floor(position);
  const rest = position - base;
  return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function regression(values: number[]) {
  const n = values.length;
  if (n < 2) return { intercept: values[0] ?? 0, slope: 0 };
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) ** 2;
  }
  const slope = denominator ? numerator / denominator : 0;
  return { intercept: meanY - slope * meanX, slope };
}

export function forecastSeries(values: number[], horizon = 1): SeriesForecast {
  const clean = values.filter(Number.isFinite).map((value) => clamp(value));
  if (!clean.length) return { estimate: 0, low: 0, high: 0, slope: 0, calibrationStatus: "baseline", samples: 0, modelVersion: "trend-conformal-v1" };
  const model = regression(clean);
  const x = clean.length - 1 + Math.max(1, horizon);
  const estimate = clamp(model.intercept + model.slope * x);
  const residuals = clean.map((value, index) => Math.abs(value - (model.intercept + model.slope * index)));
  const empirical = clean.length >= 8;
  const radius = empirical ? Math.max(1.5, quantile(residuals, 0.9)) : Math.max(4, quantile(residuals, 0.9) + 3);
  return {
    estimate: round(estimate),
    low: round(clamp(estimate - radius)),
    high: round(clamp(estimate + radius)),
    slope: round(model.slope),
    calibrationStatus: empirical ? "empirical" : "baseline",
    samples: clean.length,
    modelVersion: "trend-conformal-v1",
  };
}

export function forecastReadiness(input: { academic: number[]; attendance: number[]; syllabus: number[]; horizon?: number }) {
  const horizon = input.horizon ?? 1;
  const academic = forecastSeries(input.academic, horizon);
  const attendance = forecastSeries(input.attendance, horizon);
  const syllabus = forecastSeries(input.syllabus, horizon);
  const estimate = academic.estimate * 0.5 + attendance.estimate * 0.2 + syllabus.estimate * 0.3;
  const low = academic.low * 0.5 + attendance.low * 0.2 + syllabus.low * 0.3;
  const high = academic.high * 0.5 + attendance.high * 0.2 + syllabus.high * 0.3;
  return {
    estimate: round(estimate), low: round(low), high: round(high),
    calibrationStatus: [academic, attendance, syllabus].every((part) => part.calibrationStatus === "empirical") ? "empirical" as const : "baseline" as const,
    modelVersion: "readiness-ensemble-v1",
    components: { academic, attendance, syllabus },
  };
}

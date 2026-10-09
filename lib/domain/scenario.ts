export type ReadinessInputs = {
  academicAverage: number;
  attendancePercent: number;
  syllabusPercent: number;
};

export type ScenarioInputs = ReadinessInputs & {
  remediationSessions: number;
  attendanceDeltaPp: number;
  syllabusDeltaPp: number;
};

const clamp100 = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

export function readinessIndex(input: ReadinessInputs) {
  return clamp100(input.academicAverage * 0.5 + input.attendancePercent * 0.2 + input.syllabusPercent * 0.3);
}

function pseudoNoise(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function simulateScenario(input: ScenarioInputs) {
  const baseline = readinessIndex(input);
  const sessions = Math.max(0, Math.min(12, input.remediationSessions));
  const remediationAcademicEffect = 1.6 * Math.sqrt(sessions);
  const attendanceEffect = Math.max(-20, Math.min(20, input.attendanceDeltaPp));
  const syllabusEffect = Math.max(-30, Math.min(30, input.syllabusDeltaPp));
  const projectedAcademic = clamp100(input.academicAverage + remediationAcademicEffect + attendanceEffect * 0.15);
  const projectedAttendance = clamp100(input.attendancePercent + attendanceEffect);
  const projectedSyllabus = clamp100(input.syllabusPercent + syllabusEffect);
  const deterministic = readinessIndex({ academicAverage: projectedAcademic, attendancePercent: projectedAttendance, syllabusPercent: projectedSyllabus });
  const uncertainty = 3.5 + sessions * 0.25 + Math.abs(attendanceEffect) * 0.06 + Math.abs(syllabusEffect) * 0.03;
  const samples = Array.from({ length: 301 }, (_, index) => clamp100(deterministic + pseudoNoise(index + sessions * 17) * uncertainty));
  samples.sort((a, b) => a - b);
  const q = (p: number) => samples[Math.floor((samples.length - 1) * p)];
  return {
    baseline: round(baseline),
    estimate: round(q(0.5)),
    low: round(q(0.1)),
    high: round(q(0.9)),
    distribution: { p10: round(q(0.1)), p50: round(q(0.5)), p90: round(q(0.9)), samples: samples.length },
    contributions: {
      remediation: round(remediationAcademicEffect * 0.5),
      attendance: round(attendanceEffect * 0.2 + attendanceEffect * 0.15 * 0.5),
      syllabus: round(syllabusEffect * 0.3),
    },
    assumptions: {
      remediationAcademicEffectPp: round(remediationAcademicEffect),
      attendanceDeltaPp: attendanceEffect,
      syllabusDeltaPp: syllabusEffect,
      model: "transparent-monte-carlo-v2",
    },
  };
}

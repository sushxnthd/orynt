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

export function readinessIndex(input: ReadinessInputs) {
  return clamp100(input.academicAverage * 0.5 + input.attendancePercent * 0.2 + input.syllabusPercent * 0.3);
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
  const estimate = readinessIndex({ academicAverage: projectedAcademic, attendancePercent: projectedAttendance, syllabusPercent: projectedSyllabus });
  const uncertainty = 3.5 + sessions * 0.25 + Math.abs(attendanceEffect) * 0.06 + Math.abs(syllabusEffect) * 0.03;
  return {
    baseline: Math.round(baseline * 10) / 10,
    estimate: Math.round(estimate * 10) / 10,
    low: Math.round(clamp100(estimate - uncertainty) * 10) / 10,
    high: Math.round(clamp100(estimate + uncertainty) * 10) / 10,
    assumptions: {
      remediationAcademicEffectPp: Math.round(remediationAcademicEffect * 10) / 10,
      attendanceDeltaPp: attendanceEffect,
      syllabusDeltaPp: syllabusEffect,
      model: "transparent-heuristic-v1",
    },
  };
}

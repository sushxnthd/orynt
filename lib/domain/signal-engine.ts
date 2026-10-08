export type Evidence = { label: string; value: string; sourceType: string; sourceId: string };
export type DerivedSignal = {
  type: "attendance_deterioration" | "academic_drop" | "combined_risk";
  severity: "watch" | "action" | "critical";
  title: string;
  explanation: string;
  score: number;
  confidence: number;
  ruleVersion: string;
  evidence: Evidence[];
};

export type StudentSnapshot = {
  studentId: string;
  attendance28d: number;
  attendancePrevious28d: number;
  assessmentMean30d: number | null;
  assessmentPrevious30d: number | null;
  completionRate30d?: number | null;
  completionPrevious30d?: number | null;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const pp = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;

export function deriveStudentSignals(snapshot: StudentSnapshot): DerivedSignal[] {
  const signals: DerivedSignal[] = [];
  const attendanceDelta = snapshot.attendance28d - snapshot.attendancePrevious28d;
  const academicDelta = snapshot.assessmentMean30d !== null && snapshot.assessmentPrevious30d !== null
    ? snapshot.assessmentMean30d - snapshot.assessmentPrevious30d
    : null;
  const completionDelta = snapshot.completionRate30d != null && snapshot.completionPrevious30d != null
    ? snapshot.completionRate30d - snapshot.completionPrevious30d
    : null;

  if (snapshot.attendance28d < 90 || attendanceDelta <= -6) {
    const severity = snapshot.attendance28d < 82 || attendanceDelta <= -12 ? "critical" : snapshot.attendance28d < 88 || attendanceDelta <= -8 ? "action" : "watch";
    const magnitude = Math.max((90 - snapshot.attendance28d) / 20, Math.abs(Math.min(attendanceDelta, 0)) / 20);
    signals.push({
      type: "attendance_deterioration",
      severity,
      title: "Attendance deterioration",
      explanation: `Rolling attendance is ${snapshot.attendance28d.toFixed(1)}%, a ${pp(attendanceDelta)} change versus the previous 28-day window.`,
      score: clamp(magnitude),
      confidence: 0.97,
      ruleVersion: "attendance-v2.1",
      evidence: [
        { label: "Rolling attendance", value: `${snapshot.attendance28d.toFixed(1)}%`, sourceType: "attendance", sourceId: snapshot.studentId },
        { label: "Previous window", value: `${snapshot.attendancePrevious28d.toFixed(1)}%`, sourceType: "attendance", sourceId: snapshot.studentId },
      ],
    });
  }

  if (academicDelta !== null && academicDelta <= -8) {
    const severity = academicDelta <= -18 ? "critical" : academicDelta <= -12 ? "action" : "watch";
    signals.push({
      type: "academic_drop",
      severity,
      title: "Academic performance decline",
      explanation: `Recent assessment mean changed by ${pp(academicDelta)} versus the previous comparable window.`,
      score: clamp(Math.abs(academicDelta) / 30),
      confidence: 0.9,
      ruleVersion: "academic-window-v1.0",
      evidence: [
        { label: "Recent assessment mean", value: `${snapshot.assessmentMean30d?.toFixed(1)}%`, sourceType: "assessment", sourceId: snapshot.studentId },
        { label: "Previous assessment mean", value: `${snapshot.assessmentPrevious30d?.toFixed(1)}%`, sourceType: "assessment", sourceId: snapshot.studentId },
      ],
    });
  }

  if (attendanceDelta <= -6 && academicDelta !== null && academicDelta <= -8 && (completionDelta == null || completionDelta <= -5)) {
    signals.push({
      type: "combined_risk",
      severity: attendanceDelta <= -12 && academicDelta <= -15 ? "critical" : "action",
      title: "Multi-signal deterioration",
      explanation: "Attendance and academic performance deteriorated concurrently. This is an escalation cue for human review, not a diagnosis or automated decision.",
      score: clamp((Math.abs(attendanceDelta) + Math.abs(academicDelta)) / 45),
      confidence: completionDelta == null ? 0.82 : 0.9,
      ruleVersion: "combined-v1.0",
      evidence: [
        { label: "Attendance change", value: pp(attendanceDelta), sourceType: "attendance", sourceId: snapshot.studentId },
        { label: "Academic change", value: pp(academicDelta), sourceType: "assessment", sourceId: snapshot.studentId },
        ...(completionDelta == null ? [] : [{ label: "Completion change", value: pp(completionDelta), sourceType: "assignment", sourceId: snapshot.studentId }]),
      ],
    });
  }

  return signals;
}

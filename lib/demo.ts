export const demoSchool = {
  name: "Orynt Academy",
  term: "Term 1 · 2026-27",
  metrics: [
    { label: "Attendance today", value: "93.8%", delta: "-1.7 pp", tone: "warn" as const },
    { label: "Students needing action", value: "27", delta: "+6 this week", tone: "bad" as const },
    { label: "Active interventions", value: "41", delta: "31 on track", tone: "good" as const },
    { label: "Assessment readiness", value: "78%", delta: "+4 pp", tone: "good" as const },
  ],
};

export const demoSignals = [
  {
    id: "sig-chem-12c",
    severity: "action" as const,
    title: "12C Chemistry performance decline",
    explanation: "Electrochemistry mastery is 18 pp below the cohort's prior-unit baseline. 8 of 11 affected students missed prerequisite instruction.",
    evidence: ["Electrochemistry median: 58%", "Prior-unit median: 76%", "8/11 affected students had ≥2 prerequisite absences"],
    owner: "Academic Coordinator",
  },
  {
    id: "sig-att-10b",
    severity: "critical" as const,
    title: "Attendance deterioration in 10B",
    explanation: "Seven students crossed the configured 10-day rolling absence threshold; four also show declining assessment completion.",
    evidence: ["7 threshold crossings", "4 students with paired completion decline", "Signal rule: attendance-v2.1"],
    owner: "Grade 10 Coordinator",
  },
  {
    id: "sig-math-9a",
    severity: "watch" as const,
    title: "9A algebra misconception cluster",
    explanation: "Error patterns are concentrated in factorisation rather than generalized low performance.",
    evidence: ["14 students share misconception code ALG-FAC-03", "Other algebra concepts within expected range"],
    owner: "Mathematics HOD",
  },
];

export const demoStudents = [
  { id: "stu-aarav", name: "Aarav Mehta", class: "12C", attendance: 91.2, average: 74.1, trend: -8.4, risk: "action", focus: "Electrochemistry" },
  { id: "stu-isha", name: "Isha Rao", class: "12C", attendance: 96.7, average: 86.4, trend: 2.8, risk: "stable", focus: "Organic chemistry" },
  { id: "stu-kabir", name: "Kabir Singh", class: "10B", attendance: 82.1, average: 68.9, trend: -5.2, risk: "critical", focus: "Attendance + completion" },
  { id: "stu-meera", name: "Meera Nair", class: "9A", attendance: 94.3, average: 79.5, trend: -2.1, risk: "watch", focus: "Factorisation" },
];

export const demoInterventions = [
  { id: "int-1", title: "12C electrochemistry prerequisite recovery", owner: "R. Sharma", students: 11, status: "active", review: "12 Oct", outcome: "Pending" },
  { id: "int-2", title: "10B attendance recovery plan", owner: "A. Kapoor", students: 7, status: "review_due", review: "Today", outcome: "+3.2 pp attendance" },
  { id: "int-3", title: "9A factorisation small-group reteach", owner: "N. Iyer", students: 14, status: "active", review: "15 Oct", outcome: "Pending" },
];

export const demoVisionEvents = [
  { id: "vis-1", type: "Crowding", zone: "North stairwell", confidence: 0.94, time: "08:03", status: "new" },
  { id: "vis-2", type: "Camera offline", zone: "Lab corridor", confidence: 1, time: "07:51", status: "reviewing" },
  { id: "vis-3", type: "After-hours occupancy", zone: "Library", confidence: 0.88, time: "Yesterday · 18:42", status: "confirmed" },
];

import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { attendance, students } from "@/lib/db/schema";

export async function getAttendanceData(tenantId: string) {
  const db = getDb();
  const [studentRows, attendanceRows] = await Promise.all([
    db.select().from(students).where(eq(students.tenantId, tenantId)),
    db.select().from(attendance).where(eq(attendance.tenantId, tenantId)),
  ]);
  const latestDay = attendanceRows.map((row) => row.day).sort().at(-1) ?? null;
  const byStudent = new Map<string, typeof attendanceRows>();
  for (const row of attendanceRows) byStudent.set(row.studentId, [...(byStudent.get(row.studentId) ?? []), row]);

  const studentViews = studentRows.map((student) => {
    const rows = byStudent.get(student.id) ?? [];
    const attended = rows.filter((row) => row.status === "present" || row.status === "late").length;
    const percent = rows.length ? Math.round((attended / rows.length) * 1000) / 10 : null;
    const absences = rows.filter((row) => row.status === "absent").length;
    const latest = latestDay ? rows.find((row) => row.day === latestDay)?.status ?? "unrecorded" : "unrecorded";
    return { id: student.id, name: `${student.firstName} ${student.lastName}`, className: `${student.grade}${student.section}`, percent, absences, latest };
  });

  const classGroups = new Map<string, typeof studentViews>();
  for (const row of studentViews) classGroups.set(row.className, [...(classGroups.get(row.className) ?? []), row]);
  const classes = [...classGroups.entries()].map(([className, rows]) => {
    const measured = rows.filter((row) => row.percent !== null);
    return {
      className,
      students: rows.length,
      attendance: measured.length ? Math.round((measured.reduce((sum, row) => sum + (row.percent ?? 0), 0) / measured.length) * 10) / 10 : null,
      below90: rows.filter((row) => row.percent !== null && row.percent < 90).length,
    };
  }).sort((a, b) => a.className.localeCompare(b.className));

  const latestRows = latestDay ? attendanceRows.filter((row) => row.day === latestDay) : [];
  return {
    latestDay,
    latestSummary: {
      present: latestRows.filter((row) => row.status === "present").length,
      late: latestRows.filter((row) => row.status === "late").length,
      absent: latestRows.filter((row) => row.status === "absent").length,
      excused: latestRows.filter((row) => row.status === "excused").length,
      total: latestRows.length,
    },
    classes,
    students: studentViews.sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101)),
    exceptions: studentViews.filter((row) => row.percent !== null && row.percent < 90),
  };
}

import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { classes, courseOfferings, staff, subjects } from "@/lib/db/schema";
import { classMeetings, incidents, rooms, tasks, timetableSlots } from "@/lib/db/extended-schema";

export async function getOperationsData(tenantId: string) {
  const db = getDb();
  const [classRows, courseRows, staffRows, subjectRows, roomRows, slotRows, meetingRows, taskRows, incidentRows] = await Promise.all([
    db.select().from(classes).where(eq(classes.tenantId, tenantId)),
    db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, tenantId)),
    db.select().from(staff).where(eq(staff.tenantId, tenantId)),
    db.select().from(subjects).where(eq(subjects.tenantId, tenantId)),
    db.select().from(rooms).where(eq(rooms.tenantId, tenantId)),
    db.select().from(timetableSlots).where(eq(timetableSlots.tenantId, tenantId)),
    db.select().from(classMeetings).where(eq(classMeetings.tenantId, tenantId)),
    db.select().from(tasks).where(eq(tasks.tenantId, tenantId)),
    db.select().from(incidents).where(eq(incidents.tenantId, tenantId)),
  ]);
  const classById = new Map(classRows.map((row) => [row.id, row]));
  const courseById = new Map(courseRows.map((row) => [row.id, row]));
  const staffById = new Map(staffRows.map((row) => [row.id, row]));
  const subjectById = new Map(subjectRows.map((row) => [row.id, row]));
  const roomById = new Map(roomRows.map((row) => [row.id, row]));
  const slotById = new Map(slotRows.map((row) => [row.id, row]));

  const schedule = slotRows.map((slot) => {
    const course = courseById.get(slot.courseOfferingId);
    const cls = classById.get(slot.classId);
    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      period: slot.period,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      className: cls ? `${cls.grade}${cls.section}` : "Unknown",
      subject: course ? subjectById.get(course.subjectId)?.name ?? "Unknown" : "Unknown",
      teacher: course?.teacherStaffId ? staffById.get(course.teacherStaffId)?.name ?? "Unassigned" : "Unassigned",
      room: slot.roomId ? roomById.get(slot.roomId)?.name ?? "Unassigned" : "Unassigned",
    };
  }).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);

  const meetings = meetingRows.map((meeting) => {
    const course = courseById.get(meeting.courseOfferingId);
    const slot = meeting.timetableSlotId ? slotById.get(meeting.timetableSlotId) : undefined;
    const cls = slot ? classById.get(slot.classId) : undefined;
    return {
      ...meeting,
      className: cls ? `${cls.grade}${cls.section}` : "Unknown",
      subject: course ? subjectById.get(course.subjectId)?.name ?? "Unknown" : "Unknown",
      teacher: meeting.teacherStaffId ? staffById.get(meeting.teacherStaffId)?.name ?? "Unassigned" : "Unassigned",
      substitute: meeting.substituteStaffId ? staffById.get(meeting.substituteStaffId)?.name ?? null : null,
    };
  });

  return {
    rooms: roomRows,
    schedule,
    meetings,
    tasks: taskRows.sort((a, b) => (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)),
    incidents: incidentRows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()),
    metrics: {
      activeRooms: roomRows.filter((r) => r.active).length,
      substitutions: meetingRows.filter((m) => m.status === "substituted").length,
      openTasks: taskRows.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "blocked").length,
      openIncidents: incidentRows.filter((i) => i.status === "open" || i.status === "investigating").length,
    },
  };
}

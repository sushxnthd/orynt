import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertCan } from "@/lib/auth/policy";
import { getAuthorizedCourse } from "@/lib/auth/domain-access";
import { getRequestSession } from "@/lib/auth/request";
import { getDb } from "@/lib/db/client";
import { auditEvents, staff } from "@/lib/db/schema";
import { classMeetings, timetableSlots } from "@/lib/db/extended-schema";

const schema = z.object({
  id: z.string().uuid().optional(),
  courseOfferingId: z.string().uuid(),
  timetableSlotId: z.string().uuid().optional(),
  scheduledOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["planned", "completed", "cancelled", "substituted"]),
  substituteStaffId: z.string().uuid().optional(),
  coverageNote: z.string().max(3000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { assertCan(session.role, "meeting:write"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid class meeting", details: parsed.error.flatten() }, { status: 400 });
  const courseAccess = await getAuthorizedCourse(session.tenantId, parsed.data.courseOfferingId, session);
  if (!courseAccess) return NextResponse.json({ error: "Course is outside your authorized scope" }, { status: 403 });
  const db = getDb();

  if (parsed.data.timetableSlotId) {
    const [slot] = await db.select().from(timetableSlots).where(and(eq(timetableSlots.id, parsed.data.timetableSlotId), eq(timetableSlots.tenantId, session.tenantId))).limit(1);
    if (!slot || slot.courseOfferingId !== parsed.data.courseOfferingId) return NextResponse.json({ error: "Timetable slot does not match the authorized course" }, { status: 400 });
  }
  if (parsed.data.substituteStaffId) {
    if (session.role === "teacher") return NextResponse.json({ error: "Teachers cannot assign substitute staff" }, { status: 403 });
    const [substitute] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, parsed.data.substituteStaffId), eq(staff.tenantId, session.tenantId))).limit(1);
    if (!substitute) return NextResponse.json({ error: "Substitute staff member not found" }, { status: 400 });
  }

  const teacherStaff = await db.select().from(staff).where(and(eq(staff.tenantId, session.tenantId), eq(staff.userId, session.userId))).limit(1);
  let before: typeof classMeetings.$inferSelect | null = null;
  let meeting: typeof classMeetings.$inferSelect;
  if (parsed.data.id) {
    [before] = await db.select().from(classMeetings).where(and(eq(classMeetings.id, parsed.data.id), eq(classMeetings.tenantId, session.tenantId))).limit(1);
    if (!before || before.courseOfferingId !== parsed.data.courseOfferingId) return NextResponse.json({ error: "Meeting not found in authorized course" }, { status: 404 });
    [meeting] = await db.update(classMeetings).set({
      timetableSlotId: parsed.data.timetableSlotId,
      scheduledOn: parsed.data.scheduledOn,
      status: parsed.data.status,
      substituteStaffId: parsed.data.substituteStaffId,
      coverageNote: parsed.data.coverageNote,
      updatedAt: new Date(),
    }).where(and(eq(classMeetings.id, parsed.data.id), eq(classMeetings.tenantId, session.tenantId))).returning();
  } else {
    [meeting] = await db.insert(classMeetings).values({
      tenantId: session.tenantId,
      timetableSlotId: parsed.data.timetableSlotId,
      courseOfferingId: parsed.data.courseOfferingId,
      scheduledOn: parsed.data.scheduledOn,
      teacherStaffId: teacherStaff[0]?.id ?? courseAccess.course.teacherStaffId,
      status: parsed.data.status,
      substituteStaffId: parsed.data.substituteStaffId,
      coverageNote: parsed.data.coverageNote,
    }).returning();
  }
  await db.insert(auditEvents).values({ tenantId: session.tenantId, actorUserId: session.userId, action: before ? "meeting.update" : "meeting.create", entityType: "class_meeting", entityId: meeting.id, reason: parsed.data.coverageNote ?? "Class coverage update", before: before ?? undefined, after: meeting });
  return NextResponse.json({ meeting }, { status: before ? 200 : 201 });
}

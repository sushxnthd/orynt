import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { guardianStudentLinks, studentUserLinks } from "@/lib/db/extended-schema";
import { getStudentDetail } from "@/lib/data/student";

export type PortalStudent = {
  id: string;
  name: string;
  className: string;
  attendancePercent: number | null;
  averagePercent: number | null;
  assessments: { id: string; title: string; occurredOn: string; score: string; maxScore: string }[];
  support: { id: string; title: string; status: string; successMetric: string | null; reviewAt: Date | null }[];
};

function project(detail: NonNullable<Awaited<ReturnType<typeof getStudentDetail>>>): PortalStudent {
  return {
    id: detail.student.id,
    name: `${detail.student.firstName} ${detail.student.lastName}`,
    className: `${detail.student.grade}${detail.student.section}`,
    attendancePercent: detail.attendancePercent,
    averagePercent: detail.averagePercent,
    assessments: detail.results.map((result) => ({ id: result.id, title: result.title, occurredOn: result.occurredOn, score: result.score, maxScore: result.maxScore })),
    support: detail.interventions
      .filter((item) => item.status !== "draft" && item.status !== "cancelled")
      .map((item) => ({ id: item.id, title: item.title, status: item.status, successMetric: item.successMetric, reviewAt: item.reviewAt })),
  };
}

export async function getSelfProgress(tenantId: string, userId: string): Promise<PortalStudent | null> {
  const db = getDb();
  const [link] = await db.select().from(studentUserLinks).where(and(eq(studentUserLinks.tenantId, tenantId), eq(studentUserLinks.userId, userId))).limit(1);
  if (!link) return null;
  const detail = await getStudentDetail(tenantId, link.studentId);
  return detail ? project(detail) : null;
}

export async function getFamilyProgress(tenantId: string, userId: string): Promise<PortalStudent[]> {
  const db = getDb();
  const links = await db.select().from(guardianStudentLinks).where(and(eq(guardianStudentLinks.tenantId, tenantId), eq(guardianStudentLinks.userId, userId), eq(guardianStudentLinks.active, true)));
  const details = await Promise.all(links.map((link) => getStudentDetail(tenantId, link.studentId)));
  return details.filter((detail): detail is NonNullable<typeof detail> => detail !== null).map(project);
}

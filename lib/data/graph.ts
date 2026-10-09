import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { assessmentConcepts, assessments, classes, concepts, courseOfferings, enrollments, interventionStudents, interventions, results, signals, students, subjects, visionEvents } from "@/lib/db/schema";
import { incidents, tasks } from "@/lib/db/extended-schema";

export type GraphNode = { id: string; type: string; label: string; detail: string };
export type GraphEdge = { source: string; target: string; label: string };

export async function getOntologyGraph(tenantId: string) {
  const db = getDb();
  const [studentRows, classRows, courseRows, subjectRows, conceptRows, assessmentRows, enrollmentRows, resultRows, signalRows, interventionRows, visionRows, taskRows, incidentRows] = await Promise.all([
    db.select().from(students).where(eq(students.tenantId, tenantId)).limit(24),
    db.select().from(classes).where(eq(classes.tenantId, tenantId)).limit(16),
    db.select().from(courseOfferings).where(eq(courseOfferings.tenantId, tenantId)).limit(24),
    db.select().from(subjects).where(eq(subjects.tenantId, tenantId)).limit(16),
    db.select().from(concepts).where(eq(concepts.tenantId, tenantId)).limit(36),
    db.select().from(assessments).where(eq(assessments.tenantId, tenantId)).limit(30),
    db.select().from(enrollments).where(eq(enrollments.tenantId, tenantId)).limit(80),
    db.select().from(results).where(eq(results.tenantId, tenantId)).limit(100),
    db.select().from(signals).where(eq(signals.tenantId, tenantId)).limit(30),
    db.select().from(interventions).where(eq(interventions.tenantId, tenantId)).limit(20),
    db.select().from(visionEvents).where(eq(visionEvents.tenantId, tenantId)).limit(20),
    db.select().from(tasks).where(eq(tasks.tenantId, tenantId)).limit(24),
    db.select().from(incidents).where(eq(incidents.tenantId, tenantId)).limit(20),
  ]);

  const assessmentIds = assessmentRows.map((row) => row.id);
  const interventionIds = interventionRows.map((row) => row.id);
  const [assessmentConceptRows, interventionStudentRows] = await Promise.all([
    assessmentIds.length ? db.select().from(assessmentConcepts).where(inArray(assessmentConcepts.assessmentId, assessmentIds)).limit(100) : [],
    interventionIds.length ? db.select().from(interventionStudents).where(inArray(interventionStudents.interventionId, interventionIds)).limit(100) : [],
  ]);

  const subjectById = new Map(subjectRows.map((row) => [row.id, row]));
  const classById = new Map(classRows.map((row) => [row.id, row]));
  const visible = new Set<string>();
  const nodes: GraphNode[] = [
    ...studentRows.map((r) => ({ id: `student:${r.id}`, type: "Student", label: `${r.firstName} ${r.lastName}`, detail: `${r.grade}${r.section}` })),
    ...classRows.map((r) => ({ id: `class:${r.id}`, type: "Class", label: r.name, detail: `${r.grade}${r.section}` })),
    ...courseRows.map((r) => ({ id: `course:${r.id}`, type: "Course", label: `${classById.get(r.classId)?.name ?? "Class"} · ${subjectById.get(r.subjectId)?.name ?? "Subject"}`, detail: r.academicYear })),
    ...subjectRows.map((r) => ({ id: `subject:${r.id}`, type: "Subject", label: r.name, detail: r.code })),
    ...conceptRows.map((r) => ({ id: `concept:${r.id}`, type: "Concept", label: r.name, detail: r.curriculumCode ?? "curriculum concept" })),
    ...assessmentRows.map((r) => ({ id: `assessment:${r.id}`, type: "Assessment", label: r.title, detail: r.occurredOn })),
    ...signalRows.map((r) => ({ id: `signal:${r.id}`, type: "Signal", label: r.title, detail: r.severity })),
    ...interventionRows.map((r) => ({ id: `intervention:${r.id}`, type: "Intervention", label: r.title, detail: r.status })),
    ...visionRows.map((r) => ({ id: `vision:${r.id}`, type: "Vision", label: r.eventType.replaceAll("_", " "), detail: `${r.zone} · ${r.status}` })),
    ...incidentRows.map((r) => ({ id: `incident:${r.id}`, type: "Incident", label: r.title, detail: r.status })),
    ...taskRows.map((r) => ({ id: `task:${r.id}`, type: "Task", label: r.title, detail: r.status })),
  ];
  for (const node of nodes) visible.add(node.id);

  const candidateEdges: GraphEdge[] = [
    ...courseRows.flatMap((r) => [
      { source: `class:${r.classId}`, target: `course:${r.id}`, label: "offers" },
      { source: `course:${r.id}`, target: `subject:${r.subjectId}`, label: "teaches" },
    ]),
    ...conceptRows.map((r) => ({ source: `subject:${r.subjectId}`, target: `concept:${r.id}`, label: "contains concept" })),
    ...conceptRows.flatMap((r) => r.parentConceptId ? [{ source: `concept:${r.parentConceptId}`, target: `concept:${r.id}`, label: "prerequisite / parent" }] : []),
    ...enrollmentRows.map((r) => ({ source: `student:${r.studentId}`, target: `course:${r.courseOfferingId}`, label: "enrolled" })),
    ...assessmentRows.map((r) => ({ source: `course:${r.courseOfferingId}`, target: `assessment:${r.id}`, label: "assessed by" })),
    ...assessmentConceptRows.map((r) => ({ source: `assessment:${r.assessmentId}`, target: `concept:${r.conceptId}`, label: "tests" })),
    ...resultRows.map((r) => ({ source: `student:${r.studentId}`, target: `assessment:${r.assessmentId}`, label: "attempted" })),
    ...signalRows.flatMap((r) => r.studentId ? [{ source: `student:${r.studentId}`, target: `signal:${r.id}`, label: "has signal" }] : []),
    ...signalRows.flatMap((r) => r.classId ? [{ source: `class:${r.classId}`, target: `signal:${r.id}`, label: "has signal" }] : []),
    ...interventionStudentRows.map((r) => ({ source: `intervention:${r.interventionId}`, target: `student:${r.studentId}`, label: "targets" })),
    ...incidentRows.flatMap((r) => r.visionEventId ? [{ source: `vision:${r.visionEventId}`, target: `incident:${r.id}`, label: "escalated to" }] : []),
    ...taskRows.flatMap((r) => r.interventionId ? [{ source: `intervention:${r.interventionId}`, target: `task:${r.id}`, label: "owns task" }] : []),
  ];
  const edges = candidateEdges.filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  return { nodes, edges };
}

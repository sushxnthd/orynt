import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  classes,
  concepts,
  courseOfferings,
  interventions,
  staff,
  students,
  tenants,
  users,
  visionEvents,
} from "./schema";

export const meetingStatusEnum = pgEnum("meeting_status", ["planned", "completed", "cancelled", "substituted"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["assigned", "submitted", "late", "missing", "excused"]);
export const syllabusStatusEnum = pgEnum("syllabus_status", ["not_started", "in_progress", "taught", "reviewed"]);
export const incidentStatusEnum = pgEnum("incident_status", ["open", "investigating", "resolved", "dismissed"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "blocked", "done", "cancelled"]);
export const sourceHealthEnum = pgEnum("source_health", ["healthy", "stale", "error", "disabled"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  building: text("building"),
  zone: text("zone"),
  capacity: integer("capacity"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("rooms_tenant_name_idx").on(t.tenantId, t.name)]);

export const timetableSlots = pgTable("timetable_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  dayOfWeek: integer("day_of_week").notNull(),
  period: integer("period").notNull(),
  startsAt: time("starts_at").notNull(),
  endsAt: time("ends_at").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => [
  uniqueIndex("timetable_class_day_period_idx").on(t.tenantId, t.classId, t.dayOfWeek, t.period),
  index("timetable_course_idx").on(t.tenantId, t.courseOfferingId),
]);

export const classMeetings = pgTable("class_meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  timetableSlotId: uuid("timetable_slot_id").references(() => timetableSlots.id, { onDelete: "set null" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  scheduledOn: date("scheduled_on").notNull(),
  teacherStaffId: uuid("teacher_staff_id").references(() => staff.id, { onDelete: "set null" }),
  substituteStaffId: uuid("substitute_staff_id").references(() => staff.id, { onDelete: "set null" }),
  status: meetingStatusEnum("status").notNull().default("planned"),
  coverageNote: text("coverage_note"),
  ...timestamps,
}, (t) => [index("class_meetings_tenant_day_idx").on(t.tenantId, t.scheduledOn)]);

export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  conceptId: uuid("concept_id").references(() => concepts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  maxScore: numeric("max_score", { precision: 8, scale: 2 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (t) => [index("assignments_tenant_due_idx").on(t.tenantId, t.dueAt)]);

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: numeric("score", { precision: 8, scale: 2 }),
  ...timestamps,
}, (t) => [uniqueIndex("submission_assignment_student_idx").on(t.assignmentId, t.studentId), index("submission_tenant_student_idx").on(t.tenantId, t.studentId)]);

export const syllabusProgress = pgTable("syllabus_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
  status: syllabusStatusEnum("status").notNull().default("not_started"),
  taughtAt: timestamp("taught_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  evidence: text("evidence"),
  ...timestamps,
}, (t) => [uniqueIndex("syllabus_course_concept_idx").on(t.courseOfferingId, t.conceptId)]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  interventionId: uuid("intervention_id").references(() => interventions.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").notNull().default("open"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (t) => [index("tasks_tenant_status_due_idx").on(t.tenantId, t.status, t.dueAt)]);

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  zone: text("zone"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  status: incidentStatusEnum("status").notNull().default("open"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  visionEventId: uuid("vision_event_id").references(() => visionEvents.id, { onDelete: "set null" }),
  summary: text("summary"),
  resolution: text("resolution"),
  ...timestamps,
}, (t) => [index("incidents_tenant_status_idx").on(t.tenantId, t.status)]);

export const sourceSystems = pgTable("source_systems", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  health: sourceHealthEnum("health").notNull().default("healthy"),
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  freshnessMinutes: integer("freshness_minutes"),
  errorMessage: text("error_message"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (t) => [uniqueIndex("source_system_tenant_name_idx").on(t.tenantId, t.name)]);

export const retentionPolicies = pgTable("retention_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dataClass: text("data_class").notNull(),
  retainDays: integer("retain_days").notNull(),
  legalBasis: text("legal_basis"),
  enabled: boolean("enabled").notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex("retention_tenant_class_idx").on(t.tenantId, t.dataClass)]);

export const studentUserLinks = pgTable("student_user_links", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.tenantId, t.userId, t.studentId] }), uniqueIndex("student_user_single_student_idx").on(t.tenantId, t.userId)]);

export const guardianStudentLinks = pgTable("guardian_student_links", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
}, (t) => [primaryKey({ columns: [t.tenantId, t.userId, t.studentId] }), index("guardian_user_idx").on(t.tenantId, t.userId)]);

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
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "school_admin",
  "principal",
  "coordinator",
  "teacher",
  "counselor",
  "it_admin",
  "student",
  "parent",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);
export const interventionStatusEnum = pgEnum("intervention_status", ["draft", "active", "review_due", "completed", "cancelled"]);
export const signalSeverityEnum = pgEnum("signal_severity", ["info", "watch", "action", "critical"]);
export const visionStatusEnum = pgEnum("vision_event_status", ["new", "reviewing", "dismissed", "confirmed", "resolved"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  disabled: boolean("disabled").notNull().default(false),
  ...timestamps,
});

export const memberships = pgTable("memberships", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  scope: jsonb("scope").$type<{ grades?: string[]; classIds?: string[]; subjectIds?: string[] }>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.tenantId, t.userId] }), index("membership_tenant_role_idx").on(t.tenantId, t.role)]);

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  externalId: text("external_id"),
  admissionNumber: text("admission_number"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  dateOfBirth: date("date_of_birth"),
  active: boolean("active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (t) => [
  index("students_tenant_grade_section_idx").on(t.tenantId, t.grade, t.section),
  uniqueIndex("students_tenant_external_idx").on(t.tenantId, t.externalId),
]);

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  name: text("name").notNull(),
  title: text("title"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => [index("staff_tenant_idx").on(t.tenantId)]);

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("subjects_tenant_code_idx").on(t.tenantId, t.code)]);

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  homeroomStaffId: uuid("homeroom_staff_id").references(() => staff.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [uniqueIndex("classes_tenant_grade_section_idx").on(t.tenantId, t.grade, t.section)]);

export const courseOfferings = pgTable("course_offerings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherStaffId: uuid("teacher_staff_id").references(() => staff.id, { onDelete: "set null" }),
  academicYear: text("academic_year").notNull(),
  ...timestamps,
}, (t) => [index("course_tenant_class_idx").on(t.tenantId, t.classId)]);

export const enrollments = pgTable("enrollments", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.studentId, t.courseOfferingId] }), index("enrollment_tenant_idx").on(t.tenantId)]);

export const concepts = pgTable("concepts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentConceptId: uuid("parent_concept_id"),
  curriculumCode: text("curriculum_code"),
  ...timestamps,
}, (t) => [index("concept_tenant_subject_idx").on(t.tenantId, t.subjectId)]);

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  courseOfferingId: uuid("course_offering_id").notNull().references(() => courseOfferings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  occurredOn: date("occurred_on").notNull(),
  maxScore: numeric("max_score", { precision: 8, scale: 2 }).notNull(),
  weight: numeric("weight", { precision: 6, scale: 3 }).notNull().default("1"),
  ...timestamps,
}, (t) => [index("assessment_tenant_course_date_idx").on(t.tenantId, t.courseOfferingId, t.occurredOn)]);

export const assessmentConcepts = pgTable("assessment_concepts", {
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id, { onDelete: "cascade" }),
  weight: numeric("weight", { precision: 6, scale: 3 }).notNull().default("1"),
}, (t) => [primaryKey({ columns: [t.assessmentId, t.conceptId] })]);

export const results = pgTable("results", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 8, scale: 2 }).notNull(),
  absent: boolean("absent").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestamps,
}, (t) => [uniqueIndex("result_assessment_student_idx").on(t.assessmentId, t.studentId), index("result_tenant_student_idx").on(t.tenantId, t.studentId)]);

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  source: text("source").notNull().default("import"),
  ...timestamps,
}, (t) => [uniqueIndex("attendance_student_day_idx").on(t.studentId, t.day), index("attendance_tenant_day_idx").on(t.tenantId, t.day)]);

export const signals = pgTable("signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  severity: signalSeverityEnum("severity").notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  score: numeric("score", { precision: 7, scale: 4 }),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  ruleVersion: text("rule_version").notNull(),
  active: boolean("active").notNull().default(true),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (t) => [index("signals_tenant_severity_idx").on(t.tenantId, t.severity), index("signals_student_idx").on(t.studentId)]);

export const signalEvidence = pgTable("signal_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  signalId: uuid("signal_id").notNull().references(() => signals.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  label: text("label").notNull(),
  value: text("value"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("signal_evidence_signal_idx").on(t.signalId)]);

export const interventions = pgTable("interventions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  rationale: text("rationale").notNull(),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  status: interventionStatusEnum("status").notNull().default("draft"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  reviewAt: timestamp("review_at", { withTimezone: true }),
  successMetric: text("success_metric"),
  baselineValue: numeric("baseline_value", { precision: 10, scale: 4 }),
  outcomeValue: numeric("outcome_value", { precision: 10, scale: 4 }),
  outcomeNote: text("outcome_note"),
  ...timestamps,
}, (t) => [index("interventions_tenant_status_idx").on(t.tenantId, t.status)]);

export const interventionStudents = pgTable("intervention_students", {
  interventionId: uuid("intervention_id").notNull().references(() => interventions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.interventionId, t.studentId] })]);

export const interventionEvents = pgTable("intervention_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  interventionId: uuid("intervention_id").notNull().references(() => interventions.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  note: text("note"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("intervention_event_intervention_idx").on(t.interventionId)]);

export const visionEvents = pgTable("vision_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  cameraExternalId: text("camera_external_id").notNull(),
  zone: text("zone").notNull(),
  eventType: text("event_type").notNull(),
  status: visionStatusEnum("status").notNull().default("new"),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  snapshotRef: text("snapshot_ref"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  ...timestamps,
}, (t) => [index("vision_tenant_status_time_idx").on(t.tenantId, t.status, t.occurredAt)]);

export const imports = pgTable("imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  filename: text("filename").notNull(),
  status: text("status").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  mapping: jsonb("mapping").$type<Record<string, string>>().default({}),
  checksum: text("checksum"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [index("imports_tenant_created_idx").on(t.tenantId, t.createdAt)]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  reason: text("reason"),
  requestId: text("request_id"),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("audit_tenant_created_idx").on(t.tenantId, t.createdAt), index("audit_entity_idx").on(t.entityType, t.entityId)]);

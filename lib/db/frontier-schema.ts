import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants, users } from "./schema";
import { sourceSystems } from "./extended-schema";

export const studioKindEnum = pgEnum("studio_definition_kind", ["object_type", "metric", "workflow"]);
export const runStatusEnum = pgEnum("frontier_run_status", ["queued", "running", "completed", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const studioDefinitions = pgTable("studio_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  kind: studioKindEnum("kind").notNull(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  enabled: boolean("enabled").notNull().default(true),
  definition: jsonb("definition").$type<Record<string, unknown>>().notNull().default({}),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [uniqueIndex("studio_tenant_key_idx").on(t.tenantId, t.kind, t.key), index("studio_tenant_kind_idx").on(t.tenantId, t.kind)]);

export const scenarioRuns = pgTable("scenario_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull(),
  result: jsonb("result").$type<Record<string, unknown>>().notNull(),
  modelVersion: text("model_version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("scenario_runs_tenant_created_idx").on(t.tenantId, t.createdAt)]);

export const forecastRuns = pgTable("forecast_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  horizon: integer("horizon").notNull(),
  estimate: numeric("estimate", { precision: 10, scale: 4 }).notNull(),
  low: numeric("low", { precision: 10, scale: 4 }).notNull(),
  high: numeric("high", { precision: 10, scale: 4 }).notNull(),
  calibrationStatus: text("calibration_status").notNull(),
  modelVersion: text("model_version").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("forecast_runs_tenant_created_idx").on(t.tenantId, t.createdAt)]);

export const connectorSyncs = pgTable("connector_syncs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  sourceSystemId: uuid("source_system_id").notNull().references(() => sourceSystems.id, { onDelete: "cascade" }),
  status: runStatusEnum("status").notNull().default("queued"),
  entity: text("entity").notNull(),
  rowsRead: integer("rows_read").notNull().default(0),
  rowsWritten: integer("rows_written").notNull().default(0),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("connector_syncs_tenant_created_idx").on(t.tenantId, t.createdAt)]);

export const edgeAgents = pgTable("edge_agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  active: boolean("active").notNull().default(true),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default(["vision-events"]),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex("edge_agent_token_hash_idx").on(t.tokenHash), index("edge_agent_tenant_idx").on(t.tenantId)]);

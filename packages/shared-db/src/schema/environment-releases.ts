import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { environmentsTable } from "./environments";

export const environmentReleasesTable = pgTable("environment_releases", {
  id: serial("id").primaryKey(),
  environmentId: integer("environment_id")
    .notNull()
    .references(() => environmentsTable.id, { onDelete: "cascade" }),
  releaseType: text("release_type").notNull().default("workflow"),
  artifactType: text("artifact_type").notNull(),
  artifactId: integer("artifact_id").notNull(),
  artifactVersionId: integer("artifact_version_id"),
  artifactChecksum: text("artifact_checksum"),
  fromEnvironment: text("from_environment"),
  toEnvironment: text("to_environment").notNull(),
  status: text("status").notNull().default("pending"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  diffReview: jsonb("diff_review"),
  rollbackOf: integer("rollback_of"),
  deployedBy: text("deployed_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type EnvironmentReleaseRecord =
  typeof environmentReleasesTable.$inferSelect;

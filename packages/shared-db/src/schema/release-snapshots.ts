import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const releaseSnapshotsTable = pgTable("release_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  serviceName: text("service_name").notNull(),
  version: text("version").notNull(),
  chartVersion: text("chart_version"),
  helmRevision: integer("helm_revision"),
  configChecksum: text("config_checksum"),
  migrationVersion: integer("migration_version"),
  snapshotData: jsonb("snapshot_data").default({}),
  rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
  rolledBackToVersion: text("rolled_back_to_version"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ReleaseSnapshot = typeof releaseSnapshotsTable.$inferSelect;

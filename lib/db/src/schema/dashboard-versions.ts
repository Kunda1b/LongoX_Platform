import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { dashboardsTable } from "./dashboards";
export const dashboardVersionsTable = pgTable("dashboard_versions", {
  id: serial("id").primaryKey(),
  dashboardId: integer("dashboard_id").notNull().references(() => dashboardsTable.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  configJson: jsonb("config_json").notNull().default({}),
  layoutJson: jsonb("layout_json").notNull().default({}),
  checksum: text("checksum"),
  createdBy: integer("created_by"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

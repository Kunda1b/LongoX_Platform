import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { dashboardsTable } from "./dashboards";
export const dashboardVersionsTable = pgTable("dashboard_versions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboardsTable.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  configJson: jsonb("config_json").notNull().default({}),
  layoutJson: jsonb("layout_json").notNull().default({}),
  checksum: text("checksum"),
  createdBy: text("created_by"),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { connectorsTable } from "./connectors";
export const connectorVersionsTable = pgTable("connector_versions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  connectorId: text("connector_id")
    .notNull()
    .references(() => connectorsTable.id, { onDelete: "cascade" }),
  semver: text("semver").notNull(),
  manifestJson: jsonb("manifest_json").notNull().default({}),
  artifactRef: text("artifact_ref"),
  checksum: text("checksum"),
  isDeprecated: boolean("is_deprecated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

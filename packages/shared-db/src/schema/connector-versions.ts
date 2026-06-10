import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { connectorsTable } from "./connectors";
export const connectorVersionsTable = pgTable("connector_versions", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id")
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

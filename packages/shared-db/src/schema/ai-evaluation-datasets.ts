import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const aiEvaluationDatasetsTable = pgTable("ai_evaluation_datasets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  promptId: integer("prompt_id"),
  modelId: integer("model_id"),
  samples: jsonb("samples").notNull().default([]),
  sampleCount: integer("sample_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AiEvaluationDatasetRecord =
  typeof aiEvaluationDatasetsTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const credentialsTable = pgTable("credentials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  connectorId: integer("connector_id").notNull(),
  connectorName: text("connector_name").notNull(),
  fields: text("fields").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCredentialSchema = createInsertSchema(credentialsTable).omit(
  { id: true, createdAt: true },
);
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentialsTable.$inferSelect;

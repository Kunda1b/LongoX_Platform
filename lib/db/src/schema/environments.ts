import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const environmentsTable = pgTable("environments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("dev"),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type EnvironmentRecord = typeof environmentsTable.$inferSelect;

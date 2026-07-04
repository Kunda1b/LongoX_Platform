import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const environmentsTable = pgTable("environments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  type: text("type").notNull().default("dev"),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type EnvironmentRecord = typeof environmentsTable.$inferSelect;

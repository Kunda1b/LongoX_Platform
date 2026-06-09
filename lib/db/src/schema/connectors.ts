import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const connectorsTable = pgTable("connectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color"),
  isInstalled: boolean("is_installed").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  actionCount: integer("action_count").notNull().default(0),
  triggerCount: integer("trigger_count").notNull().default(0),
  installCount: integer("install_count").notNull().default(0),
  rating: real("rating"),
  author: text("author"),
});

export const insertConnectorSchema = createInsertSchema(connectorsTable).omit({ id: true });
export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectorsTable.$inferSelect;

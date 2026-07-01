import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const ragKnowledgeBasesTable = pgTable("rag_knowledge_bases", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  embeddingModel: text("embedding_model").notNull().default("text-embedding-3-small"),
  chunkSize: integer("chunk_size").notNull().default(512),
  chunkOverlap: integer("chunk_overlap").notNull().default(64),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RagKnowledgeBaseRecord =
  typeof ragKnowledgeBasesTable.$inferSelect;

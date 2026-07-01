import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const ragKnowledgeBasesTable = pgTable("rag_knowledge_bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  embeddingModel: text("embedding_model").notNull().default("text-embedding-3-small"),
  chunkStrategy: text("chunk_strategy", { enum: ["recursive", "fixed", "semantic"] }).notNull().default("recursive"),
  chunkSize: integer("chunk_size").notNull().default(512),
  chunkOverlap: integer("chunk_overlap").notNull().default(64),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "indexing", "error"] }).notNull().default("active"),
  documentCount: integer("document_count").notNull().default(0),
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

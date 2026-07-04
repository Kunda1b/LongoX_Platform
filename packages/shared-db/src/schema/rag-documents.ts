import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { ragKnowledgeBasesTable } from "./rag-knowledge-bases";

export const ragDocumentsTable = pgTable("rag_documents", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => ragKnowledgeBasesTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  sourceType: text("source_type", { enum: ["upload", "web", "api", "manual"] }).notNull().default("manual"),
  contentType: text("content_type"),
  contentHash: text("content_hash"),
  pageCount: integer("page_count"),
  status: text("status", { enum: ["pending", "indexing", "indexed", "error"] }).notNull().default("pending"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RagDocumentRecord = typeof ragDocumentsTable.$inferSelect;

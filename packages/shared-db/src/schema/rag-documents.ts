import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { ragKnowledgeBasesTable } from "./rag-knowledge-bases";

export const ragDocumentsTable = pgTable("rag_documents", {
  id: serial("id").primaryKey(),
  knowledgeBaseId: integer("knowledge_base_id")
    .notNull()
    .references(() => ragKnowledgeBasesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  source: text("source").notNull(),
  sourceType: text("source_type").notNull().default("manual"),
  mimeType: text("mime_type"),
  size_bytes: integer("size_bytes"),
  metadata: jsonb("metadata").default({}),
  chunkCount: integer("chunk_count").notNull().default(0),
  isIndexed: boolean("is_indexed").notNull().default(false),
  checksum: text("checksum"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RagDocumentRecord = typeof ragDocumentsTable.$inferSelect;

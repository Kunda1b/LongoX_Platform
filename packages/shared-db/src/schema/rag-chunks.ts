import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";
import { ragDocumentsTable } from "./rag-documents";
import { ragKnowledgeBasesTable } from "./rag-knowledge-bases";

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1536)",
  toDriver: (value: number[]) => `[${value.join(",")}]`,
  fromDriver: (value: string) => {
    const cleaned = value.replace(/^\[|\]$/g, "").trim();
    if (!cleaned) return [];
    return cleaned.split(",").map(Number);
  },
});

export const ragChunksTable = pgTable("rag_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => ragDocumentsTable.id, { onDelete: "cascade" }),
  knowledgeBaseId: integer("knowledge_base_id")
    .notNull()
    .references(() => ragKnowledgeBasesTable.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embedding: vector1536("embedding"),
  tokens: integer("tokens").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RagChunkRecord = typeof ragChunksTable.$inferSelect;

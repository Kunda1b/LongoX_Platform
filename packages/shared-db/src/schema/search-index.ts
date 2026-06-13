import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const searchIndexTable = pgTable("search_index", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull(),
  tenantId: integer("tenant_id"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  metadata: jsonb("metadata").default({}),
  embedding: jsonb("embedding"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const searchSuggestionsTable = pgTable("search_suggestions", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  tenantId: integer("tenant_id"),
  resultCount: integer("result_count").notNull().default(0),
  clickedDocumentId: text("clicked_document_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SearchIndexRecord = typeof searchIndexTable.$inferSelect;
export type SearchSuggestionRecord = typeof searchSuggestionsTable.$inferSelect;

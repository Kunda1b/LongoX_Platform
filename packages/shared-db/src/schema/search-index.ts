import { pgTable, text, integer, jsonb, timestamp, uniqueIndex, index, customType } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const searchIndexTable = pgTable(
  "search_index",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    tsv: tsvectorType("tsv"),
    tenantId: text("tenant_id"),
    permissionResource: text("permission_resource"),
    permissionAction: text("permission_action"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    resourceIdx: uniqueIndex("idx_search_resource").on(
      table.resourceType,
      table.resourceId,
    ),
    tsvIdx: index("idx_search_tsv_gin").using("gin", sql`${table.tsv}`),
  }),
);

export const searchSuggestionsTable = pgTable("search_suggestions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  query: text("query").notNull(),
  tenantId: text("tenant_id"),
  resultCount: integer("result_count").notNull().default(0),
  clickedDocumentId: text("clicked_document_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export function toTsVector(content: string) {
  return sql`to_tsvector('english', ${content})`;
}

export type SearchIndexRecord = typeof searchIndexTable.$inferSelect;
export type SearchSuggestionRecord = typeof searchSuggestionsTable.$inferSelect;

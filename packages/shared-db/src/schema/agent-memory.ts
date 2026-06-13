import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const agentMemoryTable = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull(),
  workflowId: integer("workflow_id"),
  executionId: integer("execution_id"),
  memoryType: text("memory_type").notNull().default("short_term"),
  key: text("key").notNull(),
  content: text("content").notNull(),
  embedding: jsonb("embedding"),
  metadata: jsonb("metadata").default({}),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AgentMemoryRecord = typeof agentMemoryTable.$inferSelect;

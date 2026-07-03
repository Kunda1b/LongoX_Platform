-- 004_consumer_offsets_and_token_usage.sql
-- ADR-013 Phase 3: bring consumer_offsets and token_usage into the Prisma-managed schema.
-- These tables previously existed only in the Drizzle schema (packages/shared-db/src/schema/)
-- and were called out as ❌ MISSING in prisma/MIGRATION_CHECKLIST.md rows 37 and 38.

-- ─── consumer_offsets (architecture.md §19.3) ────────────────────────────────
-- At-least-once delivery dedupe table. Composite PK on (consumer_name, event_id).
-- Index on (consumer_name, processed_at DESC) for "find next unprocessed" queries.
CREATE TABLE IF NOT EXISTS "consumer_offsets" (
    "consumer_name" TEXT NOT NULL,
    "event_id"      TEXT NOT NULL,
    "aggregate_id"  TEXT NOT NULL,
    "processed_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "status"        TEXT NOT NULL DEFAULT 'processing'
                    CHECK ("status" IN ('processing','completed','failed','dead_letter')),
    "error"         TEXT,
    PRIMARY KEY ("consumer_name", "event_id")
);

CREATE INDEX IF NOT EXISTS "consumer_offsets_consumer_name_processed_at_idx"
    ON "consumer_offsets" ("consumer_name", "processed_at" DESC);

-- ─── token_usage (architecture.md §10.1, ADR-013 Phase 2 P1 ai-service) ──────
-- Per-request AI token usage for billing traceability
-- (invoice_lines → usage_rollups → metering_events drill-down, SOC 2 requirement).
CREATE TABLE IF NOT EXISTS "token_usage" (
    "id"             SERIAL PRIMARY KEY,
    "tenant_id"      INTEGER NOT NULL,
    "model_id"       INTEGER,
    "model_name"     TEXT,
    "provider"       TEXT,
    "prompt_id"      INTEGER,
    "workflow_id"    INTEGER,
    "input_tokens"   INTEGER NOT NULL DEFAULT 0,
    "output_tokens"  INTEGER NOT NULL DEFAULT 0,
    "cost"           DECIMAL(12, 6) NOT NULL DEFAULT 0,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "token_usage_tenant_id_created_at_idx"
    ON "token_usage" ("tenant_id", "created_at");

CREATE INDEX IF NOT EXISTS "token_usage_workflow_id_idx"
    ON "token_usage" ("workflow_id");

CREATE INDEX IF NOT EXISTS "token_usage_prompt_id_idx"
    ON "token_usage" ("prompt_id");

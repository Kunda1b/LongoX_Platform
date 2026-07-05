-- 009_core_tables_tsvector.sql
--
-- ADR-010: "Every searchable table gets a generated tsvector column
-- (workflow_name_tsv, connector_desc_tsv, etc.) with a GIN index."
--
-- This migration adds pre-computed tsvector generated columns + GIN indexes
-- to the core domain tables that are searched directly (not through the
-- search_index projection). This eliminates runtime to_tsvector() calls.

BEGIN;

-- ─── workflows ──────────────────────────────────────────────────────────────
ALTER TABLE workflows
  ADD COLUMN IF NOT EXISTS name_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

ALTER TABLE workflows
  ADD COLUMN IF NOT EXISTS desc_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_workflows_name_tsv ON workflows USING gin (name_tsv);
CREATE INDEX IF NOT EXISTS idx_workflows_desc_tsv ON workflows USING gin (desc_tsv);

-- ─── apps ───────────────────────────────────────────────────────────────────
ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS name_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS desc_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_apps_name_tsv ON apps USING gin (name_tsv);
CREATE INDEX IF NOT EXISTS idx_apps_desc_tsv ON apps USING gin (desc_tsv);

-- ─── templates ──────────────────────────────────────────────────────────────
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS name_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_templates_name_tsv ON templates USING gin (name_tsv);

-- ─── connectors ─────────────────────────────────────────────────────────────
ALTER TABLE connectors
  ADD COLUMN IF NOT EXISTS name_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

ALTER TABLE connectors
  ADD COLUMN IF NOT EXISTS desc_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_connectors_name_tsv ON connectors USING gin (name_tsv);
CREATE INDEX IF NOT EXISTS idx_connectors_desc_tsv ON connectors USING gin (desc_tsv);

COMMIT;

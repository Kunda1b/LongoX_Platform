-- =============================================================================
-- LongoX Database Migration: 002_search_fts_indexes
-- =============================================================================
-- Description: Add PostgreSQL full-text search (tsvector) generated columns
-- and GIN indexes for searchable domains per ADR-010.
--
-- NOTE: This migration uses CREATE INDEX CONCURRENTLY which requires it to
-- be run OUTSIDE a transaction block. Run via:
--   psql -1 -f 002_search_fts_indexes.sql
-- or disable transactional wrapping in your migration tool.
-- =============================================================================

-- Step 1: Add tsvector stored generated columns (table rewrite happens here)
-- These lock the table briefly but must happen in a transaction for the
-- GENERATED ALWAYS AS ... STORED clause.

-- Workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
  ) STORED;

-- Apps
ALTER TABLE apps ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
  ) STORED;

-- Templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
  ) STORED;

-- Connectors
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
  ) STORED;

-- Audit log
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(action, '') || ' ' ||
      COALESCE(resource_type, '') || ' ' ||
      COALESCE(actor_id, '')
    )
  ) STORED;

-- Prompts
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(content, ''))
  ) STORED;

-- Step 2: Create GIN indexes CONCURRENTLY (non-blocking)
-- These must run outside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_fts ON workflows USING GIN (fts);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_fts ON apps USING GIN (fts);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_templates_fts ON templates USING GIN (fts);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connectors_fts ON connectors USING GIN (fts);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_fts ON audit_log USING GIN (fts);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_fts ON prompts USING GIN (fts);

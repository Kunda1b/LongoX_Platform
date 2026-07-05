-- =============================================================================
-- 008_partial_indexes.sql
-- LongoX Platform — Database partial indexes (architecture §10.6 / matrix item 42)
-- =============================================================================
-- Adds partial indexes that filter on a status predicate. These keep the
-- index small (only the rows that match the predicate) and make the common
-- "list active X for tenant Y ordered by recency" query cheap.
--
-- Idempotent: each statement uses IF NOT EXISTS so re-running is safe.
-- =============================================================================

-- Active workflows per tenant, ordered by most-recently-updated.
-- Supports the dashboard "recent active workflows" list.
CREATE INDEX IF NOT EXISTS idx_workflows_active
  ON workflows (tenant_id, updated_at)
  WHERE status = 'active';

-- Running workflow executions per workflow, ordered by start time.
-- Supports the operational "currently running executions" view and the
-- workflow-execution-recovery worker's lease scan.
CREATE INDEX IF NOT EXISTS idx_workflow_executions_running
  ON workflow_executions (workflow_id, started_at)
  WHERE status = 'running';

-- 006_partition_high_volume_tables.sql
--
-- ADR §10.2: Six high-volume tables must be partitioned monthly by occurred_at:
--   1. workflow_executions (already has audit_log in 001, this adds the other 5)
--   2. node_execution_checkpoints
--   3. platform_events
--   4. audit_logs (already done in 001 — skipped here)
--   5. metering_events
--   6. ai_usage
--
-- This migration creates partition parent tables and initial monthly partitions.
-- The partition-manager service (execution-service) creates future partitions
-- and detaches old ones per the retention policy (ADR-012).
--
-- IMPORTANT: Run AFTER the cuid migration (005) so all tables use text IDs.

BEGIN;

-- Helper: create a partitioned table if it doesn't already exist as partitioned
-- We use CREATE TABLE IF NOT EXISTS ... PARTITION BY to avoid errors if the
-- table already exists (e.g., from a previous partial run).

-- ─── 1. workflow_executions ─────────────────────────────────────────────────
-- If the table exists but is NOT partitioned, we need to migrate it.
-- For new deployments, this creates the partitioned parent directly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'workflow_executions' AND c.relkind = 'p'
  ) THEN
    -- Table either doesn't exist or isn't partitioned.
    -- Rename existing table if present, then create partitioned parent.
    IF EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'workflow_executions' AND relkind = 'r'
    ) THEN
      ALTER TABLE workflow_executions RENAME TO workflow_executions_old;
    END IF;

    EXECUTE 'CREATE TABLE workflow_executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT ''pending'',
      trigger_type TEXT,
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ,
      error_message TEXT,
      parent_execution_id TEXT,
      steps JSONB DEFAULT ''[]'',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (occurred_at)';

    -- Migrate data from old table if it exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'workflow_executions_old') THEN
      EXECUTE 'INSERT INTO workflow_executions SELECT *, created_at AS occurred_at FROM workflow_executions_old';
      DROP TABLE workflow_executions_old;
    END IF;

    -- Create indexes on partitioned table
    CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions (workflow_id, started_at);
    CREATE INDEX idx_workflow_executions_status ON workflow_executions (status) WHERE status = 'running';
    CREATE INDEX idx_workflow_executions_tenant ON workflow_executions (workflow_id, occurred_at);
  END IF;
END $$;

-- ─── 2. node_execution_checkpoints ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'node_execution_checkpoints' AND relkind = 'p'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'node_execution_checkpoints' AND relkind = 'r'
    ) THEN
      ALTER TABLE node_execution_checkpoints RENAME TO node_execution_checkpoints_old;
    END IF;

    EXECUTE 'CREATE TABLE node_execution_checkpoints (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      attempt INTEGER NOT NULL DEFAULT 0,
      state JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (occurred_at)';

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'node_execution_checkpoints_old') THEN
      EXECUTE 'INSERT INTO node_execution_checkpoints SELECT *, created_at AS occurred_at FROM node_execution_checkpoints_old';
      DROP TABLE node_execution_checkpoints_old;
    END IF;

    CREATE INDEX idx_node_exec_checkpoints_exec ON node_execution_checkpoints (execution_id, node_id, attempt);
  END IF;
END $$;

-- ─── 3. platform_events ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'platform_events' AND relkind = 'p'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'platform_events' AND relkind = 'r'
    ) THEN
      ALTER TABLE platform_events RENAME TO platform_events_old;
    END IF;

    EXECUTE 'CREATE TABLE platform_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      event_version INTEGER NOT NULL DEFAULT 1,
      aggregate_id TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT ''{}'',
      actor_id TEXT,
      correlation_id TEXT,
      tenant_id TEXT,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (occurred_at)';

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'platform_events_old') THEN
      EXECUTE 'INSERT INTO platform_events SELECT * FROM platform_events_old';
      DROP TABLE platform_events_old;
    END IF;

    CREATE INDEX idx_platform_events_type ON platform_events (event_type, occurred_at);
    CREATE INDEX idx_platform_events_aggregate ON platform_events (aggregate_id);
  END IF;
END $$;

-- ─── 4. metering_events ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'metering_events' AND relkind = 'p'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'metering_events' AND relkind = 'r'
    ) THEN
      ALTER TABLE metering_events RENAME TO metering_events_old;
    END IF;

    EXECUTE 'CREATE TABLE metering_events (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      quantity NUMERIC(20,4) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      metadata JSONB DEFAULT ''{}'',
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (occurred_at)';

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'metering_events_old') THEN
      EXECUTE 'INSERT INTO metering_events SELECT *, ingested_at AS occurred_at FROM metering_events_old';
      DROP TABLE metering_events_old;
    END IF;

    CREATE INDEX idx_metering_events_tenant ON metering_events (tenant_id, occurred_at);
    CREATE UNIQUE INDEX idx_metering_events_event_id ON metering_events (event_id);
  END IF;
END $$;

-- ─── 5. ai_usage ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'ai_usage' AND relkind = 'p'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'ai_usage' AND relkind = 'r'
    ) THEN
      ALTER TABLE ai_usage RENAME TO ai_usage_old;
    END IF;

    EXECUTE 'CREATE TABLE ai_usage (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      model_id TEXT,
      model_name TEXT,
      provider TEXT,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      cost NUMERIC(12,6) NOT NULL DEFAULT 0,
      run_id TEXT,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ) PARTITION BY RANGE (occurred_at)';

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ai_usage_old') THEN
      EXECUTE 'INSERT INTO ai_usage SELECT *, NOW() AS occurred_at FROM ai_usage_old';
      DROP TABLE ai_usage_old;
    END IF;

    CREATE INDEX idx_ai_usage_tenant ON ai_usage (tenant_id, occurred_at);
  END IF;
END $$;

-- ─── Create initial monthly partitions for all 5 tables ─────────────────────
-- Creates current month + next 12 months for each table
DO $$
DECLARE
  tbl TEXT;
  start_date DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  partition_name TEXT;
  partition_end DATE;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['workflow_executions', 'node_execution_checkpoints', 'platform_events', 'metering_events', 'ai_usage']) LOOP
    FOR i IN 0..12 LOOP
      partition_name := tbl || '_' || TO_CHAR(start_date + (i || ' months')::INTERVAL, 'YYYY_MM');
      partition_end := (DATE_TRUNC('month', start_date + ((i + 1) || ' months')::INTERVAL))::DATE;

      IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name AND relkind = 'r') THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
          partition_name, tbl, start_date + (i || ' months')::INTERVAL, partition_end
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- Migration complete. All 6 high-volume tables are now partitioned monthly:
--   audit_logs (from 001), workflow_executions, node_execution_checkpoints,
--   platform_events, metering_events, ai_usage (from 006).
-- The partition-manager service creates future partitions and detaches old
-- ones per the retention policy (ADR-012: 13M hot + 7Y cold).

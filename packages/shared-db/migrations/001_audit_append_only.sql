-- =============================================================================
-- LongoX Database Migration: 001_audit_append_only
-- =============================================================================
-- Description: Enforce append-only audit log with hash chaining, monthly
-- partitioning, and consumer offset tracking.
-- =============================================================================

-- Ensure audit_log is partitioned
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'audit_log' AND relkind = 'p'
  ) THEN
    ALTER TABLE audit_log RENAME TO audit_log_flat;
    CREATE TABLE audit_log (LIKE audit_log_flat INCLUDING DEFAULTS INCLUDING CONSTRAINTS)
      PARTITION BY RANGE (created_at);
    INSERT INTO audit_log SELECT * FROM audit_log_flat;
    DROP TABLE audit_log_flat;
  END IF;
END $$;

-- Add hash chain columns if not present
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);

-- Backfill hash chain for existing rows
DO $$
DECLARE
  r RECORD;
  prev_hash VARCHAR(64) = NULL;
BEGIN
  FOR r IN SELECT id, tenant_id, action, resource_type, actor_id, created_at
           FROM audit_log ORDER BY id
  LOOP
    UPDATE audit_log
    SET entry_hash = encode(
      sha256(
        COALESCE(prev_hash || '|', '') ||
        r.id::text || '|' ||
        COALESCE(r.tenant_id::text, '') || '|' ||
        COALESCE(r.action, '') || '|' ||
        COALESCE(r.resource_type, '') || '|' ||
        COALESCE(r.actor_id, '') || '|' ||
        COALESCE(r.created_at::text, '')
      ),
      'hex'
    ),
    previous_hash = prev_hash
    WHERE id = r.id;
    SELECT entry_hash INTO prev_hash FROM audit_log WHERE id = r.id;
  END LOOP;
END $$;

-- Index for fast previous-hash lookup (used on every INSERT)
CREATE INDEX IF NOT EXISTS idx_audit_log_hash_lookup
  ON audit_log (tenant_id, id);

-- Trigger function: compute hash chain on INSERT
CREATE OR REPLACE FUNCTION hash_audit_entry()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
BEGIN
  SELECT entry_hash INTO prev_hash
  FROM audit_log
  WHERE tenant_id = NEW.tenant_id
  ORDER BY id DESC LIMIT 1 OFFSET 1;

  NEW.previous_hash := prev_hash;
  NEW.entry_hash := encode(
    sha256(
      COALESCE(prev_hash || '|', '') ||
      NEW.id::text || '|' ||
      COALESCE(NEW.tenant_id::text, '') || '|' ||
      COALESCE(NEW.action, '') || '|' ||
      COALESCE(NEW.resource_type, '') || '|' ||
      COALESCE(NEW.actor_id, '') || '|' ||
      COALESCE(NEW.created_at::text, '')
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Block UPDATE/DELETE on audit_log
CREATE OR REPLACE FUNCTION block_audit_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: UPDATE/DELETE not allowed'
    USING HINT = 'Audit entries are immutable by policy';
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers (idempotent via OR REPLACE)
DROP TRIGGER IF EXISTS trg_audit_hash ON audit_log;
DROP TRIGGER IF EXISTS trg_audit_block_update ON audit_log;
DROP TRIGGER IF EXISTS trg_audit_block_delete ON audit_log;

CREATE TRIGGER trg_audit_hash
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION hash_audit_entry();

CREATE TRIGGER trg_audit_block_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION block_audit_mutations();

CREATE TRIGGER trg_audit_block_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION block_audit_mutations();

-- Create monthly partitions (12 months ahead from current)
DO $$
DECLARE
  start_date DATE;
  partition_name TEXT;
  partition_end DATE;
BEGIN
  start_date := DATE_TRUNC('month', NOW());
  FOR i IN 0..12 LOOP
    partition_name := 'audit_log_' || TO_CHAR(start_date + (i || ' months')::INTERVAL, 'YYYY_MM');
    partition_end := (DATE_TRUNC('month', start_date + ((i + 1) || ' months')::INTERVAL))::DATE;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = partition_name AND relkind = 'r'
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        start_date + (i || ' months')::INTERVAL,
        partition_end
      );
    END IF;
  END LOOP;
END $$;

-- Create consumer_offsets table
CREATE TABLE IF NOT EXISTS consumer_offsets (
  id SERIAL PRIMARY KEY,
  consumer_group VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  partition INTEGER NOT NULL DEFAULT 0,
  offset BIGINT NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (consumer_group, topic, partition)
);

CREATE INDEX IF NOT EXISTS idx_consumer_offsets_group
  ON consumer_offsets (consumer_group, topic);

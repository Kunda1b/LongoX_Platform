-- 007_search_tsvector_columns.sql
--
-- ADR-010: Add pre-computed tsvector generated columns + GIN indexes
-- to the search_index table so FTS queries use GIN indexes instead of
-- computing tsvector at query time.

BEGIN;

-- Add generated tsvector columns (computed from title and content)
ALTER TABLE search_index
  ADD COLUMN IF NOT EXISTS title_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

ALTER TABLE search_index
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

-- GIN indexes for fast FTS queries
CREATE INDEX IF NOT EXISTS idx_search_index_title_tsv
  ON search_index USING gin (title_tsv);

CREATE INDEX IF NOT EXISTS idx_search_index_content_tsv
  ON search_index USING gin (content_tsv);

-- Composite GIN index for combined title+content search
CREATE INDEX IF NOT EXISTS idx_search_index_combined_tsv
  ON search_index USING gin ((title_tsv || content_tsv));

COMMIT;

-- =============================================================================
-- LongoX Database Migration: 003_pgvector_hnsw
-- =============================================================================
-- Description: Enable pgvector extension and create HNSW index on rag_chunks
-- embedding column for fast approximate nearest neighbor search using cosine
-- distance.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON rag_chunks
  USING hnsw (embedding vector_cosine_ops);

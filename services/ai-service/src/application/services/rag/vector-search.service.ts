/**
 * Vector search service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.$queryRaw` for pgvector similarity queries and
 * `prisma.vectorEmbedding` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { EmbeddingService, embeddingService } from "./embedding.service";

export interface SearchResult {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  tokens: number;
  documentFilename: string;
  documentSourceType: string;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
}

export class VectorSearchService {
  constructor(private embedding: EmbeddingService = embeddingService) {}

  async search(
    kbId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const topK = options.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5);
    const minScore = options.minScore ?? 0.0;

    const { vector } = await this.embedding.generateEmbedding(query);

    try {
      return await this.pgvectorSearch(
        kbId,
        vector,
        topK,
        minScore,
        options.filter,
      );
    } catch {
      return this.inMemorySearch(kbId, vector, topK, minScore, options.filter);
    }
  }

  private async pgvectorSearch(
    kbId: string,
    queryVector: number[],
    topK: number,
    minScore: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    const vectorLit = `[${queryVector.join(",")}]`;

    let whereClause = "rc.knowledge_base_id = $1";
    const params: unknown[] = [kbId];
    let paramIdx = 2;

    if (filter && Object.keys(filter).length > 0) {
      for (const [key, value] of Object.entries(filter)) {
        whereClause += ` AND rc.metadata->>${paramIdx === 2 ? 2 : paramIdx} = $${paramIdx + 1}`;
        params.push(key, String(value));
        paramIdx += 2;
      }
    }

    // Build the parameterized query. The vector literal is interpolated as a
    // raw SQL fragment (pgvector accepts the `'[1,2,3]'::vector` literal form);
    // all other inputs are bound parameters.
    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        rc.id AS "chunkId",
        rc.document_id AS "documentId",
        rc.chunk_index AS "chunkIndex",
        rc.content,
        rc.tokens,
        rc.metadata,
        rd.filename AS "documentFilename",
        rd.source_type AS "documentSourceType",
        1 - (rc.embedding <=> '${vectorLit}'::vector) AS score
      FROM rag_chunks rc
      INNER JOIN rag_documents rd ON rc.document_id = rd.id
      WHERE ${whereClause}
      ORDER BY rc.embedding <=> '${vectorLit}'::vector
      LIMIT ${topK}
      `,
      ...params,
    ) as any[];

    return (rows ?? [])
      .filter((r: any) => r.score >= minScore)
      .map((r: any) => ({
        chunkId: r.chunkId,
        documentId: r.documentId,
        chunkIndex: r.chunkIndex,
        content: r.content,
        score: r.score,
        tokens: r.tokens ?? 0,
        documentFilename: r.documentFilename,
        documentSourceType: r.documentSourceType,
        metadata: r.metadata ?? {},
      }));
  }

  private async inMemorySearch(
    kbId: string,
    queryVector: number[],
    topK: number,
    minScore: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    const rows = (await prisma.vectorEmbedding.findMany({
      where: { knowledgeBaseId: kbId } as any,
      include: { document: true } as any,
    })) as any;

    const scored: SearchResult[] = [];

    for (const row of rows) {
      const emb = (row as any).embedding;
      if (!emb || !Array.isArray(emb)) continue;
      const score = this.embedding.cosineSimilarity(
        queryVector,
        emb as unknown as number[],
      );
      if (score < minScore) continue;

      if (filter && Object.keys(filter).length > 0) {
        const meta = ((row as any).metadata ?? {}) as Record<string, unknown>;
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (meta[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const doc = (row as any).document ?? {};
      scored.push({
        chunkId: (row as any).id,
        documentId: (row as any).documentId,
        chunkIndex: (row as any).chunkIndex,
        content: (row as any).content,
        score,
        tokens: (row as any).tokens,
        documentFilename: doc.filename,
        documentSourceType: doc.sourceType,
        metadata: (row as any).metadata ?? {},
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async hybridSearch(
    kbId: string,
    query: string,
    options: SearchOptions & { ftsWeight?: number; vectorWeight?: number } = {},
  ): Promise<SearchResult[]> {
    const ftsWeight = options.ftsWeight ?? 0.3;
    const vectorWeight = options.vectorWeight ?? 0.7;

    const vectorResults = await this.search(kbId, query, {
      ...options,
      topK: (options.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5)) * 2,
    });

    let ftsResults: SearchResult[] = [];

    const ftsQuery = query
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (ftsQuery.length > 0) {
      try {
        const ftsRows = await prisma.$queryRawUnsafe(
          `
          SELECT
            rc.id AS "chunkId",
            rc.document_id AS "documentId",
            rc.chunk_index AS "chunkIndex",
            rc.content,
            rc.tokens,
            rc.metadata,
            rd.filename AS "documentFilename",
            rd.source_type AS "documentSourceType",
            ts_rank(to_tsvector('english', rc.content), plainto_tsquery('english', $2)) AS rank
          FROM rag_chunks rc
          INNER JOIN rag_documents rd ON rc.document_id = rd.id
          WHERE rc.knowledge_base_id = $1
            AND to_tsvector('english', rc.content) @@ plainto_tsquery('english', $2)
          ORDER BY ts_rank(to_tsvector('english', rc.content), plainto_tsquery('english', $2)) DESC
          LIMIT $3
          `,
          kbId,
          query,
          (options.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5)) * 2,
        ) as any[];

        ftsResults = (ftsRows ?? []).map((r: any) => ({
          chunkId: r.chunkId,
          documentId: r.documentId,
          chunkIndex: r.chunkIndex,
          content: r.content,
          score: Number(r.rank ?? 0),
          tokens: r.tokens,
          documentFilename: r.documentFilename,
          documentSourceType: r.documentSourceType,
          metadata: r.metadata ?? {},
        }));
      } catch {
        // FTS not available, skip
      }
    }

    const combined = new Map<string, SearchResult>();

    for (const r of vectorResults) {
      combined.set(r.chunkId, { ...r, score: r.score * vectorWeight });
    }

    for (const r of ftsResults) {
      const existing = combined.get(r.chunkId);
      if (existing) {
        existing.score += r.score * ftsWeight;
      } else {
        combined.set(r.chunkId, { ...r, score: r.score * ftsWeight });
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5));
  }
}

export const vectorSearchService = new VectorSearchService();

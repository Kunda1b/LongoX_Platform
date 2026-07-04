import { db, ragChunksTable, ragDocumentsTable } from "@longox/db";
import { eq, sql } from "drizzle-orm";
import { EmbeddingService, embeddingService } from "./embedding.service";

export interface SearchResult {
  chunkId: number;
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
    kbId: number,
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
    kbId: number,
    queryVector: number[],
    topK: number,
    minScore: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    const vectorLit = `[${queryVector.join(",")}]`;

    let whereClause = sql`rc.knowledge_base_id = ${kbId}`;

    if (filter && Object.keys(filter).length > 0) {
      for (const [key, value] of Object.entries(filter)) {
        whereClause = sql`${whereClause} AND rc.metadata->>${key} = ${String(value)}`;
      }
    }

    const query = sql`
      SELECT
        rc.id AS "chunkId",
        rc.document_id AS "documentId",
        rc.chunk_index AS "chunkIndex",
        rc.content,
        rc.tokens,
        rc.metadata,
        rd.filename AS "documentFilename",
        rd.source_type AS "documentSourceType",
        1 - (rc.embedding <=> ${sql.raw(`'${vectorLit}'::vector`)}) AS score
      FROM rag_chunks rc
      INNER JOIN rag_documents rd ON rc.document_id = rd.id
      WHERE ${whereClause}
      ORDER BY rc.embedding <=> ${sql.raw(`'${vectorLit}'::vector`)}
      LIMIT ${topK}
    `;

    const result = await db.execute(query);
    const rows = result.rows ?? [];

    return rows
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
    kbId: number,
    queryVector: number[],
    topK: number,
    minScore: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    const rows = (await db
      .select({
        chunkId: ragChunksTable.id,
        documentId: ragChunksTable.documentId,
        chunkIndex: ragChunksTable.chunkIndex,
        content: ragChunksTable.content,
        tokens: ragChunksTable.tokens,
        metadata: ragChunksTable.metadata,
        embedding: ragChunksTable.embedding,
        documentFilename: ragDocumentsTable.filename,
        documentSourceType: ragDocumentsTable.sourceType,
      })
      .from(ragChunksTable)
      .innerJoin(
        ragDocumentsTable,
        eq(ragChunksTable.documentId, ragDocumentsTable.id),
      )
      .where(eq(ragChunksTable.knowledgeBaseId, kbId))) as any;

    const scored: SearchResult[] = [];

    for (const row of rows) {
      const emb = row.embedding;
      if (!emb || !Array.isArray(emb)) continue;
      const score = this.embedding.cosineSimilarity(
        queryVector,
        emb as unknown as number[],
      );
      if (score < minScore) continue;

      if (filter && Object.keys(filter).length > 0) {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (meta[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      scored.push({
        chunkId: row.chunkId,
        documentId: row.documentId,
        chunkIndex: row.chunkIndex,
        content: row.content,
        score,
        tokens: row.tokens,
        documentFilename: row.documentFilename,
        documentSourceType: row.documentSourceType,
        metadata: row.metadata ?? {},
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async hybridSearch(
    kbId: number,
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
        const ftsRows = (await db
          .select({
            chunkId: ragChunksTable.id,
            documentId: ragChunksTable.documentId,
            chunkIndex: ragChunksTable.chunkIndex,
            content: ragChunksTable.content,
            tokens: ragChunksTable.tokens,
            metadata: ragChunksTable.metadata,
            documentFilename: ragDocumentsTable.filename,
            documentSourceType: ragDocumentsTable.sourceType,
            rank: sql<number>`ts_rank(to_tsvector('english', ${ragChunksTable.content}), plainto_tsquery('english', ${query}))`,
          })
          .from(ragChunksTable)
          .innerJoin(
            ragDocumentsTable,
            eq(ragChunksTable.documentId, ragDocumentsTable.id),
          )
          .where(
            sql`${ragChunksTable.knowledgeBaseId} = ${kbId} AND to_tsvector('english', ${ragChunksTable.content}) @@ plainto_tsquery('english', ${query})`,
          )
          .orderBy(
            sql`ts_rank(to_tsvector('english', ${ragChunksTable.content}), plainto_tsquery('english', ${query})) DESC`,
          )
          .limit(
            (options.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5)) * 2,
          )) as any;

        ftsResults = ftsRows.map((r: any) => ({
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

    const combined = new Map<number, SearchResult>();

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

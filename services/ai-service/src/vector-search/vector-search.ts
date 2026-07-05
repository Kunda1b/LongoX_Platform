/**
 * Vector search.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.$queryRaw` / `prisma.$executeRaw` for pgvector queries and
 * `prisma.vectorEmbedding` delegate with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { embeddingService } from "../embeddings/embedding-service";

export interface IndexedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

/**
 * Lightweight document shape returned by search queries. Doesn't include the
 * embedding vector (search results don't need it — the vector is only used
 * for similarity computation, which happens in the database).
 */
export interface SearchResultDoc {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export class VectorSearch {
  async index(
    id: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const { vector } = await embeddingService.generateEmbedding(content);
    const vectorLit = `[${vector.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO rag_chunks (document_id, knowledge_base_id, chunk_index, content, embedding, tokens, metadata)
       VALUES (0, 0, $1, $2, '${vectorLit}'::vector, 0, $3::jsonb)`,
      Number(id),
      content,
      JSON.stringify(metadata),
    );
  }

  async search(
    query: string,
    topK: number = Number(process.env.RAG_DEFAULT_TOP_K ?? 5),
    filter?: (doc: SearchResultDoc) => boolean,
  ): Promise<
    Array<{
      id: string;
      content: string;
      metadata: Record<string, unknown>;
      score: number;
    }>
  > {
    const { vector: queryVector } =
      await embeddingService.generateEmbedding(query);

    const vectorLit = `[${queryVector.join(",")}]`;

    const result = (await prisma.$queryRawUnsafe(
      `
      SELECT
        rc.id,
        rc.content,
        rc.metadata,
        1 - (rc.embedding <=> '${vectorLit}'::vector) AS score
      FROM rag_chunks rc
      WHERE rc.embedding IS NOT NULL
      ORDER BY rc.embedding <=> '${vectorLit}'::vector
      LIMIT $1
      `,
      topK,
    )) as any[];

    const rows = result ?? [];

    let candidates = rows.map((r: any) => ({
      id: String(r.id),
      content: r.content,
      metadata: r.metadata ?? {},
      score: r.score,
    }));

    if (filter) {
      candidates = candidates.filter(filter);
    }

    return candidates.slice(0, topK);
  }

  async delete(id: string): Promise<void> {
    await prisma.vectorEmbedding.deleteMany({
      where: { chunkIndex: Number(id) } as any,
    });
  }

  async clear(): Promise<void> {
    await prisma.vectorEmbedding.deleteMany({});
  }

  async size(): Promise<number> {
    return await prisma.vectorEmbedding.count();
  }
}

export const vectorSearch = new VectorSearch();

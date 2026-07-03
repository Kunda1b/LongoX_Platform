import { db, ragChunksTable } from "@longox/db";
import { sql, eq, isNotNull } from "drizzle-orm";
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

    await db.execute(sql`
      INSERT INTO rag_chunks (document_id, knowledge_base_id, chunk_index, content, embedding, tokens, metadata)
      VALUES (0, 0, ${sql.raw(id)}, ${content}, ${sql.raw(`'${vectorLit}'::vector`)}, 0, ${sql.raw(JSON.stringify(metadata))}::jsonb)
    `);
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

    const result = await db.execute(sql`
      SELECT
        rc.id,
        rc.content,
        rc.metadata,
        1 - (rc.embedding <=> ${sql.raw(`'${vectorLit}'::vector`)}) AS score
      FROM ${ragChunksTable} rc
      WHERE rc.embedding IS NOT NULL
      ORDER BY rc.embedding <=> ${sql.raw(`'${vectorLit}'::vector`)}
      LIMIT ${topK}
    `);

    const rows = result.rows ?? [];

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
    await db
      .delete(ragChunksTable)
      .where(eq(ragChunksTable.chunkIndex, sql.raw(id) as any));
  }

  async clear(): Promise<void> {
    await db.delete(ragChunksTable);
  }

  async size(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ragChunksTable);
    return result[0]?.count ?? 0;
  }
}

export const vectorSearch = new VectorSearch();

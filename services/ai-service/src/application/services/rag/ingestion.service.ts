/**
 * Document ingestion service.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.knowledgeBase`, `prisma.knowledgeDocument`, and
 * `prisma.vectorEmbedding` delegates with `as any` casts for legacy columns.
 */

import { prisma } from "@longox/db/prisma";
import { ChunkingService, chunkingService } from "./chunking.service";
import { EmbeddingService, embeddingService } from "./embedding.service";

export interface DocumentInput {
  filename: string;
  content: string;
  sourceType: "upload" | "web" | "api" | "manual";
  contentType?: string;
}

export interface DocumentResult {
  documentId: string;
  chunkCount: number;
  status: string;
}

export class DocumentIngestionService {
  constructor(
    private chunking: ChunkingService = chunkingService,
    private embedding: EmbeddingService = embeddingService,
  ) {}

  async ingestDocument(
    kbId: string,
    data: DocumentInput,
  ): Promise<DocumentResult> {
    const contentHash = this.hashContent(data.content);

    const doc = await prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: kbId,
        filename: data.filename,
        sourceType: data.sourceType,
        contentType: data.contentType ?? null,
        contentHash,
        status: "indexing",
        metadata: {},
      } as any,
    });

    const docId = (doc as any).id;

    try {
      const kb = await prisma.knowledgeBase.findUnique({
        where: { id: kbId } as any,
      });

      const chunks = await this.chunking.chunkDocument(
        data.content,
        ((kb as any)?.chunkStrategy ?? "recursive") as any,
        (kb as any)?.chunkSize ?? 512,
        (kb as any)?.chunkOverlap ?? 64,
      );

      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await this.embedding.generateEmbeddings(chunkTexts);

      if (chunks.length > 0) {
        // VectorEmbedding has an `Unsupported("vector(1536)")` field, so
        // Prisma Client does not expose `create`/`createMany` for this model.
        // Use a parameterized multi-row raw INSERT to write embeddings.
        const valuesSql: string[] = [];
        const params: unknown[] = [];
        chunks.forEach((chunk, i) => {
          const vec = embeddings[i]?.vector;
          const vectorLit = vec ? `'[${vec.join(",")}]'::vector` : "NULL";
          const base = params.length;
          valuesSql.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, ${vectorLit}, $${base + 5}, $${base + 6}::jsonb)`,
          );
          params.push(
            docId,
            kbId,
            chunk.index,
            chunk.content,
            chunk.tokens,
            "{}",
          );
        });
        await prisma.$executeRawUnsafe(
          `INSERT INTO rag_chunks (document_id, knowledge_base_id, chunk_index, content, embedding, tokens, metadata)
           VALUES ${valuesSql.join(", ")}`,
          ...params,
        );
      }

      await prisma.knowledgeDocument.update({
        where: { id: docId } as any,
        data: { status: "indexed", pageCount: chunks.length } as any,
      });

      const chunkCount = await prisma.vectorEmbedding.count({
        where: { documentId: docId } as any,
      });

      const docCount = await prisma.vectorEmbedding.count({
        where: { knowledgeBaseId: kbId } as any,
      });

      await prisma.knowledgeBase.update({
        where: { id: kbId } as any,
        data: { status: "active", documentCount: docCount } as any,
      });

      return { documentId: docId, chunkCount, status: "indexed" };
    } catch (err) {
      await prisma.knowledgeDocument.update({
        where: { id: docId } as any,
        data: { status: "error", errorMessage: String(err) } as any,
      });

      await prisma.knowledgeBase.update({
        where: { id: kbId } as any,
        data: { status: "error" } as any,
      });

      return { documentId: docId, chunkCount: 0, status: "error" };
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id: docId } as any,
    });

    if (!doc) return;

    await prisma.vectorEmbedding.deleteMany({
      where: { documentId: docId } as any,
    });
    await prisma.knowledgeDocument.delete({
      where: { id: docId } as any,
    });

    const count = await prisma.vectorEmbedding.count({
      where: { knowledgeBaseId: (doc as any).knowledgeBaseId } as any,
    });

    await prisma.knowledgeBase.update({
      where: { id: (doc as any).knowledgeBaseId } as any,
      data: { documentCount: count } as any,
    });
  }

  async reindexDocument(docId: string): Promise<DocumentResult> {
    const doc = await prisma.knowledgeDocument.findUnique({
      where: { id: docId } as any,
    });

    if (!doc) throw new Error(`Document ${docId} not found`);

    const chunks = await prisma.vectorEmbedding.findMany({
      where: { documentId: docId } as any,
      orderBy: { chunkIndex: "asc" } as any,
    });

    if (chunks.length === 0) {
      throw new Error(`Document ${docId} has no chunks to reindex`);
    }

    const fullContent = chunks.map((c: any) => c.content).join("\n\n");

    await prisma.vectorEmbedding.deleteMany({
      where: { documentId: docId } as any,
    });

    return this.ingestDocument((doc as any).knowledgeBaseId, {
      filename: (doc as any).filename,
      content: fullContent,
      sourceType: (doc as any).sourceType as DocumentInput["sourceType"],
      contentType: (doc as any).contentType ?? undefined,
    });
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const documentIngestionService = new DocumentIngestionService();

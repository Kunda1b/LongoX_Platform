import { db, ragDocumentsTable, ragChunksTable, ragKnowledgeBasesTable } from "@longox/db";
import { eq, sql } from "drizzle-orm";
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

  async ingestDocument(kbId: string, data: DocumentInput): Promise<DocumentResult> {
    const contentHash = this.hashContent(data.content);

    const [doc] = await db.insert(ragDocumentsTable).values({
      knowledgeBaseId: kbId,
      filename: data.filename,
      sourceType: data.sourceType,
      contentType: data.contentType ?? null,
      contentHash,
      status: "indexing",
      metadata: {},
    }).returning();

    const docId = doc.id;

    try {
      const kb = await db
        .select({ chunkSize: ragKnowledgeBasesTable.chunkSize, chunkOverlap: ragKnowledgeBasesTable.chunkOverlap, chunkStrategy: ragKnowledgeBasesTable.chunkStrategy })
        .from(ragKnowledgeBasesTable)
        .where(eq(ragKnowledgeBasesTable.id, kbId))
        .then((r) => r[0]);

      const chunks = await this.chunking.chunkDocument(
        data.content,
        kb?.chunkStrategy ?? "recursive",
        kb?.chunkSize ?? 512,
        kb?.chunkOverlap ?? 64,
      );

      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await this.embedding.generateEmbeddings(chunkTexts);

      if (chunks.length > 0) {
        await db.insert(ragChunksTable).values(
          chunks.map((chunk, i) => ({
            documentId: docId,
            knowledgeBaseId: kbId,
            chunkIndex: chunk.index,
            content: chunk.content,
            embedding: embeddings[i]?.vector ?? null,
            tokens: chunk.tokens,
            metadata: {},
          })),
        );
      }

      await db
        .update(ragDocumentsTable)
        .set({ status: "indexed", pageCount: chunks.length })
        .where(eq(ragDocumentsTable.id, docId));

      const [{ count: chunkCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ragChunksTable)
        .where(eq(ragChunksTable.documentId, docId));

      const [{ docCount }] = await db
        .select({ docCount: sql<number>`count(*)::int` })
        .from(ragChunksTable)
        .where(eq(ragChunksTable.knowledgeBaseId, kbId));

      await db
        .update(ragKnowledgeBasesTable)
        .set({ status: "active", documentCount: docCount })
        .where(eq(ragKnowledgeBasesTable.id, kbId));

      return { documentId: docId, chunkCount, status: "indexed" };
    } catch (err) {
      await db
        .update(ragDocumentsTable)
        .set({ status: "error", errorMessage: String(err) })
        .where(eq(ragDocumentsTable.id, docId));

      await db
        .update(ragKnowledgeBasesTable)
        .set({ status: "error" })
        .where(eq(ragKnowledgeBasesTable.id, kbId));

      return { documentId: docId, chunkCount: 0, status: "error" };
    }
  }

  async deleteDocument(docId: string): Promise<void> {
    const doc = await db
      .select({ knowledgeBaseId: ragDocumentsTable.knowledgeBaseId })
      .from(ragDocumentsTable)
      .where(eq(ragDocumentsTable.id, docId))
      .then((r) => r[0]);

    if (!doc) return;

    await db.delete(ragChunksTable).where(eq(ragChunksTable.documentId, docId));
    await db.delete(ragDocumentsTable).where(eq(ragDocumentsTable.id, docId));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ragChunksTable)
      .where(eq(ragChunksTable.knowledgeBaseId, doc.knowledgeBaseId));

    await db
      .update(ragKnowledgeBasesTable)
      .set({ documentCount: count })
      .where(eq(ragKnowledgeBasesTable.id, doc.knowledgeBaseId));
  }

  async reindexDocument(docId: string): Promise<DocumentResult> {
    const doc = await db
      .select({
        id: ragDocumentsTable.id,
        knowledgeBaseId: ragDocumentsTable.knowledgeBaseId,
        filename: ragDocumentsTable.filename,
        contentType: ragDocumentsTable.contentType,
        sourceType: ragDocumentsTable.sourceType,
      })
      .from(ragDocumentsTable)
      .where(eq(ragDocumentsTable.id, docId))
      .then((r) => r[0]);

    if (!doc) throw new Error(`Document ${docId} not found`);

    const chunks = await db
      .select({ content: ragChunksTable.content })
      .from(ragChunksTable)
      .where(eq(ragChunksTable.documentId, docId))
      .orderBy(ragChunksTable.chunkIndex);

    if (chunks.length === 0) {
      throw new Error(`Document ${docId} has no chunks to reindex`);
    }

    const fullContent = chunks.map((c) => c.content).join("\n\n");

    await db.delete(ragChunksTable).where(eq(ragChunksTable.documentId, docId));

    return this.ingestDocument(doc.knowledgeBaseId, {
      filename: doc.filename,
      content: fullContent,
      sourceType: doc.sourceType as DocumentInput["sourceType"],
      contentType: doc.contentType ?? undefined,
    });
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const documentIngestionService = new DocumentIngestionService();

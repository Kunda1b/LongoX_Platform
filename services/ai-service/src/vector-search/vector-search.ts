import { embeddingService } from "../embeddings/embedding-service";

interface IndexedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export class VectorSearch {
  private documents: IndexedDocument[] = [];
  private dimensions: number = 1536;

  async index(
    id: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const { vector } = await embeddingService.generateEmbedding(content);
    this.documents.push({ id, content, metadata, embedding: vector });
  }

  async search(
    query: string,
    topK: number = 10,
    filter?: (doc: IndexedDocument) => boolean,
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

    let candidates = this.documents;

    if (filter) {
      candidates = candidates.filter(filter);
    }

    const scored = candidates.map((doc) => ({
      ...doc,
      score: embeddingService.cosineSimilarity(queryVector, doc.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(({ embedding: _, ...rest }) => rest);
  }

  async delete(id: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
  }

  async clear(): Promise<void> {
    this.documents = [];
  }

  get size(): number {
    return this.documents.length;
  }
}

export const vectorSearch = new VectorSearch();

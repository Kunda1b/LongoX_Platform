import {
  VectorSearchService,
  vectorSearchService,
} from "./vector-search.service";

export interface RagNodeInput {
  query: string;
  knowledgeBaseId: number;
  topK?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
}

export interface RagNodeResult {
  query: string;
  results: Array<{
    chunkId: number;
    documentId: number;
    content: string;
    score: number;
    documentFilename: string;
    documentSourceType: string;
    metadata: Record<string, unknown>;
  }>;
  totalResults: number;
}

export class RagNodeExecutor {
  constructor(private search: VectorSearchService = vectorSearchService) {}

  async execute(input: RagNodeInput): Promise<RagNodeResult> {
    const results = await this.search.search(
      input.knowledgeBaseId,
      input.query,
      {
        topK: input.topK ?? Number(process.env.RAG_DEFAULT_TOP_K ?? 5),
        minScore: input.minScore ?? 0.0,
        filter: input.filter,
      },
    );

    return {
      query: input.query,
      results: results.map((r) => ({
        chunkId: r.chunkId,
        documentId: r.documentId,
        content: r.content,
        score: r.score,
        documentFilename: r.documentFilename,
        documentSourceType: r.documentSourceType,
        metadata: r.metadata,
      })),
      totalResults: results.length,
    };
  }
}

export const ragNodeExecutor = new RagNodeExecutor();

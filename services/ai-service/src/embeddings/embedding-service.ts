import { OpenAIProvider } from "../providers";

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
}

export class EmbeddingService {
  private openai: OpenAIProvider;

  constructor() {
    this.openai = new OpenAIProvider({
      apiKey:
        process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
        process.env.OPENAI_API_KEY ??
        "",
    });
  }

  async generateEmbedding(
    text: string,
    model: string = "text-embedding-3-small",
  ): Promise<EmbeddingResult> {
    const vector = await this.openai.generateEmbedding(text, model);

    return {
      vector,
      dimensions: vector.length,
      model,
    };
  }

  async generateEmbeddings(
    texts: string[],
    model: string = "text-embedding-3-small",
  ): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (const text of texts) {
      const result = await this.generateEmbedding(text, model);
      results.push(result);
    }

    return results;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}

export const embeddingService = new EmbeddingService();

import { OpenAIProvider } from "../../../providers";

export interface EmbeddingResult {
  vector: number[];
  model: string;
}

export class EmbeddingService {
  private openai: OpenAIProvider;
  private useMock: boolean;

  constructor() {
    this.useMock = !process.env.OPENAI_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!this.useMock) {
      this.openai = new OpenAIProvider({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
      });
    }
  }

  async generateEmbedding(text: string, model: string = "text-embedding-3-small"): Promise<EmbeddingResult> {
    if (this.useMock) {
      return { vector: this.mockEmbedding(text), model };
    }
    const vector = await this.openai.generateEmbedding(text, model);
    return { vector, model };
  }

  async generateEmbeddings(texts: string[], model: string = "text-embedding-3-small"): Promise<EmbeddingResult[]> {
    if (this.useMock) {
      return texts.map((t) => ({ vector: this.mockEmbedding(t), model }));
    }
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      const result = await this.generateEmbedding(text, model);
      results.push(result);
    }
    return results;
  }

  private mockEmbedding(text: string): number[] {
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed) + text.charCodeAt(i);
      seed |= 0;
    }
    const vector: number[] = [];
    for (let i = 0; i < 1536; i++) {
      const val = Math.sin(seed + i * 0.1) * 0.5 + Math.cos(seed * 0.3 + i * 0.05) * 0.3;
      vector.push(parseFloat(val.toFixed(6)));
    }
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vector.map((v) => v / norm) : vector;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag === 0 ? 0 : dot / mag;
  }
}

export const embeddingService = new EmbeddingService();

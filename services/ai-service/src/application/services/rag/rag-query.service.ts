import { VectorSearchService, vectorSearchService, type SearchResult, type SearchOptions } from "./vector-search.service";
import { CitationService, citationService, type Source } from "./citation.service";
import { TokenAccountingService, tokenAccountingService } from "../token-accounting.service";
import { OpenAIProvider } from "../../../providers";

export interface RagQueryOptions extends SearchOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  citationFormat?: string;
  includeSources?: boolean;
}

export interface RagQueryResult {
  answer: string;
  sources: Source[];
  citations: string;
  chunks: SearchResult[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    model: string;
  };
}

export class RagQueryService {
  constructor(
    private vectorSearch: VectorSearchService = vectorSearchService,
    private citation: CitationService = citationService,
    private accounting: TokenAccountingService = tokenAccountingService,
  ) {}

  async query(kbId: number, question: string, options: RagQueryOptions = {}): Promise<RagQueryResult> {
    const model = options.model ?? "gpt-4o-mini";
    const maxTokens = options.maxTokens ?? 1024;
    const temperature = options.temperature ?? 0.3;
    const citationFormat = options.citationFormat ?? "numbered";

    const chunks = await this.vectorSearch.search(kbId, question, {
      topK: options.topK ?? 5,
      minScore: options.minScore ?? 0.0,
      filter: options.filter,
    });

    const context = chunks.map((c, i) => `[Source ${i + 1}] ${c.content}`).join("\n\n");

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. \
Answer concisely and accurately using only the information from the context. \
If the context does not contain enough information to answer, say so. \
Cite your sources using [Source N] notation.`;

    const userPrompt = `Context:\n${context}\n\nQuestion: ${question}`;

    const openai = new OpenAIProvider({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    });

    let answer: string;
    let inputTokens: number;
    let outputTokens: number;
    let cost: number;

    if (!process.env.OPENAI_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      answer = this.mockAnswer(question, chunks);
      inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
      outputTokens = Math.ceil(answer.length / 4);
      cost = 0;
    } else {
      const result = await openai.chatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        { model, maxTokens, temperature },
      );
      answer = result.content;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
      cost = result.cost;
    }

    const sources = this.citation.extractSources(answer, chunks);
    const formattedCitations = this.citation.formatCitations(chunks, citationFormat);

    await this.accounting.recordUsage({
      modelName: model,
      provider: "openai",
      inputTokens,
      outputTokens,
      cost,
    });

    return {
      answer,
      sources,
      citations: formattedCitations,
      chunks,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost,
        model,
      },
    };
  }

  private mockAnswer(question: string, chunks: SearchResult[]): string {
    const topChunks = chunks.slice(0, 3);
    if (topChunks.length === 0) {
      return "I could not find any relevant information to answer your question.";
    }
    const excerpt = topChunks.map((c, i) => `[Source ${i + 1}] ${c.content.substring(0, 200)}`).join("\n");
    return `Based on the retrieved documents, here is what I found regarding "${question}":\n\n${excerpt}\n\nThis answer was generated from ${chunks.length} relevant passages across ${new Set(chunks.map(c => c.documentFilename)).size} document(s).`;
  }
}

export const ragQueryService = new RagQueryService();

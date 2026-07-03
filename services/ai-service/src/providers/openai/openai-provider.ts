import OpenAI from "openai";

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0000025, output: 0.00001 },
  "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
  "gpt-4-turbo": { input: 0.00001, output: 0.00003 },
  "gpt-3.5-turbo": { input: 0.0000005, output: 0.0000015 },
};

export class OpenAIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.defaultModel = config.defaultModel ?? "gpt-4o-mini";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      response_format:
        options.responseFormat === "json" ? { type: "json_object" } : undefined,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    const pricing = MODEL_PRICING[model] ?? {
      input: 0.000001,
      output: 0.000002,
    };
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;

    return { content, model, inputTokens, outputTokens, cost };
  }

  async generateJSON<T>(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<{
    data: T;
    usage: { inputTokens: number; outputTokens: number; cost: number };
  }> {
    const result = await this.chatCompletion(messages, {
      ...options,
      responseFormat: "json",
    });

    let data: T;
    try {
      data = JSON.parse(result.content) as T;
    } catch {
      data = { raw: result.content } as unknown as T;
    }

    return {
      data,
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: result.cost,
      },
    };
  }

  async generateEmbedding(
    text: string,
    model: string = "text-embedding-3-small",
  ): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model,
      input: text,
    });

    return response.data[0]?.embedding ?? [];
  }

  /**
   * Stream a chat completion token-by-token via the OpenAI streaming API.
   *
   * Per ADR-008, AI streaming responses use Server-Sent Events with
   * `text/event-stream`. The SSE route at `/api/v1/ai/runs` consumes
   * this async generator and emits one `token` SSE event per yielded chunk.
   *
   * Yields `{ token, role? }` chunks; the final `done` event includes the
   * full content + usage. The generator completes when the stream ends.
   *
   * Per architecture.md §8.5, partial responses should be persisted every
   * ~1 second so a dropped connection can resume from the last partial.
   * The caller (the SSE route) is responsible for the partial persistence
   * cadence — this method just yields tokens as they arrive from the
   * provider.
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): AsyncGenerator<{
    token: string;
    role?: string;
    usage?: { inputTokens: number; outputTokens: number; cost: number };
  }> {
    const model = options.model ?? this.defaultModel;

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      response_format:
        options.responseFormat === "json" ? { type: "json_object" } : undefined,
      stream: true,
      stream_options: { include_usage: true },
    });

    let inputTokens = 0;
    let outputTokens = 0;
    const pricing = MODEL_PRICING[model] ?? {
      input: 0.000001,
      output: 0.000002,
    };

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { token: delta.content, role: delta.role };
      }
      // OpenAI sends a final chunk with usage when stream_options.include_usage is true.
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    // Yield the final usage so the caller can persist the canonical record.
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;
    yield {
      token: "",
      usage: { inputTokens, outputTokens, cost },
    };
  }
}

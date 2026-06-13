import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../openai";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "llama-3.3-70b-versatile": { input: 0.00000059, output: 0.00000079 },
  "llama-3.1-8b-instant": { input: 0.00000005, output: 0.00000008 },
  "mixtral-8x7b-32768": { input: 0.00000024, output: 0.00000024 },
  "gemma2-9b-it": { input: 0.0000002, output: 0.0000002 },
};

export class GroqProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "llama-3.3-70b-versatile";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;

    const pricing = MODEL_PRICING[model] ?? {
      input: 0.00000059,
      output: 0.00000079,
    };
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;

    return { content, model, inputTokens, outputTokens, cost };
  }
}

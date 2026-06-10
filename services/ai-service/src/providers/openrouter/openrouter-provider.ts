import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../openai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "openai/gpt-4o-mini";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.APP_URL ?? "https://longox.io",
        "X-Title": "Flow Builder Nexus",
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

    return { content, model, inputTokens, outputTokens, cost: 0 };
  }
}

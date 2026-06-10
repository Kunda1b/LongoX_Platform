import type { ChatMessage, ChatCompletionOptions, ChatCompletionResult } from "../openai";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "deepseek-chat": { input: 0.00000014, output: 0.00000028 },
  "deepseek-reasoner": { input: 0.00000055, output: 0.00000219 },
};

export class DeepSeekProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "deepseek-chat";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const response = await fetch(DEEPSEEK_API_URL, {
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

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;

    const pricing = MODEL_PRICING[model] ?? { input: 0.00000014, output: 0.00000028 };
    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

    return { content, model, inputTokens, outputTokens, cost };
  }
}

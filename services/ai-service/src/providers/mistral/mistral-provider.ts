import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../openai";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "mistral-large-latest": { input: 0.000002, output: 0.000006 },
  "mistral-medium-latest": { input: 0.0000027, output: 0.0000081 },
  "mistral-small-latest": { input: 0.000001, output: 0.000003 },
  "open-mistral-nemo": { input: 0.0000003, output: 0.0000003 },
};

export class MistralProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "mistral-large-latest";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const response = await fetch(MISTRAL_API_URL, {
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
      input: 0.000002,
      output: 0.000006,
    };
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;

    return { content, model, inputTokens, outputTokens, cost };
  }
}

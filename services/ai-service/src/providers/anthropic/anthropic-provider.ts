import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../openai";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 0.000003, output: 0.000015 },
  "claude-3-5-sonnet-20241022": { input: 0.000003, output: 0.000015 },
  "claude-3-haiku-20240307": { input: 0.00000025, output: 0.00000125 },
  "claude-opus-4-20250514": { input: 0.000015, output: 0.000075 },
};

export class AnthropicProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "claude-sonnet-4-20250514";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemMessage?.content,
        messages: conversationMessages,
        max_tokens: options.maxTokens ?? 2048,
      }),
    });

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const content = data.content?.[0]?.text ?? "";
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    const pricing = MODEL_PRICING[model] ?? {
      input: 0.000003,
      output: 0.000015,
    };
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;

    return { content, model, inputTokens, outputTokens, cost };
  }
}

import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../openai";

const GOOGLE_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.0000001, output: 0.0000004 },
  "gemini-2.0-pro": { input: 0.000002, output: 0.000005 },
  "gemini-1.5-pro": { input: 0.00000125, output: 0.000005 },
  "gemini-1.5-flash": { input: 0.000000075, output: 0.0000003 },
};

export class GoogleProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(config: { apiKey: string; defaultModel?: string }) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? "gemini-2.0-flash";
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${GOOGLE_API_URL}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: options.maxTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
          },
        }),
      },
    );

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
      };
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

    const pricing = MODEL_PRICING[model] ?? {
      input: 0.0000001,
      output: 0.0000004,
    };
    const cost = inputTokens * pricing.input + outputTokens * pricing.output;

    return { content, model, inputTokens, outputTokens, cost };
  }
}

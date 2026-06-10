import { OpenAIProvider, AnthropicProvider, GoogleProvider, DeepSeekProvider, OpenRouterProvider } from "../providers";
import type { ChatMessage, ChatCompletionOptions, ChatCompletionResult } from "../providers";

export type AIProviderType = "openai" | "anthropic" | "google" | "deepseek" | "openrouter";

interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  defaultModel: string;
  priority: number;
  weight: number;
}

export class AIRouter {
  private providers = new Map<AIProviderType, {
    client: OpenAIProvider | AnthropicProvider | GoogleProvider | DeepSeekProvider | OpenRouterProvider;
    config: ProviderConfig;
  }>();

  constructor(configs: ProviderConfig[]) {
    for (const cfg of configs) {
      const client = this.createProvider(cfg.type, cfg.apiKey, cfg.defaultModel);
      this.providers.set(cfg.type, { client, config: cfg });
    }
  }

  private createProvider(
    type: AIProviderType,
    apiKey: string,
    defaultModel: string,
  ): OpenAIProvider | AnthropicProvider | GoogleProvider | DeepSeekProvider | OpenRouterProvider {
    switch (type) {
      case "openai": return new OpenAIProvider({ apiKey, defaultModel });
      case "anthropic": return new AnthropicProvider({ apiKey, defaultModel });
      case "google": return new GoogleProvider({ apiKey, defaultModel });
      case "deepseek": return new DeepSeekProvider({ apiKey, defaultModel });
      case "openrouter": return new OpenRouterProvider({ apiKey, defaultModel });
    }
  }

  async route(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<{ provider: AIProviderType; result: ChatCompletionResult }> {
    const sorted = Array.from(this.providers.entries())
      .sort(([, a], [, b]) => b.config.priority - a.config.priority);

    const errors: Error[] = [];

    for (const [type, { client, config }] of sorted) {
      try {
        const result = await client.chatCompletion(messages, {
          ...options,
          model: options.model ?? config.defaultModel,
        });
        return { provider: type, result };
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
        continue;
      }
    }

    throw new AggregateError(
      errors,
      `All AI providers failed: ${errors.map((e) => e.message).join("; ")}`,
    );
  }

  getProvider(type: AIProviderType): OpenAIProvider | AnthropicProvider | GoogleProvider | DeepSeekProvider | OpenRouterProvider | undefined {
    return this.providers.get(type)?.client;
  }

  listProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }
}

const defaultConfigs: ProviderConfig[] = [
  { type: "openai", apiKey: process.env.OPENAI_API_KEY ?? "", defaultModel: "gpt-4o-mini", priority: 100, weight: 1 },
  { type: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY ?? "", defaultModel: "claude-sonnet-4-20250514", priority: 90, weight: 1 },
  { type: "google", apiKey: process.env.GOOGLE_API_KEY ?? "", defaultModel: "gemini-2.0-flash", priority: 80, weight: 1 },
  { type: "deepseek", apiKey: process.env.DEEPSEEK_API_KEY ?? "", defaultModel: "deepseek-chat", priority: 70, weight: 1 },
  { type: "openrouter", apiKey: process.env.OPENROUTER_API_KEY ?? "", defaultModel: "openai/gpt-4o-mini", priority: 60, weight: 1 },
];

export const aiRouter = new AIRouter(defaultConfigs.filter((c) => c.apiKey));

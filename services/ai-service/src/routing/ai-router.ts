import {
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  DeepSeekProvider,
  OpenRouterProvider,
  MistralProvider,
  GroqProvider,
} from "../providers";
import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../providers";

export type AIProviderType =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "openrouter"
  | "mistral"
  | "groq";

export type RoutingStrategy =
  | "cheapest"
  | "fastest"
  | "highest_quality"
  | "custom";

interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  defaultModel: string;
  priority: number;
  weight: number;
  avgLatencyMs: number;
}

interface ProviderHealth {
  successRate: number;
  avgLatencyMs: number;
  lastError?: string;
  lastErrorAt?: number;
}

interface RoutingPolicy {
  strategy: RoutingStrategy;
  providerPreferences?: AIProviderType[];
  modelAllowlist?: string[];
  modelDenylist?: string[];
  fallbackEnabled: boolean;
  maxRetries: number;
}

type ProviderClient =
  | OpenAIProvider
  | AnthropicProvider
  | GoogleProvider
  | DeepSeekProvider
  | OpenRouterProvider
  | MistralProvider
  | GroqProvider;

const PROVIDER_QUALITY_RANK: Record<AIProviderType, number> = {
  openai: 100,
  anthropic: 95,
  google: 85,
  mistral: 80,
  deepseek: 75,
  groq: 70,
  openrouter: 60,
};

const PROVIDER_SPEED_RANK: Record<AIProviderType, number> = {
  groq: 100,
  openai: 85,
  google: 80,
  anthropic: 75,
  mistral: 70,
  deepseek: 65,
  openrouter: 60,
};

export class AIRouter {
  private providers = new Map<AIProviderType, {
    client: ProviderClient;
    config: ProviderConfig;
    health: ProviderHealth;
  }>();

  private defaultPolicy: RoutingPolicy = {
    strategy: "cheapest",
    fallbackEnabled: true,
    maxRetries: 2,
  };

  constructor(configs: ProviderConfig[]) {
    for (const cfg of configs) {
      const client = this.createProvider(cfg.type, cfg.apiKey, cfg.defaultModel);
      this.providers.set(cfg.type, {
        client,
        config: cfg,
        health: { successRate: 1, avgLatencyMs: cfg.avgLatencyMs },
      });
    }
  }

  private createProvider(type: AIProviderType, apiKey: string, defaultModel: string): ProviderClient {
    switch (type) {
      case "openai":
        return new OpenAIProvider({ apiKey, defaultModel });
      case "anthropic":
        return new AnthropicProvider({ apiKey, defaultModel });
      case "google":
        return new GoogleProvider({ apiKey, defaultModel });
      case "deepseek":
        return new DeepSeekProvider({ apiKey, defaultModel });
      case "openrouter":
        return new OpenRouterProvider({ apiKey, defaultModel });
      case "mistral":
        return new MistralProvider({ apiKey, defaultModel });
      case "groq":
        return new GroqProvider({ apiKey, defaultModel });
    }
  }

  private sortProviders(policy: RoutingPolicy): AIProviderType[] {
    const available = Array.from(this.providers.entries())
      .filter(([, p]) => p.config.apiKey)
      .filter(([, p]) => {
        if (policy.modelDenylist && policy.modelDenylist.length > 0) {
          return !policy.modelDenylist.includes(p.config.defaultModel);
        }
        return true;
      })
      .filter(([, p]) => {
        if (policy.modelAllowlist && policy.modelAllowlist.length > 0) {
          return policy.modelAllowlist.includes(p.config.defaultModel);
        }
        return true;
      });

    switch (policy.strategy) {
      case "cheapest":
        return available
          .sort(([, a], [, b]) => {
            const costA = this.estimateCost(a);
            const costB = this.estimateCost(b);
            return costA - costB;
          })
          .map(([type]) => type);

      case "fastest":
        return available
          .sort(([, a], [, b]) => {
            const speedA = PROVIDER_SPEED_RANK[a.type] * a.health.successRate;
            const speedB = PROVIDER_SPEED_RANK[b.type] * b.health.successRate;
            return speedB - speedA;
          })
          .map(([type]) => type);

      case "highest_quality":
        return available
          .sort(([, a], [, b]) => {
            const qualA = PROVIDER_QUALITY_RANK[a.type] * a.health.successRate;
            const qualB = PROVIDER_QUALITY_RANK[b.type] * b.health.successRate;
            return qualB - qualA;
          })
          .map(([type]) => type);

      case "custom":
        if (policy.providerPreferences && policy.providerPreferences.length > 0) {
          return policy.providerPreferences.filter((p) =>
            available.some(([type]) => type === p),
          );
        }
        return available.map(([type]) => type);

      default:
        return available.map(([type]) => type);
    }
  }

  private estimateCost(provider: { config: ProviderConfig; health: ProviderHealth }): number {
    const baseCost = 1 / (provider.config.priority + 1);
    const healthPenalty = 1 - provider.health.successRate;
    return baseCost * (1 + healthPenalty);
  }

  async route(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
    policy?: Partial<RoutingPolicy>,
  ): Promise<{ provider: AIProviderType; result: ChatCompletionResult }> {
    const effectivePolicy = { ...this.defaultPolicy, ...policy };
    const sorted = this.sortProviders(effectivePolicy);

    if (sorted.length === 0) {
      throw new Error("No AI providers available with the current policy");
    }

    const errors: Error[] = [];
    const maxAttempts = effectivePolicy.fallbackEnabled
      ? Math.min(effectivePolicy.maxRetries + 1, sorted.length)
      : 1;

    for (let i = 0; i < maxAttempts; i++) {
      const providerType = sorted[i];
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      const startedAt = Date.now();
      try {
        const result = await provider.client.chatCompletion(messages, {
          ...options,
          model: options.model ?? provider.config.defaultModel,
        });

        const latencyMs = Date.now() - startedAt;
        this.updateHealth(providerType, true, latencyMs);

        return { provider: providerType, result };
      } catch (err) {
        const latencyMs = Date.now() - startedAt;
        this.updateHealth(providerType, false, latencyMs);
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    throw new AggregateError(
      errors,
      `All AI providers failed: ${errors.map((e) => e.message).join("; ")}`,
    );
  }

  private updateHealth(type: AIProviderType, success: boolean, latencyMs: number): void {
    const provider = this.providers.get(type);
    if (!provider) return;

    const alpha = 0.3;
    provider.health.successRate =
      provider.health.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
    provider.health.avgLatencyMs =
      provider.health.avgLatencyMs * (1 - alpha) + latencyMs * alpha;

    if (!success) {
      provider.health.lastError = "Last call failed";
      provider.health.lastErrorAt = Date.now();
    }
  }

  getProvider(type: AIProviderType): ProviderClient | undefined {
    return this.providers.get(type)?.client;
  }

  listProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  getHealth(type: AIProviderType): ProviderHealth | undefined {
    return this.providers.get(type)?.health;
  }

  getAllHealth(): Record<AIProviderType, ProviderHealth> {
    const result = {} as Record<AIProviderType, ProviderHealth>;
    for (const [type, provider] of this.providers) {
      result[type] = provider.health;
    }
    return result;
  }
}

const defaultConfigs: ProviderConfig[] = [
  {
    type: "openai",
    apiKey: process.env.OPENAI_API_KEY ?? "",
    defaultModel: "gpt-4o-mini",
    priority: 100,
    weight: 1,
    avgLatencyMs: 800,
  },
  {
    type: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    defaultModel: "claude-sonnet-4-20250514",
    priority: 90,
    weight: 1,
    avgLatencyMs: 900,
  },
  {
    type: "google",
    apiKey: process.env.GOOGLE_API_KEY ?? "",
    defaultModel: "gemini-2.0-flash",
    priority: 80,
    weight: 1,
    avgLatencyMs: 700,
  },
  {
    type: "mistral",
    apiKey: process.env.MISTRAL_API_KEY ?? "",
    defaultModel: "mistral-large-latest",
    priority: 75,
    weight: 1,
    avgLatencyMs: 750,
  },
  {
    type: "groq",
    apiKey: process.env.GROQ_API_KEY ?? "",
    defaultModel: "llama-3.3-70b-versatile",
    priority: 85,
    weight: 1,
    avgLatencyMs: 300,
  },
  {
    type: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    defaultModel: "deepseek-chat",
    priority: 70,
    weight: 1,
    avgLatencyMs: 1000,
  },
  {
    type: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    defaultModel: "openai/gpt-4o-mini",
    priority: 60,
    weight: 1,
    avgLatencyMs: 1100,
  },
];

export const aiRouter = new AIRouter(defaultConfigs.filter((c) => c.apiKey));

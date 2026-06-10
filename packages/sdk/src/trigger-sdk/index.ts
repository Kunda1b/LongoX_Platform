import type { SdkConfig } from "../index.ts";

export interface TriggerConfig extends SdkConfig {}

export interface TriggerDefinition {
  id: string;
  name: string;
  type: "webhook" | "schedule" | "event" | "webhook_event";
  schedule?: string;
  event?: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface WebhookResult {
  url: string;
  secret: string;
  triggerId: string;
}

export class TriggerClient {
  private config: TriggerConfig;

  constructor(config: TriggerConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.token) h["Authorization"] = `Bearer ${this.config.token}`;
    if (this.config.apiKey) h["X-Api-Key"] = this.config.apiKey;
    return h;
  }

  async list(workflowId: string): Promise<TriggerDefinition[]> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/triggers`,
      {
        headers: this.headers(),
      },
    );
    if (!res.ok) throw new Error("Failed to list triggers");
    return res.json() as Promise<TriggerDefinition[]>;
  }

  async create(
    workflowId: string,
    trigger: Omit<TriggerDefinition, "id">,
  ): Promise<TriggerDefinition> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/triggers`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(trigger),
      },
    );
    if (!res.ok) throw new Error("Failed to create trigger");
    return res.json() as Promise<TriggerDefinition>;
  }

  async update(
    workflowId: string,
    triggerId: string,
    trigger: Partial<TriggerDefinition>,
  ): Promise<TriggerDefinition> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/triggers/${triggerId}`,
      {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify(trigger),
      },
    );
    if (!res.ok) throw new Error("Failed to update trigger");
    return res.json() as Promise<TriggerDefinition>;
  }

  async delete(workflowId: string, triggerId: string): Promise<void> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/triggers/${triggerId}`,
      {
        method: "DELETE",
        headers: this.headers(),
      },
    );
    if (!res.ok) throw new Error("Failed to delete trigger");
  }

  async createWebhook(
    workflowId: string,
    config?: Record<string, unknown>,
  ): Promise<WebhookResult> {
    const res = await fetch(
      `${this.config.baseUrl}/api/workflows/${workflowId}/webhooks`,
      {
        method: "POST",
        headers: this.headers(),
        body: config ? JSON.stringify({ config }) : undefined,
      },
    );
    if (!res.ok) throw new Error("Failed to create webhook");
    return res.json() as Promise<WebhookResult>;
  }
}

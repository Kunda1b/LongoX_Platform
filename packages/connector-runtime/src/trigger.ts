import type { TriggerContext, TriggerEvent } from "./types";
import { randomUUID } from "node:crypto";

export interface WebhookRegistration {
  connectorName: string;
  triggerId: string;
  path: string;
  handler: (payload: Record<string, unknown>) => Promise<TriggerEvent[]>;
}

class WebhookManager {
  private webhooks = new Map<string, WebhookRegistration>();

  register(registration: WebhookRegistration): void {
    this.webhooks.set(`${registration.connectorName}.${registration.triggerId}`, registration);
  }

  get(path: string): WebhookRegistration | undefined {
    for (const [, registration] of this.webhooks) {
      if (registration.path === path) return registration;
    }
    return undefined;
  }

  getByTriggerId(fullId: string): WebhookRegistration | undefined {
    return this.webhooks.get(fullId);
  }

  async handleWebhook(path: string, payload: Record<string, unknown>): Promise<TriggerEvent[]> {
    const registration = this.get(path);
    if (!registration) return [];
    return registration.handler(payload);
  }

  listRegistrations(): WebhookRegistration[] {
    return Array.from(this.webhooks.values());
  }
}

export const webhookManager = new WebhookManager();

export function createTriggerEvent(
  type: string,
  payload: Record<string, unknown>,
): TriggerEvent {
  return {
    id: randomUUID(),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export async function pollTrigger(
  context: TriggerContext,
  pollFn: () => Promise<Record<string, unknown>[]>,
  lastPollId?: string,
): Promise<TriggerEvent[]> {
  try {
    const items = await pollFn();
    const lastId = lastPollId ?? "";

    const newItems = lastId
      ? items.filter((item) => String(item.id ?? "") > lastId)
      : items.slice(0, 1);

    return newItems.map((item) => ({
      id: randomUUID(),
      type: context.triggerId,
      payload: item,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

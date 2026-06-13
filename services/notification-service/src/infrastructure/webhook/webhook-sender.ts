import type { WebhookChannelConfig } from "../../domain/channel/notification-channel.entity";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookResponse {
  success: boolean;
  statusCode: number;
  body?: string;
  error?: string;
}

export interface WebhookSender {
  send(config: WebhookChannelConfig, payload: WebhookPayload): Promise<WebhookResponse>;
}

export class HttpWebhookSender implements WebhookSender {
  async send(config: WebhookChannelConfig, payload: WebhookPayload): Promise<WebhookResponse> {
    const { url, method, headers = {} } = config;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      const body = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        body,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export function createWebhookSender(): WebhookSender {
  return new HttpWebhookSender();
}

import crypto from "node:crypto";
import type { WebhookEndpoint } from "../../domain/webhook/webhook.entity";
import type {
  WebhookDeliveryRepository,
} from "../../domain/webhook/webhook-repository";

export interface WebhookDeliveryService {
  deliver(
    endpoint: WebhookEndpoint,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }>;
}

export class HttpWebhookDeliveryService implements WebhookDeliveryService {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly deliveryRepository: WebhookDeliveryRepository,
  ) {
    this.timeoutMs = parseInt(process.env.WEBHOOK_TIMEOUT_MS ?? "10000", 10);
    this.maxRetries = parseInt(process.env.WEBHOOK_MAX_RETRIES ?? "3", 10);
  }

  async deliver(
    endpoint: WebhookEndpoint,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const delivery = await this.deliveryRepository.create(
      endpoint.id,
      eventType,
      payload,
    );

    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": eventType,
      "X-Webhook-Delivery": delivery.id.toString(),
      "X-Webhook-Timestamp": Date.now().toString(),
    };

    // Sign payload if secret is configured
    if (endpoint.secret) {
      const signature = this.signPayload(body, endpoint.secret);
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await response.text();

      if (response.ok) {
        await this.deliveryRepository.markDelivered(
          delivery.id,
          response.status,
          responseText.substring(0, 1000),
        );
        return { success: true, statusCode: response.status };
      } else {
        await this.deliveryRepository.markFailed(
          delivery.id,
          response.status,
          `HTTP ${response.status}: ${responseText.substring(0, 500)}`,
        );
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.deliveryRepository.markFailed(delivery.id, null, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private signPayload(body: string, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");
  }
}

import type {
  WebhookEndpointRepository,
  WebhookDeliveryRepository,
} from "../../domain/webhook/webhook-repository";
import type { WebhookDeliveryService } from "../../infrastructure/webhook/webhook-delivery";

export interface SendWebhookInput {
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export class SendWebhookCommand {
  constructor(
    private readonly endpointRepository: WebhookEndpointRepository,
    private readonly deliveryService: WebhookDeliveryService,
  ) {}

  async execute(input: SendWebhookInput): Promise<{ delivered: number; failed: number }> {
    const endpoints = await this.endpointRepository.findByEvent(
      input.tenantId,
      input.eventType,
    );

    let delivered = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
      const result = await this.deliveryService.deliver(
        endpoint,
        input.eventType,
        input.payload,
      );

      if (result.success) {
        delivered++;
      } else {
        failed++;
      }
    }

    return { delivered, failed };
  }
}

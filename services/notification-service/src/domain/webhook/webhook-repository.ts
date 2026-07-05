import type {
  WebhookEndpoint,
  CreateWebhookEndpointInput,
  WebhookDelivery,
  ListWebhookDeliveriesFilter,
} from "./webhook.entity";

export interface WebhookEndpointRepository {
  list(tenantId: string): Promise<WebhookEndpoint[]>;
  create(input: CreateWebhookEndpointInput): Promise<WebhookEndpoint>;
  delete(id: string): Promise<boolean>;
  findByEvent(tenantId: string, eventType: string): Promise<WebhookEndpoint[]>;
}

export interface WebhookDeliveryRepository {
  list(filter: ListWebhookDeliveriesFilter): Promise<WebhookDelivery[]>;
  create(
    endpointId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDelivery>;
  markDelivered(
    id: string,
    statusCode: number,
    response: string,
  ): Promise<WebhookDelivery | null>;
  markFailed(
    id: string,
    statusCode: number | null,
    errorMessage: string,
  ): Promise<WebhookDelivery | null>;
  incrementRetryCount(id: string): Promise<void>;
}

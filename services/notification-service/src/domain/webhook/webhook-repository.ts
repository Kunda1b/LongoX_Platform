import type {
  WebhookEndpoint,
  CreateWebhookEndpointInput,
  WebhookDelivery,
  ListWebhookDeliveriesFilter,
} from "./webhook.entity";

export interface WebhookEndpointRepository {
  list(tenantId: string): Promise<WebhookEndpoint[]>;
  create(input: CreateWebhookEndpointInput): Promise<WebhookEndpoint>;
  delete(id: number): Promise<boolean>;
  findByEvent(tenantId: string, eventType: string): Promise<WebhookEndpoint[]>;
}

export interface WebhookDeliveryRepository {
  list(filter: ListWebhookDeliveriesFilter): Promise<WebhookDelivery[]>;
  create(endpointId: number, eventType: string, payload: Record<string, unknown>): Promise<WebhookDelivery>;
  markDelivered(id: number, statusCode: number, response: string): Promise<WebhookDelivery | null>;
  markFailed(id: number, statusCode: number | null, errorMessage: string): Promise<WebhookDelivery | null>;
  incrementRetryCount(id: number): Promise<void>;
}

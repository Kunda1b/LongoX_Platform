export interface WebhookEndpoint {
  id: number;
  tenantId: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookEndpointInput {
  tenantId: string;
  url: string;
  secret?: string;
  events: string[];
}

export interface WebhookDelivery {
  id: number;
  endpointId: number;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed";
  statusCode: number | null;
  response: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  deliveredAt: string | null;
}

export interface ListWebhookDeliveriesFilter {
  endpointId?: number;
  status?: string;
  limit?: number;
}

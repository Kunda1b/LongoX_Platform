export interface NotificationChannel {
  id: string;
  type: "email" | "webhook" | "in_app";
  name: string;
  config: EmailChannelConfig | WebhookChannelConfig | InAppChannelConfig;
  tenantId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailChannelConfig {
  type: "email";
  provider: "smtp" | "sendgrid" | "ses";
  from: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  apiKey?: string;
}

export interface WebhookChannelConfig {
  type: "webhook";
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  secret?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface InAppChannelConfig {
  type: "in_app";
  persistToDatabase: boolean;
  realtimeEnabled: boolean;
}

export interface CreateChannelInput {
  type: "email" | "webhook" | "in_app";
  name: string;
  config: EmailChannelConfig | WebhookChannelConfig | InAppChannelConfig;
  tenantId: string;
}

export interface UpdateChannelInput {
  name?: string;
  config?: EmailChannelConfig | WebhookChannelConfig | InAppChannelConfig;
  enabled?: boolean;
}

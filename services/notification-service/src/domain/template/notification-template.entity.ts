export interface NotificationTemplate {
  id: number;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: unknown;
  createdAt: string;
}

export interface CreateNotificationTemplateInput {
  name: string;
  channel?: string;
  subject?: string;
  body: string;
  variables?: string[];
}

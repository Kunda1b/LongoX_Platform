export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  channel: string;
  status: string;
  recipientId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  type?: string;
  title: string;
  body?: string;
  channel?: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListNotificationsFilter {
  recipientId?: string;
  status?: string;
  limit?: number;
}

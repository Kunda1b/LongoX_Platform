export interface EmailMessage {
  id: number;
  to: string;
  from: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  templateName: string | null;
  status: "pending" | "sent" | "failed";
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  sentAt: string | null;
}

export interface SendEmailInput {
  to: string;
  from?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  templateName?: string;
  metadata?: Record<string, unknown>;
}

export interface ListEmailsFilter {
  status?: string;
  limit?: number;
}

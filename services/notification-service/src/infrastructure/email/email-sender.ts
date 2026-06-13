import type { EmailChannelConfig } from "../../domain/channel/notification-channel.entity";

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailSender {
  send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean>;
}

export class SmtpEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    // TODO: Implement SMTP email sending
    console.log("[EmailSender] SMTP send:", {
      to: message.to,
      subject: message.subject,
      provider: config.provider,
    });
    return true;
  }
}

export class SendGridEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    // TODO: Implement SendGrid email sending
    console.log("[EmailSender] SendGrid send:", {
      to: message.to,
      subject: message.subject,
    });
    return true;
  }
}

export class SesEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    // TODO: Implement SES email sending
    console.log("[EmailSender] SES send:", {
      to: message.to,
      subject: message.subject,
    });
    return true;
  }
}

export function createEmailSender(config: EmailChannelConfig): EmailSender {
  switch (config.provider) {
    case "sendgrid":
      return new SendGridEmailSender();
    case "ses":
      return new SesEmailSender();
    case "smtp":
    default:
      return new SmtpEmailSender();
  }
}

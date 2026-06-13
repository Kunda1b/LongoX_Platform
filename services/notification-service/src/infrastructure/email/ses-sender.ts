import type { SendEmailInput } from "../../domain/email/email.entity";

export interface EmailSender {
  send(input: SendEmailInput): Promise<{ messageId: string }>;
}

export class SesEmailSender implements EmailSender {
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor() {
    this.region = process.env.AWS_SES_REGION ?? "us-east-1";
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  }

  async send(input: SendEmailInput): Promise<{ messageId: string }> {
    // AWS SES v2 API integration
    const response = await fetch(
      `https://email.${this.region}.amazonaws.com/v2/email/outbound-emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Amz-Date": new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""),
          Authorization: this.buildAuthorizationHeader(),
        },
        body: JSON.stringify({
          FromEmailAddress: input.from ?? "noreply@longox.com",
          Destination: {
            ToAddresses: [input.to],
          },
          Content: {
            Simple: {
              Subject: {
                Data: input.subject,
                Charset: "UTF-8",
              },
              Body: {
                Text: {
                  Data: input.body,
                  Charset: "UTF-8",
                },
                Html: {
                  Data: input.htmlBody ?? input.body,
                  Charset: "UTF-8",
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SES send failed: ${error}`);
    }

    const result = (await response.json()) as { MessageId: string };
    return { messageId: result.MessageId };
  }

  private buildAuthorizationHeader(): string {
    // Simplified - in production use AWS SDK v4 signing
    return `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${this.region}/email/aws4_request`;
  }
}

export class ConsoleEmailSender implements EmailSender {
  async send(input: SendEmailInput): Promise<{ messageId: string }> {
    console.log("[Email] Sending email:", {
      to: input.to,
      from: input.from,
      subject: input.subject,
      bodyPreview: input.body.substring(0, 100),
    });
    return { messageId: `console-${Date.now()}` };
  }
}

export function createEmailSender(): EmailSender {
  if (process.env.NODE_ENV === "production" && process.env.AWS_ACCESS_KEY_ID) {
    return new SesEmailSender();
  }
  return new ConsoleEmailSender();
}

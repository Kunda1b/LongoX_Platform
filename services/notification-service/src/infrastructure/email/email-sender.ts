import { createHmac, createHash } from "crypto";
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

// ─── SMTP via nodemailer ───────────────────────────────────────────────────────

export class SmtpEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost ?? "localhost",
      port: config.smtpPort ?? 587,
      secure: (config.smtpPort ?? 587) === 465,
      auth:
        config.smtpUser
          ? { user: config.smtpUser, pass: config.smtpPassword ?? "" }
          : undefined,
    });

    const toList = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    const ccList = message.cc
      ? Array.isArray(message.cc) ? message.cc.join(", ") : message.cc
      : undefined;
    const bccList = message.bcc
      ? Array.isArray(message.bcc) ? message.bcc.join(", ") : message.bcc
      : undefined;

    await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return true;
  }
}

// ─── SendGrid via HTTP API v3 ──────────────────────────────────────────────────

export class SendGridEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    if (!config.apiKey) {
      throw new Error("SendGrid apiKey is required in the channel config");
    }

    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const ccList = message.cc
      ? Array.isArray(message.cc) ? message.cc : [message.cc]
      : undefined;
    const bccList = message.bcc
      ? Array.isArray(message.bcc) ? message.bcc : [message.bcc]
      : undefined;

    const body: Record<string, unknown> = {
      personalizations: [
        {
          to: toList.map((email) => ({ email })),
          ...(ccList ? { cc: ccList.map((email) => ({ email })) } : {}),
          ...(bccList ? { bcc: bccList.map((email) => ({ email })) } : {}),
        },
      ],
      from: { email: config.from },
      ...(config.replyTo ? { reply_to: { email: config.replyTo } } : {}),
      subject: message.subject,
      content: [
        ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
        ...(message.html ? [{ type: "text/html", value: message.html }] : []),
      ],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`SendGrid error ${res.status}: ${text}`);
    }

    return true;
  }
}

// ─── AWS SES v2 via HTTP + Signature V4 ───────────────────────────────────────

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function getSigningKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

export class SesEmailSender implements EmailSender {
  async send(config: EmailChannelConfig, message: EmailMessage): Promise<boolean> {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION ?? "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
      );
    }

    const toList = Array.isArray(message.to) ? message.to : [message.to];
    const ccList = message.cc
      ? Array.isArray(message.cc) ? message.cc : [message.cc]
      : undefined;
    const bccList = message.bcc
      ? Array.isArray(message.bcc) ? message.bcc : [message.bcc]
      : undefined;

    const sesBody = JSON.stringify({
      FromEmailAddress: config.from,
      ...(config.replyTo ? { ReplyToAddresses: [config.replyTo] } : {}),
      Destination: {
        ToAddresses: toList,
        ...(ccList ? { CcAddresses: ccList } : {}),
        ...(bccList ? { BccAddresses: bccList } : {}),
      },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: {
            ...(message.html
              ? { Html: { Data: message.html, Charset: "UTF-8" } }
              : {}),
            ...(message.text
              ? { Text: { Data: message.text, Charset: "UTF-8" } }
              : {}),
          },
        },
      },
    });

    // Build canonical request components
    const host = `email.${region}.amazonaws.com`;
    const path = "/v2/email/outbound-emails";
    const now = new Date();
    const amzDate =
      now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const bodyHash = hex(sesBody);
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;

    const canonicalRequest = [
      "POST",
      path,
      "",
      canonicalHeaders,
      signedHeaders,
      bodyHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "ses");
    const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorizationHeader =
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(`https://${host}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: host,
        "X-Amz-Date": amzDate,
        Authorization: authorizationHeader,
      },
      body: sesBody,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AWS SES error ${res.status}: ${text}`);
    }

    return true;
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

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

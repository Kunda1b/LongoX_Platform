import type { NotificationRepository } from "../../domain/notification/notification-repository";
import type { EmailRepository } from "../../domain/email/email-repository";
import type { WebhookEndpointRepository } from "../../domain/webhook/webhook-repository";
import type { EmailSender } from "../../infrastructure/email/ses-sender";
import type { WebhookDeliveryService } from "../../infrastructure/webhook/webhook-delivery";

export interface PlatformEvent {
  type: string;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class EventHandler {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly emailRepository: EmailRepository,
    private readonly endpointRepository: WebhookEndpointRepository,
    private readonly emailSender: EmailSender,
    private readonly webhookDeliveryService: WebhookDeliveryService,
  ) {}

  async handle(event: PlatformEvent): Promise<void> {
    switch (event.type) {
      case "workflow.completed":
        await this.handleWorkflowCompleted(event);
        break;
      case "workflow.failed":
        await this.handleWorkflowFailed(event);
        break;
      case "billing.payment_failed":
        await this.handleBillingPaymentFailed(event);
        break;
      case "billing.subscription_expired":
        await this.handleBillingSubscriptionExpired(event);
        break;
      default:
        console.log(`[EventHandler] Unhandled event type: ${event.type}`);
    }
  }

  private async handleWorkflowCompleted(event: PlatformEvent): Promise<void> {
    const { workflowId, workflowName, executionId } = event.data;

    // Create in-app notification
    await this.notificationRepository.create({
      type: "workflow.completed",
      title: `Workflow "${workflowName}" completed`,
      body: `Execution ${executionId} completed successfully.`,
      channel: "in_app",
      recipientId: event.tenantId,
      metadata: { workflowId, executionId },
    });

    // Send to webhook endpoints
    await this.sendWebhooks(event.tenantId, event.type, event.data);
  }

  private async handleWorkflowFailed(event: PlatformEvent): Promise<void> {
    const { workflowId, workflowName, executionId, error } = event.data;

    // Create in-app notification
    await this.notificationRepository.create({
      type: "workflow.failed",
      title: `Workflow "${workflowName}" failed`,
      body: `Execution ${executionId} failed: ${error}`,
      channel: "in_app",
      recipientId: event.tenantId,
      metadata: { workflowId, executionId, error },
    });

    // Send to webhook endpoints
    await this.sendWebhooks(event.tenantId, event.type, event.data);
  }

  private async handleBillingPaymentFailed(event: PlatformEvent): Promise<void> {
    const { invoiceId, amount, reason } = event.data;

    // Create in-app notification
    await this.notificationRepository.create({
      type: "billing.payment_failed",
      title: "Payment failed",
      body: `Invoice ${invoiceId} payment failed: ${reason}. Amount: $${amount}`,
      channel: "in_app",
      recipientId: event.tenantId,
      metadata: { invoiceId, amount, reason },
    });

    // Send email alert
    await this.sendEmail(
      event.tenantId,
      "Payment Failed",
      `Your payment for invoice ${invoiceId} failed. Please update your payment method.`,
    );

    // Send to webhook endpoints
    await this.sendWebhooks(event.tenantId, event.type, event.data);
  }

  private async handleBillingSubscriptionExpired(event: PlatformEvent): Promise<void> {
    const { subscriptionId, planName } = event.data;

    // Create in-app notification
    await this.notificationRepository.create({
      type: "billing.subscription_expired",
      title: "Subscription expired",
      body: `Your ${planName} subscription has expired.`,
      channel: "in_app",
      recipientId: event.tenantId,
      metadata: { subscriptionId, planName },
    });

    // Send email alert
    await this.sendEmail(
      event.tenantId,
      "Subscription Expired",
      `Your ${planName} subscription has expired. Please renew to continue using the platform.`,
    );

    // Send to webhook endpoints
    await this.sendWebhooks(event.tenantId, event.type, event.data);
  }

  private async sendWebhooks(
    tenantId: string,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const endpoints = await this.endpointRepository.findByEvent(
      tenantId,
      eventType,
    );

    for (const endpoint of endpoints) {
      await this.webhookDeliveryService.deliver(endpoint, eventType, data);
    }
  }

  private async sendEmail(
    tenantId: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // Get tenant admin email from user repository
    // For now, use a placeholder
    const toEmail = `admin+${tenantId}@longox.com`;

    await this.emailRepository.create({
      to: toEmail,
      subject,
      body,
      templateName: "billing-alert",
      metadata: { tenantId },
    });

    try {
      await this.emailSender.send({
        to: toEmail,
        subject,
        body,
      });
    } catch (error) {
      console.error("[EventHandler] Failed to send email:", error);
    }
  }
}

/**
 * Stripe billing service (application layer).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingAccount`, `prisma.billingPlan`, `prisma.tenant`,
 * `prisma.invoice`, `prisma.invoiceLine`, `prisma.meteringEvent` delegates
 * with `as any` casts for legacy columns (`stripeCustomerId`,
 * `stripeSubscriptionId`, `stripeSubscriptionStatus`, `stripePriceId`,
 * `planId`, `billingCycle`, `currentPeriodStart`, `currentPeriodEnd`,
 * `cancelAtPeriodEnd`, `tenantId` on `invoice_lines`, etc.).
 */

import type Stripe from "stripe";
import {
  getStripe,
  getFrontendUrl,
  getWebhookSecret,
} from "../../infrastructure/stripe/client";
import { prisma } from "@longox/db/prisma";

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PortalSessionResult {
  url: string;
}

export interface SubscriptionStatus {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    name: string;
    displayName: string;
    tier: string;
  } | null;
  stripeSubscriptionId: string | null;
}

export class StripeService {
  async getOrCreateCustomer(
    tenantId: string,
    email: string,
    name: string,
  ): Promise<string> {
    const existing = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if ((existing as any)?.stripeCustomerId) {
      return (existing as any).stripeCustomerId;
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { tenantId: String(tenantId) },
    });

    if (existing) {
      await prisma.billingAccount.update({
        where: { id: String((existing as any).id) },
        data: { stripeCustomerId: customer.id } as any,
      });
    } else {
      await prisma.billingAccount.create({
        data: {
          tenantId,
          stripeCustomerId: customer.id,
          status: "active",
        } as any,
      });
    }

    return customer.id;
  }

  async createCheckoutSession(
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutSessionResult> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    let customerId = (account as any)?.stripeCustomerId;

    if (!customerId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: String(tenantId) },
      });
      customerId = await this.getOrCreateCustomer(
        tenantId,
        "",
        tenant?.name ?? `Tenant ${tenantId}`,
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenantId: String(tenantId) },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  async createPortalSession(
    tenantId: string,
    returnUrl: string,
  ): Promise<PortalSessionResult> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!(account as any)?.stripeCustomerId) {
      throw new Error("No Stripe customer found for this tenant");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: (account as any).stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async createSubscription(
    tenantId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!(account as any)?.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.create({
      customer: (account as any).stripeCustomerId,
      items: [{ price: priceId }],
      metadata: { tenantId: String(tenantId) },
    });

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        status: "active",
      } as any,
    });

    return subscription;
  }

  async cancelSubscription(
    tenantId: string,
    subscriptionId: string,
  ): Promise<void> {
    const stripe = getStripe();
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: { cancelAtPeriodEnd: true } as any,
    });
  }

  async getSubscription(tenantId: string): Promise<SubscriptionStatus | null> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!(account as any)?.stripeSubscriptionId) {
      return null;
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      (account as any).stripeSubscriptionId,
    );

    let plan = null;
    if ((account as any).planId) {
      const planRecord = await prisma.billingPlan.findUnique({
        where: { id: String((account as any).planId) },
      });
      if (planRecord) {
        plan = {
          id: planRecord.id,
          name: planRecord.name,
          displayName: planRecord.displayName,
          tier: planRecord.tier,
        };
      }
    }

    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan,
      stripeSubscriptionId: subscription.id,
    };
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
    }
  }

  async syncInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    // `invoice_number` is unique — find first then update by primary key.
    const existing = await prisma.invoice.findFirst({
      where: { invoiceNumber: invoiceId } as any,
    });
    if (!existing) return;
    await prisma.invoice.update({
      where: { id: existing.id },
      data: { status } as any,
    });
  }

  async enforcePlanEntitlements(tenantId: string): Promise<void> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!account) return;

    const sub = (account as any).stripeSubscriptionStatus;
    if (sub === "past_due" || sub === "canceled" || sub === "unpaid") {
      await prisma.tenant.update({
        where: { id: String(tenantId) },
        data: { status: "suspended" } as any,
      });
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) return;

    const subscriptionId = session.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "active",
      } as any,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    const periodStart = new Date(
      (invoice.period_start ?? subscription.current_period_start) * 1000,
    );
    const periodEnd = new Date(
      (invoice.period_end ?? subscription.current_period_end) * 1000,
    );

    await prisma.invoice.create({
      data: {
        billingAccountId: "",
        invoiceNumber: invoice.id,
        periodStart,
        periodEnd,
        status: "paid",
        totalAmount: (invoice.total ?? 0) / 100,
        currency: (invoice.currency ?? "usd").toUpperCase(),
        paidAt: new Date(),
      } as any,
    });

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: { stripeSubscriptionStatus: "active", status: "active" } as any,
    });

    const events = await prisma.meteringEvent.findMany({
      where: {
        tenantId: String(tenantId),
        timestamp: periodStart,
      } as any,
      take: 50,
    });

    const eventIds: string[] = (events as any[]).map((e) => e.eventId);

    const invoiceLines = invoice.lines?.data ?? [];
    for (const line of invoiceLines) {
      await prisma.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          tenantId: String(tenantId),
          lineType: "subscription",
          description: line.description ?? "Subscription charge",
          quantity: Number(line.quantity ?? 1),
          unitPrice: line.price?.unit_amount
            ? Number(line.price.unit_amount) / 100
            : 0,
          amount: (line.amount ?? 0) / 100,
          currency: invoice.currency ?? "usd",
          periodStart,
          periodEnd,
          sourceEventIds: eventIds,
          stripeLineItemId: line.id,
        } as any,
      });
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: { stripeSubscriptionStatus: "past_due", status: "past_due" } as any,
    });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        status:
          subscription.status === "active" || subscription.status === "trialing"
            ? "active"
            : "past_due",
      } as any,
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionStatus: "canceled",
        status: "canceled",
        stripeSubscriptionId: null,
        planId: null,
      } as any,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: String(tenantId) },
    });
    if (tenant) {
      await prisma.tenant.update({
        where: { id: String(tenantId) },
        data: { planId: "free" } as any,
      });
    }
  }
}

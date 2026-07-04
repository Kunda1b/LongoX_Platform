/**
 * Stripe service (infrastructure layer).
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingAccount`, `prisma.billingPlan`, `prisma.tenant`
 * delegates with `as any` casts for legacy columns.
 */

import type Stripe from "stripe";
import { getStripe, getFrontendUrl } from "./client";
import { prisma } from "@longox/db/prisma";

export interface CreateCheckoutInput {
  tenantId: string;
  planId: number;
  billingCycle: "monthly" | "annual";
}

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
    input: CreateCheckoutInput,
    userEmail: string,
    userName: string,
  ): Promise<CheckoutSessionResult> {
    const plan = await prisma.billingPlan.findFirst({
      where: {
        id: String(input.planId),
        isActive: true,
      } as any,
    });

    if (!plan) {
      throw new Error("Plan not found or inactive");
    }

    const priceId =
      input.billingCycle === "annual"
        ? plan.stripePriceIdAnnual
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new Error(
        `No Stripe price configured for ${input.billingCycle} billing on plan ${plan.name}`,
      );
    }

    const customerId = await this.getOrCreateCustomer(
      input.tenantId,
      userEmail,
      userName,
    );

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getFrontendUrl()}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${getFrontendUrl()}/billing?canceled=true`,
      metadata: {
        tenantId: String(input.tenantId),
        planId: String(input.planId),
        billingCycle: input.billingCycle,
      },
      subscription_data: {
        trial_period_days: plan.tier === "free" ? 0 : 14,
        metadata: {
          tenantId: String(input.tenantId),
          planId: String(input.planId),
        },
      },
    });

    await this.syncAccountFromCheckout(
      input.tenantId,
      session,
      input.planId,
      input.billingCycle,
    );

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  async createPortalSession(tenantId: string): Promise<PortalSessionResult> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!(account as any)?.stripeCustomerId) {
      throw new Error("No Stripe customer found for this tenant");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: (account as any).stripeCustomerId,
      return_url: `${getFrontendUrl()}/billing`,
    });

    return { url: session.url };
  }

  async getSubscriptionStatus(
    tenantId: string,
  ): Promise<SubscriptionStatus | null> {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId: String(tenantId) } as any,
    });

    if (!(account as any)?.stripeSubscriptionId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: String(tenantId) },
      });

      return {
        status: "none",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        plan: tenant
          ? {
              id: "",
              name: tenant.planId,
              displayName: tenant.planId.charAt(0).toUpperCase() + tenant.planId.slice(1),
              tier: tenant.planId,
            }
          : null,
      };
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
    };
  }

  async handleWebhookEvent(
    event: Stripe.Event,
  ): Promise<{ processed: boolean; type: string }> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        return { processed: true, type: event.type };

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        return { processed: true, type: event.type };

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        return { processed: true, type: event.type };

      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        return { processed: true, type: event.type };

      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        return { processed: true, type: event.type };

      default:
        return { processed: false, type: event.type };
    }
  }

  private async syncAccountFromCheckout(
    tenantId: string,
    session: Stripe.Checkout.Session,
    planId: number,
    billingCycle: string,
  ): Promise<void> {
    const subscriptionId = session.subscription as string | null;

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: "incomplete",
        stripePriceId: session.metadata?.["priceId"] ?? null,
        planId: String(planId),
        billingCycle,
        status: "active",
      } as any,
    });

    const tier = await this.getPlanTier(planId);
    await prisma.tenant.update({
      where: { id: String(tenantId) },
      data: { planId: tier ?? "free" } as any,
    });
  }

  private async getPlanTier(planId: number): Promise<string | null> {
    const plan = await prisma.billingPlan.findUnique({
      where: { id: String(planId) },
      select: { tier: true },
    });
    return plan?.tier ?? null;
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
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "active",
      } as any,
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
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000,
        ),
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

    await prisma.tenant.update({
      where: { id: String(tenantId) },
      data: { planId: "free" } as any,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await prisma.billingAccount.update({
      where: { tenantId: String(tenantId) } as any,
      data: {
        stripeSubscriptionStatus: "active",
        status: "active",
      } as any,
    });
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
      data: {
        stripeSubscriptionStatus: "past_due",
        status: "past_due",
      } as any,
    });
  }
}

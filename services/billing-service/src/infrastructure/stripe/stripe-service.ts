import { getStripe, getFrontendUrl } from "./client";
import {
  db,
  billingAccountsTable,
  billingPlansTable,
  tenantsTable,
} from "@longox/db";
import { eq, and } from "drizzle-orm";

export interface CreateCheckoutInput {
  tenantId: number;
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
    id: number;
    name: string;
    displayName: string;
    tier: string;
  } | null;
}

export class StripeService {
  async getOrCreateCustomer(
    tenantId: number,
    email: string,
    name: string,
  ): Promise<string> {
    const [existing] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { tenantId: String(tenantId) },
    });

    if (existing) {
      await db
        .update(billingAccountsTable)
        .set({ stripeCustomerId: customer.id })
        .where(eq(billingAccountsTable.id, existing.id));
    } else {
      await db.insert(billingAccountsTable).values({
        tenantId,
        stripeCustomerId: customer.id,
        status: "active",
      });
    }

    return customer.id;
  }

  async createCheckoutSession(
    input: CreateCheckoutInput,
    userEmail: string,
    userName: string,
  ): Promise<CheckoutSessionResult> {
    const [plan] = await db
      .select()
      .from(billingPlansTable)
      .where(
        and(
          eq(billingPlansTable.id, input.planId),
          eq(billingPlansTable.isActive, true),
        ),
      )
      .limit(1);

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

  async createPortalSession(tenantId: number): Promise<PortalSessionResult> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account?.stripeCustomerId) {
      throw new Error("No Stripe customer found for this tenant");
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: `${getFrontendUrl()}/billing`,
    });

    return { url: session.url };
  }

  async getSubscriptionStatus(
    tenantId: number,
  ): Promise<SubscriptionStatus | null> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account?.stripeSubscriptionId) {
      const [tenant] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);

      return {
        status: "none",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        plan: tenant
          ? {
              id: 0,
              name: tenant.plan,
              displayName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
              tier: tenant.plan,
            }
          : null,
      };
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      account.stripeSubscriptionId,
    );

    let plan = null;
    if (account.planId) {
      const [planRecord] = await db
        .select()
        .from(billingPlansTable)
        .where(eq(billingPlansTable.id, account.planId))
        .limit(1);
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
    tenantId: number,
    session: Stripe.Checkout.Session,
    planId: number,
    billingCycle: string,
  ): Promise<void> {
    const subscriptionId = session.subscription as string | null;

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: "incomplete",
        stripePriceId: session.metadata?.["priceId"] ?? null,
        planId,
        billingCycle,
        status: "active",
      })
      .where(eq(billingAccountsTable.tenantId, tenantId));

    await db
      .update(tenantsTable)
      .set({ plan: (await this.getPlanTier(planId)) ?? "free" })
      .where(eq(tenantsTable.id, tenantId));
  }

  private async getPlanTier(planId: number): Promise<string | null> {
    const [plan] = await db
      .select({ tier: billingPlansTable.tier })
      .from(billingPlansTable)
      .where(eq(billingPlansTable.id, planId))
      .limit(1);
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

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: subscription.status,
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "active",
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await db
      .update(billingAccountsTable)
      .set({
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
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionStatus: "canceled",
        status: "canceled",
        stripeSubscriptionId: null,
        planId: null,
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));

    await db
      .update(tenantsTable)
      .set({ plan: "free" })
      .where(eq(tenantsTable.id, Number(tenantId)));
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionStatus: "active",
        status: "active",
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
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

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionStatus: "past_due",
        status: "past_due",
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
  }
}

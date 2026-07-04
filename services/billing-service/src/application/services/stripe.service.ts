import type Stripe from "stripe";
import { getStripe, getFrontendUrl, getWebhookSecret } from "../../infrastructure/stripe/client";
import {
  db,
  billingAccountsTable,
  billingPlansTable,
  tenantsTable,
  invoicesTable,
  invoiceLinesTable,
  meteringEventsTable,
} from "@longox/db";
import { eq, and, sql } from "drizzle-orm";

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
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutSessionResult> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    let customerId = account?.stripeCustomerId;

    if (!customerId) {
      const [tenant] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);
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
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async createSubscription(
    tenantId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account?.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.create({
      customer: account.stripeCustomerId,
      items: [{ price: priceId }],
      metadata: { tenantId: String(tenantId) },
    });

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        status: "active",
      })
      .where(eq(billingAccountsTable.tenantId, tenantId));

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

    await db
      .update(billingAccountsTable)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(billingAccountsTable.tenantId, tenantId));
  }

  async getSubscription(tenantId: string): Promise<SubscriptionStatus | null> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account?.stripeSubscriptionId) {
      return null;
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
      stripeSubscriptionId: subscription.id,
    };
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  async syncInvoiceStatus(
    invoiceId: string,
    status: string,
  ): Promise<void> {
    await db
      .update(invoicesTable)
      .set({ status })
      .where(eq(invoicesTable.invoiceNumber, invoiceId));
  }

  async enforcePlanEntitlements(tenantId: string): Promise<void> {
    const [account] = await db
      .select()
      .from(billingAccountsTable)
      .where(eq(billingAccountsTable.tenantId, tenantId))
      .limit(1);

    if (!account) return;

    if (
      account.stripeSubscriptionStatus === "past_due" ||
      account.stripeSubscriptionStatus === "canceled" ||
      account.stripeSubscriptionStatus === "unpaid"
    ) {
      await db
        .update(tenantsTable)
        .set({ isActive: false })
        .where(eq(tenantsTable.id, tenantId));
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
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
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "active",
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
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

    await db.insert(invoicesTable).values({
      billingAccountId: 0,
      invoiceNumber: invoice.id,
      periodStart,
      periodEnd,
      status: "paid",
      totalAmount: (invoice.total ?? 0) / 100,
      currency: (invoice.currency ?? "usd").toUpperCase(),
      paidAt: new Date(),
    });

    await db
      .update(billingAccountsTable)
      .set({ stripeSubscriptionStatus: "active", status: "active" })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));

    const events = await db
      .select()
      .from(meteringEventsTable)
      .where(
        and(
          eq(meteringEventsTable.tenantId, Number(tenantId)),
          eq(meteringEventsTable.timestamp, periodStart),
        ),
      )
      .limit(50);

    const eventIds: string[] = events.map((e) => e.eventId);

    const invoiceLines = invoice.lines?.data ?? [];
    for (const line of invoiceLines) {
      await db.insert(invoiceLinesTable).values({
        invoiceId: invoice.id,
        tenantId: Number(tenantId),
        lineType: "subscription",
        description: line.description ?? "Subscription charge",
        quantity: String(line.quantity ?? 1),
        unitPrice: line.price?.unit_amount ? String(line.price.unit_amount / 100) : "0",
        amount: String((line.amount ?? 0) / 100),
        currency: invoice.currency ?? "usd",
        periodStart,
        periodEnd,
        sourceEventIds: eventIds,
        stripeLineItemId: line.id,
      });
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await db
      .update(billingAccountsTable)
      .set({ stripeSubscriptionStatus: "past_due", status: "past_due" })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await db
      .update(billingAccountsTable)
      .set({
        stripeSubscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        status:
          subscription.status === "active" || subscription.status === "trialing"
            ? "active"
            : "past_due",
      })
      .where(eq(billingAccountsTable.tenantId, Number(tenantId)));
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
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
}

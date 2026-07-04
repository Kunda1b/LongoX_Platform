/**
 * Billing REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingAccount`, `prisma.invoice`, `prisma.invoiceLine`,
 * `prisma.billingPlan` delegates with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { MeteringService } from "../application/services/metering.service";
import { StripeService } from "../application/services/stripe.service";
import { EntitlementService } from "../application/services/entitlement.service";
import { OverageService } from "../application/services/overage.service";
import { prisma } from "@longox/db/prisma";
import { getFrontendUrl } from "../infrastructure/stripe/client";

const router: IRouter = Router();
const meteringService = new MeteringService();
const stripeService = new StripeService();
const entitlementService = new EntitlementService();
const overageService = new OverageService();

router.post("/billing/checkout", authorize("billing.write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const { priceId } = req.body as { priceId?: string };

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    const frontendUrl = getFrontendUrl();
    const result = await stripeService.createCheckoutSession(
      tenantId,
      priceId,
      `${frontendUrl}/billing?success=true`,
      `${frontendUrl}/billing?canceled=true`,
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/billing/portal", authorize("billing.write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const frontendUrl = getFrontendUrl();
    const result = await stripeService.createPortalSession(tenantId, `${frontendUrl}/billing`);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/subscription", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const subscription = await stripeService.getSubscription(tenantId);
    res.json(subscription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/billing/webhook", async (req, res): Promise<void> => {
  try {
    await stripeService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/usage", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from as string) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to as string) : now;
  const eventType = req.query.eventType as string | undefined;

  try {
    const usage = await meteringService.getUsage(tenantId, from, to, eventType);
    res.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/usage/daily", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const date = req.query.date ? new Date(req.query.date as string) : new Date();

  try {
    const usage = await meteringService.getDailyUsage(tenantId, date);
    res.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/usage/monthly", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const now = new Date();
  const year = req.query.year ? Number(req.query.year) : now.getFullYear();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;

  try {
    const usage = await meteringService.getMonthlyUsage(tenantId, year, month);
    res.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/invoices", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    if (!account) {
      res.json([]);
      return;
    }

    const invoices = await prisma.invoice.findMany({
      where: { billingAccountId: account.id } as any,
      orderBy: { createdAt: "asc" },
    });

    res.json(invoices);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/invoices/:id/lines", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const invoiceId = req.params.id as string;

  try {
    const lines = await prisma.invoiceLine.findMany({
      where: {
        tenantId,
        invoiceId,
      } as any,
    });

    res.json(lines);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/plan", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const account = await prisma.billingAccount.findFirst({
      where: { tenantId } as any,
    });

    if (!(account as any)?.planId) {
      res.json({ plan: null, limits: await entitlementService.getPlan(tenantId) });
      return;
    }

    const plan = await prisma.billingPlan.findUnique({
      where: { id: (account as any).planId },
    });

    const limits = await entitlementService.getPlan(tenantId);

    res.json({ plan, limits });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/entitlements", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const usageAgainstPlan = await entitlementService.getUsageAgainstPlan(tenantId);
    res.json(usageAgainstPlan);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/billing/metering/record", authorize("billing.write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;
  const { eventId, eventType, quantity, unit, workflowId, executionId, connectorId, dashboardId, metadata, timestamp } = req.body;

  if (!eventId || !eventType || quantity == null || !unit) {
    res.status(400).json({ error: "eventId, eventType, quantity, and unit are required" });
    return;
  }

  try {
    await meteringService.record({
      eventId,
      eventType,
      tenantId,
      quantity,
      unit,
      workflowId: workflowId ?? null,
      executionId: executionId ?? null,
      connectorId: connectorId ?? null,
      dashboardId: dashboardId ?? null,
      metadata: metadata ?? {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    res.status(201).json({ recorded: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;

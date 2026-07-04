/**
 * Billing plans REST routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.billingPlan` delegate.
 */

import { Router, type IRouter } from "express";
import { authorize } from "@longox/shared-rbac";
import { prisma } from "@longox/db/prisma";

const router: IRouter = Router();

router.get("/billing/plans", authorize("billing.read"), async (_req, res): Promise<void> => {
  const plans = await prisma.billingPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  res.json(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      tier: p.tier,
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.annualPrice,
      currency: p.currency,
      includedExecutions: p.includedExecutions,
      includedWorkflows: p.includedWorkflows,
      includedConnectors: p.includedConnectors,
      includedAiTokens: p.includedAiTokens,
      includedStorageMb: p.includedStorageMb,
      maxUsers: p.maxUsers,
      maxEnvironments: p.maxEnvironments,
      overageExecutionsPrice: p.overageExecutionsPrice,
      overageAiTokensPrice: p.overageAiTokensPrice,
      features: p.features,
    })),
  );
});

export default router;

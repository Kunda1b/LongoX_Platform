import { Router, type IRouter } from "express";
import { authorize } from "@longox/shared-rbac";
import { db, billingPlansTable } from "@longox/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/billing/plans", authorize("billing.read"), async (_req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(billingPlansTable)
    .where(eq(billingPlansTable.isActive, true))
    .orderBy(billingPlansTable.sortOrder);

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

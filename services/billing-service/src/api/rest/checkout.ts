import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { StripeService } from "../../infrastructure/stripe/stripe-service";

const router: IRouter = Router();
const stripeService = new StripeService();

router.post("/billing/checkout", authorize("billing.write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  const { planId, billingCycle } = req.body as {
    planId?: number;
    billingCycle?: "monthly" | "annual";
  };

  if (!planId || !billingCycle) {
    res
      .status(400)
      .json({ error: "planId and billingCycle are required" });
    return;
  }

  try {
    const result = await stripeService.createCheckoutSession(
      { tenantId, planId, billingCycle },
      req.user!.email,
      req.user!.name,
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/portal", authorize("billing.write"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  try {
    const result = await stripeService.createPortalSession(tenantId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/billing/subscription", async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const status = await stripeService.getSubscriptionStatus(tenantId);
    res.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;

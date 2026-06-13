import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresUsageRepository } from "../../infrastructure/postgres/usage-repository";
import { GetUsageSummaryQuery } from "../../application/queries/get-usage-summary.query";
import { ListUsageEventsQuery } from "../../application/queries/list-usage-events.query";

const router: IRouter = Router();
const repository = new PostgresUsageRepository();
const getUsageSummary = new GetUsageSummaryQuery(repository);
const listUsageEvents = new ListUsageEventsQuery(repository);

router.get("/usage", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  const summary = await getUsageSummary.execute(tenantId);
  res.json(summary);
});

router.get("/usage/events", authorize("billing.read"), requireTenantContext, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId!;

  const limit = Number(req.query.limit) || 50;
  const workflowId = req.query.workflowId ? Number(req.query.workflowId) : null;
  const eventType = req.query.eventType as string | undefined;
  const events = await listUsageEvents.execute(tenantId, {
    limit,
    workflowId,
    eventType,
  });
  res.json(events);
});

export default router;

import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresUsageRepository } from "../../infrastructure/postgres/usage-repository";
import { GetCurrentBillingQuery } from "../../application/queries/get-current-billing.query";
import { ListInvoicesQuery } from "../../application/queries/list-invoices.query";

const router: IRouter = Router();
const repository = new PostgresUsageRepository();
const getCurrentBilling = new GetCurrentBillingQuery(repository);
const listInvoices = new ListInvoicesQuery(repository);

router.get(
  "/billing/current",
  authorize("billing.read"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;

    const period = await getCurrentBilling.execute(tenantId);
    res.json(period);
  },
);

router.get(
  "/billing/invoices",
  authorize("billing.read"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;

    const invoices = await listInvoices.execute(tenantId);
    res.json(invoices);
  },
);

export default router;

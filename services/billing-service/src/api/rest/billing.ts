import { Router, type IRouter } from "express";
import { PostgresUsageRepository } from "../../infrastructure/postgres/usage-repository";
import { GetCurrentBillingQuery } from "../../application/queries/get-current-billing.query";
import { ListInvoicesQuery } from "../../application/queries/list-invoices.query";

const router: IRouter = Router();
const repository = new PostgresUsageRepository();
const getCurrentBilling = new GetCurrentBillingQuery(repository);
const listInvoices = new ListInvoicesQuery(repository);

router.get("/billing/current", async (_req, res): Promise<void> => {
  const period = await getCurrentBilling.execute();
  res.json(period);
});

router.get("/billing/invoices", async (_req, res): Promise<void> => {
  const invoices = await listInvoices.execute();
  res.json(invoices);
});

export default router;

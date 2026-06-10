import { Router, type IRouter } from "express";
import { ListAuditEntriesQuery } from "../../application/queries/list-audit-entries.query";
import { PostgresAuditRepository } from "../../infrastructure/postgres/audit-repository";

const router: IRouter = Router();
const listAuditEntries = new ListAuditEntriesQuery(
  new PostgresAuditRepository(),
);

router.get("/audit-log", async (req, res): Promise<void> => {
  const { resourceType, resourceId, action } = req.query as Record<
    string,
    string | undefined
  >;
  const limit = parseInt(String(req.query.limit ?? "100"), 10);
  const entries = await listAuditEntries.execute({
    resourceType,
    resourceId,
    action,
    limit,
  });
  res.json(entries);
});

export default router;

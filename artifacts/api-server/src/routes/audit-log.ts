import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, auditLogTable } from "@workspace/db";

const router: IRouter = Router();

function serializeAudit(e: typeof auditLogTable.$inferSelect) {
  return {
    id: e.id,
    actorType: e.actorType,
    actorId: e.actorId ?? null,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    metadata: e.metadata ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/audit-log", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
  const { resourceType, resourceId, action } = req.query as Record<string, string | undefined>;

  let query = db.select().from(auditLogTable).$dynamic();

  if (resourceType) query = query.where(eq(auditLogTable.resourceType, resourceType));
  if (resourceId) query = query.where(eq(auditLogTable.resourceId, resourceId));
  if (action) query = query.where(eq(auditLogTable.action, action));

  const entries = await query.orderBy(desc(auditLogTable.createdAt)).limit(limit);
  res.json(entries.map(serializeAudit));
});

export default router;

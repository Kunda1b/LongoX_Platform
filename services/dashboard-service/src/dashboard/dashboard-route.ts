import { Router, type IRouter } from "express";
import { db, workflowsTable, executionsTable, connectorsTable, appsTable } from "@autoflow/db";
import { eq, gte } from "drizzle-orm";
import { GetRecentActivityQueryParams } from "@autoflow/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [workflows, executions, connectors, apps] = await Promise.all([
    db.select().from(workflowsTable),
    db.select().from(executionsTable),
    db.select().from(connectorsTable),
    db.select().from(appsTable),
  ]);

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.status === "active").length;
  const totalExecutions = executions.length;
  const successCount = executions.filter((e) => e.status === "success").length;
  const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
  const totalApps = apps.length;
  const totalConnectors = connectors.filter((c) => c.isInstalled).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayExecs = executions.filter((e) => e.startedAt >= today);
  const executionsToday = todayExecs.length;
  const failedToday = todayExecs.filter((e) => e.status === "failed").length;

  res.json({
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    successRate: Math.round(successRate * 10) / 10,
    totalApps,
    totalConnectors,
    executionsToday,
    failedToday,
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 20;

  const executions = await db
    .select()
    .from(executionsTable)
    .orderBy(executionsTable.startedAt)
    .limit(limit);

  res.json(
    executions.map((e) => ({
      id: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      status: e.status,
      startedAt: e.startedAt.toISOString(),
      durationMs: e.durationMs ?? null,
      errorMessage: e.errorMessage ?? null,
    }))
  );
});

export default router;

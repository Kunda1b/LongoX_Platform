/**
 * Dashboard summary & activity routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.workflow`, `prisma.workflowExecution`, `prisma.connector`,
 * and `prisma.app` delegates. `as any` casts handle legacy columns
 * (e.g. `isInstalled`, `workflowName`) that aren't in the Prisma schema.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { GetRecentActivityQueryParams } from "@longox/api-zod";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.get(
  "/dashboard/summary",
  authorize("dashboards:read"),
  async (_req, res): Promise<void> => {
    const [workflows, executions, connectors, apps] = await Promise.all([
      prisma.workflow.findMany(),
      prisma.workflowExecution.findMany(),
      prisma.connector.findMany(),
      prisma.app.findMany(),
    ]);

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(
      (w: any) => w.status === "active",
    ).length;
    const totalExecutions = executions.length;
    const successCount = executions.filter(
      (e: any) => e.status === "success",
    ).length;
    const successRate =
      totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
    const totalApps = apps.length;
    const totalConnectors = connectors.filter((c: any) => c.isInstalled).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayExecs = executions.filter(
      (e: any) => new Date(e.startedAt) >= today,
    );
    const executionsToday = todayExecs.length;
    const failedToday = todayExecs.filter(
      (e: any) => e.status === "failed",
    ).length;

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
  },
);

router.get(
  "/dashboard/activity",
  authorize("dashboards:read"),
  async (req, res): Promise<void> => {
    const params = GetRecentActivityQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const limit = params.data.limit ?? 20;

    const executions = await prisma.workflowExecution.findMany({
      orderBy: { startedAt: "asc" } as any,
      take: limit,
    });

    res.json(
      executions.map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowName,
        status: e.status,
        startedAt:
          e.startedAt instanceof Date
            ? e.startedAt.toISOString()
            : new Date(e.startedAt).toISOString(),
        durationMs: e.durationMs ?? null,
        errorMessage: e.errorMessage ?? null,
      })),
    );
  },
);

export default router;

/**
 * Agent routes.
 *
 * Migrated from Drizzle to Prisma per ADR-013 Phase 3.
 * Uses `prisma.agentMemory` delegate with `as any` casts for legacy columns.
 */

import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
import { randomUUID } from "node:crypto";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.post(
  "/agents/run",
  authorize("ai:run"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const {
      agentId,
      name,
      role = "executor",
      systemPrompt,
      model = "gpt-4o-mini",
      provider = "openai",
      tools = [],
      maxIterations = 10,
      temperature = 0.7,
      memoryEnabled = true,
      planningEnabled = false,
      workflowId,
      executionId,
      variables = {},
      goal,
    } = req.body as {
      agentId?: string;
      name?: string;
      role?: string;
      systemPrompt: string;
      model?: string;
      provider?: string;
      tools?: string[];
      maxIterations?: number;
      temperature?: number;
      memoryEnabled?: boolean;
      planningEnabled?: boolean;
      workflowId?: string;
      executionId?: string;
      variables?: Record<string, unknown>;
      goal?: string;
    };

    if (!systemPrompt?.trim()) {
      res.status(400).json({ error: "systemPrompt is required" });
      return;
    }

    const resolvedGoal =
      goal ?? (variables.goal as string) ?? "Complete the task";

    res.json({
      id: agentId ?? randomUUID(),
      name: name ?? "Agent",
      role,
      status: "running",
      config: {
        model,
        provider,
        maxIterations,
        temperature,
        memoryEnabled,
        planningEnabled,
        tools,
      },
      context: {
        workflowId: workflowId ?? "manual",
        executionId: executionId ?? randomUUID(),
        tenantId,
        variables: { ...variables, goal: resolvedGoal },
      },
      startedAt: new Date().toISOString(),
      message:
        "Agent run started. Use the execution endpoint to track progress.",
    });
  },
);

router.get(
  "/agents/memory",
  authorize("ai:read"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant context required" });
      return;
    }

    const agentId = req.query.agentId as string;
    const memoryType = req.query.memoryType as string;

    const where: Record<string, unknown> = { tenantId };
    if (agentId) where.agentId = agentId;
    if (memoryType) where.memoryType = memoryType;

    const rows = await prisma.agentMemory.findMany({ where: where as any });

    res.json(
      rows.map((r: any) => ({
        id: r.id,
        agentId: r.agentId,
        workflowId: r.workflowId,
        executionId: r.executionId,
        memoryType: r.memoryType,
        key: r.key,
        content: r.content,
        metadata: r.metadata,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  },
);

router.delete(
  "/agents/memory/:id",
  authorize("ai:write"),
  async (req, res): Promise<void> => {
    const tenantId = req.tenantId ?? "";
    await prisma.agentMemory.deleteMany({
      where: {
        id: String(req.params.id),
        tenantId,
      } as any,
    });
    res.status(204).end();
  },
);

export default router;

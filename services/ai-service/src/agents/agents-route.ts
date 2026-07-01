import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, agentMemoryTable } from "@longox/db";
import { randomUUID } from "node:crypto";
import { authorize } from "@longox/shared-rbac";

const router: IRouter = Router();

router.post("/agents/run", authorize("ai:run"), async (req, res): Promise<void> => {
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

  const resolvedGoal = goal ?? (variables.goal as string) ?? "Complete the task";

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
    message: "Agent run started. Use the execution endpoint to track progress.",
  });
});

router.get("/agents/memory", authorize("ai:read"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Tenant context required" });
    return;
  }

  const agentId = req.query.agentId as string;
  const memoryType = req.query.memoryType as string;

  const conditions = [eq(agentMemoryTable.tenantId, tenantId)];
  if (agentId) conditions.push(eq(agentMemoryTable.agentId, agentId));
  if (memoryType) conditions.push(eq(agentMemoryTable.memoryType, memoryType));

  const rows = await db
    .select()
    .from(agentMemoryTable)
    .where(and(...conditions));

  res.json(
    rows.map((r) => ({
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
});

router.delete("/agents/memory/:id", authorize("ai:write"), async (req, res): Promise<void> => {
  const tenantId = req.tenantId ?? 0;
  await db
    .delete(agentMemoryTable)
    .where(
      and(
        eq(agentMemoryTable.id, Number(req.params.id)),
        eq(agentMemoryTable.tenantId, tenantId),
      ),
    );
  res.status(204).end();
});

export default router;

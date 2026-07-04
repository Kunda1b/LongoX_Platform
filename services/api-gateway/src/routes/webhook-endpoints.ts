import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { prisma } from "@longox/db/prisma";
import { authorize, requireTenantContext } from "@longox/shared-rbac";

const router: IRouter = Router();

function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function fmt(row: any) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    name: row.name,
    description: row.description ?? null,
    secret: row.secret ?? null,
    isActive: row.isActive,
    lastTriggeredAt: row.lastTriggeredAt
      ? (row.lastTriggeredAt instanceof Date ? row.lastTriggeredAt.toISOString() : new Date(row.lastTriggeredAt).toISOString())
      : null,
    triggerCount: row.triggerCount,
    allowedIps: row.allowedIps ?? [],
    headers: row.headers ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
  };
}

router.get("/webhook-endpoints", authorize("workflows.read"), requireTenantContext, async (req, res): Promise<void> => {
  const workflowId = req.query.workflowId
    ? String(req.query.workflowId)
    : undefined;
  const rows = (await prisma.webhookEndpoint.findMany({
    where: workflowId ? { workflowId } : undefined,
    orderBy: { id: "asc" },
  })) as any[];
  res.json(rows.map(fmt));
});

router.post("/webhook-endpoints", authorize("workflows.write"), requireTenantContext, async (req, res): Promise<void> => {
  const { workflowId, name, description, allowedIps, headers } = req.body as {
    workflowId?: string;
    name?: string;
    description?: string;
    allowedIps?: string[];
    headers?: Record<string, string>;
  };
  if (!workflowId || !name?.trim()) {
    res.status(400).json({ error: "workflowId and name are required" });
    return;
  }

  const workflow = (await prisma.workflow.findUnique({
    where: { id: workflowId },
  })) as any;
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const row = (await prisma.webhookEndpoint.create({
    data: {
      workflowId,
      name: name.trim(),
      description,
      secret: generateSecret(),
      allowedIps: (allowedIps ?? []) as any,
      headers: (headers ?? {}) as any,
    } as any,
  })) as any;

  res.status(201).json(fmt(row));
});

router.get("/webhook-endpoints/:id", authorize("workflows.read"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const row = (await prisma.webhookEndpoint.findUnique({ where: { id } })) as any;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.patch("/webhook-endpoints/:id", authorize("workflows.write"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const b = req.body as Partial<{
    name: string;
    description: string;
    isActive: boolean;
    allowedIps: string[];
    headers: Record<string, string>;
  }>;
  const updates: Record<string, unknown> = {};
  if (b.name !== undefined) updates.name = b.name.trim();
  if (b.description !== undefined) updates.description = b.description;
  if (b.isActive !== undefined) updates.isActive = b.isActive;
  if (b.allowedIps !== undefined) updates.allowedIps = b.allowedIps;
  if (b.headers !== undefined) updates.headers = b.headers;
  const row = (await prisma.webhookEndpoint.update({
    where: { id },
    data: updates as any,
  })) as any;
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.post(
  "/webhook-endpoints/:id/regenerate-secret",
  authorize("workflows.write"),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const id = String(req.params.id);
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }
    const row = (await prisma.webhookEndpoint.update({
      where: { id },
      data: { secret: generateSecret() },
    })) as any;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(fmt(row));
  },
);

router.delete("/webhook-endpoints/:id", authorize("workflows.write"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  await prisma.webhookEndpoint.delete({ where: { id } });
  res.status(204).end();
});

export default router;

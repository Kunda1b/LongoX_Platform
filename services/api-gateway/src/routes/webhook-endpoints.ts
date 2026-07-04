import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db, webhookEndpointsTable, workflowsTable } from "@longox/db";
import { authorize, requireTenantContext } from "@longox/shared-rbac";

const router: IRouter = Router();

function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

function fmt(row: typeof webhookEndpointsTable.$inferSelect) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    name: row.name,
    description: row.description ?? null,
    secret: row.secret ?? null,
    isActive: row.isActive,
    lastTriggeredAt: row.lastTriggeredAt?.toISOString() ?? null,
    triggerCount: row.triggerCount,
    allowedIps: row.allowedIps ?? [],
    headers: row.headers ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/webhook-endpoints", authorize("workflows.read"), requireTenantContext, async (req, res): Promise<void> => {
  const workflowId = req.query.workflowId
    ? String(req.query.workflowId)
    : undefined;
  const rows = workflowId
    ? await db
        .select()
        .from(webhookEndpointsTable)
        .where(eq(webhookEndpointsTable.workflowId, workflowId))
        .orderBy(webhookEndpointsTable.id)
    : await db
        .select()
        .from(webhookEndpointsTable)
        .orderBy(webhookEndpointsTable.id);
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

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, workflowId));
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const [row] = await db
    .insert(webhookEndpointsTable)
    .values({
      workflowId,
      name: name.trim(),
      description,
      secret: generateSecret(),
      allowedIps: allowedIps ?? [],
      headers: headers ?? {},
    })
    .returning();

  res.status(201).json(fmt(row));
});

router.get("/webhook-endpoints/:id", authorize("workflows.read"), requireTenantContext, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [row] = await db
    .select()
    .from(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.id, id));
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
  const [row] = await db
    .update(webhookEndpointsTable)
    .set(updates)
    .where(eq(webhookEndpointsTable.id, id))
    .returning();
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
    const [row] = await db
      .update(webhookEndpointsTable)
      .set({ secret: generateSecret() })
      .where(eq(webhookEndpointsTable.id, id))
      .returning();
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
  await db
    .delete(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.id, id));
  res.status(204).end();
});

export default router;

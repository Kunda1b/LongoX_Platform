import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, webhookEndpointsTable } from "@longox/db";

const router: IRouter = Router();

router.get("/webhook-endpoints", async (_req, res): Promise<void> => {
  const endpoints = await db
    .select()
    .from(webhookEndpointsTable)
    .orderBy(desc(webhookEndpointsTable.createdAt));
  res.json(endpoints);
});

router.get("/webhook-endpoints/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [endpoint] = await db
    .select()
    .from(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.id, id))
    .limit(1);
  if (!endpoint) {
    res.status(404).json({ error: "Webhook endpoint not found" });
    return;
  }

  res.json(endpoint);
});

router.post("/webhook-endpoints", async (req, res): Promise<void> => {
  const { workflowId, name, description } = req.body as Record<string, unknown>;
  if (!workflowId || !name) {
    res.status(400).json({ error: "workflowId and name are required" });
    return;
  }

  const [endpoint] = await db
    .insert(webhookEndpointsTable)
    .values({
      workflowId: Number(workflowId),
      name: String(name),
      description: description ? String(description) : null,
      secret:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
    })
    .returning();

  res.status(201).json(endpoint);
});

router.delete("/webhook-endpoints/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [endpoint] = await db
    .delete(webhookEndpointsTable)
    .where(eq(webhookEndpointsTable.id, id))
    .returning();
  if (!endpoint) {
    res.status(404).json({ error: "Webhook endpoint not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

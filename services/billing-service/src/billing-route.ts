import { Router, type IRouter } from "express";
import { eq, sql, gte, and } from "drizzle-orm";
import {
  db,
  usageEventsTable,
  executionsTable,
  workflowsTable,
  connectorsTable,
} from "@longox/db";

const router: IRouter = Router();

// ─── Lazy seed usage events from executions ─────────────────────────────────

let seeded = false;

async function ensureUsageEvents() {
  if (seeded) return;
  seeded = true;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageEventsTable);
  if (count > 0) return;

  const executions = await db
    .select({
      id: executionsTable.id,
      workflowId: executionsTable.workflowId,
      workflowName: executionsTable.workflowName,
      startedAt: executionsTable.startedAt,
      status: executionsTable.status,
    })
    .from(executionsTable)
    .limit(200);

  if (executions.length === 0) return;

  const events = executions.map((e) => ({
    workflowId: e.workflowId,
    workflowName: e.workflowName,
    eventType: "workflow.run",
    quantity: 1,
    metadata: { executionId: e.id, status: e.status } as Record<
      string,
      unknown
    >,
    createdAt: e.startedAt,
  }));

  // Also seed some connector.call events
  const connectorEvents = executions
    .slice(0, Math.floor(executions.length * 0.7))
    .map((e) => ({
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      eventType: "connector.call",
      quantity: Math.floor(Math.random() * 5) + 1,
      metadata: { executionId: e.id } as Record<string, unknown>,
      createdAt: e.startedAt,
    }));

  await db.insert(usageEventsTable).values([...events, ...connectorEvents]);
}

// ─── Usage summary ────────────────────────────────────────────────────────────

router.get("/usage", async (_req, res): Promise<void> => {
  await ensureUsageEvents();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allExecs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(executionsTable);
  const [monthExecs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(executionsTable)
    .where(gte(executionsTable.startedAt, monthStart));
  const [allWorkflows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflowsTable);
  const [activeWorkflows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflowsTable)
    .where(eq(workflowsTable.status, "active"));
  const [allConnectors] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connectorsTable);
  const [installedConnectors] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connectorsTable)
    .where(eq(connectorsTable.isInstalled, true));

  // Compute current period cost from usage events
  const monthEvents = await db
    .select({
      eventType: usageEventsTable.eventType,
      quantity: usageEventsTable.quantity,
    })
    .from(usageEventsTable)
    .where(gte(usageEventsTable.createdAt, monthStart));

  const prices: Record<string, number> = {
    "workflow.run": 0.01,
    "connector.call": 0.005,
    "webhook.received": 0.002,
  };

  const cost = monthEvents.reduce(
    (sum, e) => sum + (prices[e.eventType] ?? 0.001) * e.quantity,
    0,
  );

  res.json({
    totalExecutions: allExecs.count,
    executionsThisMonth: monthExecs.count,
    totalWorkflows: allWorkflows.count,
    activeWorkflows: activeWorkflows.count,
    totalConnectors: allConnectors.count,
    usedConnectors: installedConnectors.count,
    currentPeriodCost: Math.round(cost * 100) / 100,
    budgetLimit: 500,
  });
});

// ─── Usage events ─────────────────────────────────────────────────────────────

router.get("/usage/events", async (req, res): Promise<void> => {
  await ensureUsageEvents();

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const workflowId = req.query.workflowId ? Number(req.query.workflowId) : null;
  const eventType = req.query.eventType as string | undefined;

  const conditions = [];
  if (workflowId) conditions.push(eq(usageEventsTable.workflowId, workflowId));
  if (eventType) conditions.push(eq(usageEventsTable.eventType, eventType));

  const events = await db
    .select()
    .from(usageEventsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${usageEventsTable.createdAt} desc`)
    .limit(limit);

  res.json(
    events.map((e) => ({
      id: e.id,
      workflowId: e.workflowId ?? null,
      workflowName: e.workflowName ?? null,
      eventType: e.eventType,
      quantity: e.quantity,
      metadata: e.metadata ?? {},
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

// ─── Billing – current period ─────────────────────────────────────────────────

router.get("/billing/current", async (_req, res): Promise<void> => {
  await ensureUsageEvents();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  const events = await db
    .select({
      eventType: usageEventsTable.eventType,
      quantity: usageEventsTable.quantity,
    })
    .from(usageEventsTable)
    .where(gte(usageEventsTable.createdAt, periodStart));

  const prices: Record<string, number> = {
    "workflow.run": 0.01,
    "connector.call": 0.005,
    "webhook.received": 0.002,
  };

  const breakdown: Record<string, { quantity: number; total: number }> = {};
  for (const e of events) {
    if (!breakdown[e.eventType])
      breakdown[e.eventType] = { quantity: 0, total: 0 };
    breakdown[e.eventType].quantity += e.quantity;
    breakdown[e.eventType].total += (prices[e.eventType] ?? 0.001) * e.quantity;
  }

  const usageBreakdown = Object.entries(breakdown).map(([label, data]) => ({
    label,
    quantity: data.quantity,
    unitCost: prices[label] ?? 0.001,
    total: Math.round(data.total * 100) / 100,
  }));

  const totalAmount = usageBreakdown.reduce((s, l) => s + l.total, 0);

  res.json({
    start: periodStart.toISOString(),
    end: periodEnd.toISOString(),
    totalAmount: Math.round(totalAmount * 100) / 100,
    usageBreakdown,
  });
});

// ─── Billing – invoices ───────────────────────────────────────────────────────

router.get("/billing/invoices", async (_req, res): Promise<void> => {
  await ensureUsageEvents();

  const now = new Date();
  const invoices = [];
  const prices: Record<string, number> = {
    "workflow.run": 0.01,
    "connector.call": 0.005,
    "webhook.received": 0.002,
  };

  for (let i = 1; i <= 3; i++) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
    );

    const events = await db
      .select({
        eventType: usageEventsTable.eventType,
        quantity: usageEventsTable.quantity,
      })
      .from(usageEventsTable)
      .where(
        and(
          gte(usageEventsTable.createdAt, periodStart),
          sql`${usageEventsTable.createdAt} <= ${periodEnd}`,
        ),
      );

    const breakdown: Record<string, { quantity: number; total: number }> = {};
    for (const e of events) {
      if (!breakdown[e.eventType])
        breakdown[e.eventType] = { quantity: 0, total: 0 };
      breakdown[e.eventType].quantity += e.quantity;
      breakdown[e.eventType].total +=
        (prices[e.eventType] ?? 0.001) * e.quantity;
    }

    const lineItems = Object.entries(breakdown).map(([label, data]) => ({
      label,
      quantity: data.quantity,
      unitCost: prices[label] ?? 0.001,
      total: Math.round(data.total * 100) / 100,
    }));

    const total = lineItems.reduce((s, l) => s + l.total, 0);

    invoices.push({
      id: i,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalAmount: Math.round(total * 100) / 100,
      status: i === 1 ? "pending" : "paid",
      lineItems,
      createdAt: periodEnd.toISOString(),
    });
  }

  res.json(invoices);
});

export default router;

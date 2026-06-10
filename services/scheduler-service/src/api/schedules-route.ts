import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, schedulesTable } from "@longox/db";
import { PostgresScheduleRepository } from "../infrastructure";
import {
  CreateScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
} from "../application";

const router: IRouter = Router();
const scheduleRepo = new PostgresScheduleRepository();
const createSchedule = new CreateScheduleCommand(scheduleRepo);
const updateSchedule = new UpdateScheduleCommand(scheduleRepo);
const deleteSchedule = new DeleteScheduleCommand(scheduleRepo);

function serializeSchedule(row: typeof schedulesTable.$inferSelect) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workflowId: row.workflowId,
    name: row.name,
    description: row.description ?? null,
    interval: row.interval,
    cronExpression: row.cronExpression ?? null,
    timezone: row.timezone,
    status: row.status,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt?.toISOString() ?? null,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    nextRunAt: row.nextRunAt?.toISOString() ?? null,
    maxRuns: row.maxRuns ?? null,
    runCount: row.runCount,
    retryOnFailure: row.retryOnFailure,
    maxRetries: row.maxRetries,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/schedules", async (req, res): Promise<void> => {
  const tenantId = Number(req.query.tenantId) || undefined;
  const workflowId = Number(req.query.workflowId) || undefined;
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  let query = db.select().from(schedulesTable).$dynamic();
  if (tenantId) query = query.where(eq(schedulesTable.tenantId, tenantId));
  if (workflowId)
    query = query.where(eq(schedulesTable.workflowId, workflowId));
  if (status) query = query.where(eq(schedulesTable.status, status));

  const rows = await query.orderBy(desc(schedulesTable.createdAt)).limit(limit);
  res.json(rows.map(serializeSchedule));
});

router.get("/schedules/due", async (_req, res): Promise<void> => {
  const rows = await scheduleRepo.findDueSchedules(new Date());
  res.json(rows.map((s) => s.toJSON()));
});

router.get("/schedules/stats", async (_req, res): Promise<void> => {
  const active = await scheduleRepo.countByStatus("active");
  const paused = await scheduleRepo.countByStatus("paused");
  const completed = await scheduleRepo.countByStatus("completed");
  res.json({ active, paused, completed });
});

router.get("/schedules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(schedulesTable)
    .where(eq(schedulesTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }

  res.json(serializeSchedule(row));
});

router.post("/schedules", async (req, res): Promise<void> => {
  const {
    tenantId,
    workflowId,
    name,
    description,
    interval,
    cronExpression,
    timezone,
    startAt,
    endAt,
    maxRuns,
    retryOnFailure,
    maxRetries,
    metadata,
  } = req.body as Record<string, unknown>;

  if (!tenantId || !workflowId || !name || !interval) {
    res
      .status(400)
      .json({ error: "tenantId, workflowId, name, and interval are required" });
    return;
  }

  try {
    const schedule = await createSchedule.execute({
      tenantId: Number(tenantId),
      workflowId: Number(workflowId),
      name: String(name),
      description: description ? String(description) : undefined,
      interval: String(interval) as any,
      cronExpression: cronExpression ? String(cronExpression) : undefined,
      timezone: timezone ? String(timezone) : undefined,
      startAt: startAt ? new Date(String(startAt)) : undefined,
      endAt: endAt ? new Date(String(endAt)) : undefined,
      maxRuns: maxRuns ? Number(maxRuns) : undefined,
      retryOnFailure: Boolean(retryOnFailure),
      maxRetries: maxRetries ? Number(maxRetries) : undefined,
      metadata: metadata as Record<string, unknown> | undefined,
    });
    res.status(201).json(schedule.toJSON());
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch("/schedules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const schedule = await updateSchedule.execute(id, req.body);
    res.json(schedule.toJSON());
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.delete("/schedules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await deleteSchedule.execute(id);
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

router.post("/schedules/:id/pause", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .update(schedulesTable)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(schedulesTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }
  res.json(serializeSchedule(row));
});

router.post("/schedules/:id/activate", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .update(schedulesTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(schedulesTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }
  res.json(serializeSchedule(row));
});

export default router;

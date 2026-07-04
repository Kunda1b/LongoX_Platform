import { Router, type IRouter } from "express";
import { prisma } from "@longox/db/prisma";
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

function serializeSchedule(row: any) {
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
    startAt: row.startAt instanceof Date ? row.startAt.toISOString() : row.startAt,
    endAt: row.endAt ? (row.endAt instanceof Date ? row.endAt.toISOString() : row.endAt) : null,
    lastRunAt: row.lastRunAt ? (row.lastRunAt instanceof Date ? row.lastRunAt.toISOString() : row.lastRunAt) : null,
    nextRunAt: row.nextRunAt ? (row.nextRunAt instanceof Date ? row.nextRunAt.toISOString() : row.nextRunAt) : null,
    maxRuns: row.maxRuns ?? null,
    runCount: row.runCount,
    retryOnFailure: row.retryOnFailure,
    maxRetries: row.maxRetries,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

router.get("/schedules", async (req, res): Promise<void> => {
  const tenantId = String(req.query.tenantId) || undefined;
  const workflowId = String(req.query.workflowId) || undefined;
  const status = req.query.status as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (workflowId) where.workflowId = workflowId;
  if (status) where.status = status;

  const rows = await prisma.schedule.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
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
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const row = await prisma.schedule.findUnique({ where: { id } });
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
      tenantId: String(tenantId),
      workflowId: String(workflowId),
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
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
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
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
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
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const row = await prisma.schedule.update({
    where: { id },
    data: { status: "paused", updatedAt: new Date() } as any,
  }).catch(() => null);

  if (!row) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }
  res.json(serializeSchedule(row));
});

router.post("/schedules/:id/activate", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const row = await prisma.schedule.update({
    where: { id },
    data: { status: "active", updatedAt: new Date() } as any,
  }).catch(() => null);

  if (!row) {
    res.status(404).json({ error: "Schedule not found" });
    return;
  }
  res.json(serializeSchedule(row));
});

export default router;

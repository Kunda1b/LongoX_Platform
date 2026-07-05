import { Router, type IRouter } from "express";
import { authorize, requireTenantContext } from "@longox/shared-rbac";
import { PostgresMeteringRepository } from "../../infrastructure/postgres-metering-repository";
import {
  RecordEventCommand,
  GetUsageSummaryQuery,
} from "../../application/record-event.command";
import type { EventType } from "../../domain";

const router: IRouter = Router();
const repository = new PostgresMeteringRepository();
const recordEventCommand = new RecordEventCommand(repository);
const getUsageSummaryQuery = new GetUsageSummaryQuery(repository);

router.post(
  "/metering/events",
  authorize({ resource: "billing", action: "write" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;
    const {
      eventType,
      quantity,
      unit,
      metadata,
      source,
      sourceId,
      workflowId,
      executionId,
    } = req.body as Record<string, unknown>;

    if (!eventType || !source) {
      res.status(400).json({ error: "eventType and source are required" });
      return;
    }

    try {
      const event = await recordEventCommand.execute({
        tenantId,
        eventType: eventType as EventType,
        quantity: Number(quantity ?? 1),
        unit: String(unit ?? "count"),
        metadata: (metadata ?? {}) as Record<string, unknown>,
        source: String(source),
        sourceId: sourceId ? String(sourceId) : undefined,
        workflowId: workflowId ? String(workflowId) : undefined,
        executionId: executionId ? String(executionId) : undefined,
      });
      res.status(201).json(event.toJSON());
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/metering/summary",
  authorize({ resource: "billing", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    try {
      const summary = await getUsageSummaryQuery.execute({
        tenantId,
        from,
        to,
      });
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

router.get(
  "/metering/events",
  authorize({ resource: "billing", action: "read" }),
  requireTenantContext,
  async (req, res): Promise<void> => {
    const tenantId = req.user!.tenantId!;
    const eventType = req.query.eventType as string | undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const workflowId = req.query.workflowId
      ? String(req.query.workflowId)
      : undefined;
    const limit = Number(req.query.limit) || 100;

    try {
      const events = await repository.findEvents(tenantId, {
        eventType: eventType as EventType,
        from,
        to,
        workflowId,
        limit,
      });
      res.json(events.map((e) => e.toJSON()));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;

import { Router, type IRouter } from "express";
import { MeteringService } from "../application/services/metering.service";
import { UsageRollupService } from "../application/services/usage-rollup.service";

const router: IRouter = Router();
const meteringService = new MeteringService();
const usageRollupService = new UsageRollupService();

const SERVICE_API_KEY = process.env.SERVICE_API_KEY ?? "";

function requireServiceKey(req: any, res: any, next: any): void {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (!SERVICE_API_KEY) {
    next();
    return;
  }
  if (apiKey !== SERVICE_API_KEY) {
    res.status(401).json({ error: "Invalid service API key" });
    return;
  }
  next();
}

router.use(requireServiceKey);

router.post("/api/metering/events", async (req, res): Promise<void> => {
  const { events } = req.body as { events?: Array<{
    eventId: string;
    eventType: string;
    tenantId: number;
    quantity: string | number;
    unit: string;
    workflowId?: number | null;
    executionId?: number | null;
    connectorId?: number | null;
    dashboardId?: number | null;
    metadata?: Record<string, unknown>;
    timestamp?: string;
  }> };

  if (!events || !Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: "events array is required" });
    return;
  }

  try {
    for (const event of events) {
      await meteringService.record({
        eventId: event.eventId,
        eventType: event.eventType,
        tenantId: event.tenantId,
        quantity: event.quantity,
        unit: event.unit,
        workflowId: event.workflowId ?? null,
        executionId: event.executionId ?? null,
        connectorId: event.connectorId ?? null,
        dashboardId: event.dashboardId ?? null,
        metadata: event.metadata ?? {},
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      });
    }
    res.status(201).json({ recorded: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.post("/api/metering/events/rollup", async (req, res): Promise<void> => {
  const { tenantId } = req.body as { tenantId?: number };

  if (!tenantId) {
    res.status(400).json({ error: "tenantId is required" });
    return;
  }

  try {
    await usageRollupService.rollupAll(tenantId);
    res.json({ rolledUp: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;

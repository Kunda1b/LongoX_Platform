import { Router, type Request, type Response } from "express";
import { realtimeHub } from "@autoflow/shared-realtime";
import { createEvent, type PlatformEventType } from "@autoflow/shared-events";
import { logger } from "../lib/logger";

const router = Router();

const INTERNAL_API_KEY = process.env["INTERNAL_API_KEY"];

router.post("/events/publish", (req: Request, res: Response) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (INTERNAL_API_KEY && apiKey !== INTERNAL_API_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { type, aggregateId, aggregateType, payload, actorId, actorType, correlationId } = req.body as {
    type: PlatformEventType;
    aggregateId: string;
    aggregateType: string;
    payload?: Record<string, unknown>;
    actorId?: string;
    actorType?: "user" | "system" | "webhook" | "schedule";
    correlationId?: string;
  };

  if (!type || !aggregateId || !aggregateType) {
    res.status(400).json({ error: "Missing required fields: type, aggregateId, aggregateType" });
    return;
  }

  const event = createEvent(
    type,
    aggregateId,
    aggregateType,
    payload ?? {},
    { id: actorId, type: actorType },
    correlationId,
  );

  realtimeHub.broadcast(event);

  logger.info({ eventType: type, aggregateId }, "[EventsBridge] Event published");

  res.json({ success: true, eventId: event.id });
});

export default router;

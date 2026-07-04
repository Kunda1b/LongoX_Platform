import { Router, type IRouter } from "express";
import {
  PostgresWebhookEndpointRepository,
  PostgresWebhookDeliveryRepository,
} from "../../infrastructure/postgres/webhook-repository";
import { HttpWebhookDeliveryService } from "../../infrastructure/webhook/webhook-delivery";
import { SendWebhookCommand } from "../../application/commands/send-webhook.command";

const router: IRouter = Router();
const endpointRepository = new PostgresWebhookEndpointRepository();
const deliveryRepository = new PostgresWebhookDeliveryRepository();
const deliveryService = new HttpWebhookDeliveryService(deliveryRepository);
const sendWebhook = new SendWebhookCommand(endpointRepository, deliveryService);

router.get("/webhooks/endpoints", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) {
    res.status(400).json({ error: "tenantId is required" });
    return;
  }
  const rows = await endpointRepository.list(tenantId);
  res.json(rows);
});

router.post("/webhooks/endpoints", async (req, res): Promise<void> => {
  try {
    const { tenantId, url, secret, events } = req.body;
    if (!tenantId || !url || !events?.length) {
      res.status(400).json({ error: "tenantId, url, and events are required" });
      return;
    }
    const endpoint = await endpointRepository.create({
      tenantId,
      url,
      secret,
      events,
    });
    res.status(201).json(endpoint);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.delete("/webhooks/endpoints/:id", async (req, res): Promise<void> => {
  const deleted = await endpointRepository.delete(String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.get("/webhooks/deliveries", async (req, res): Promise<void> => {
  const endpointId = req.query.endpointId as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = Number(req.query.limit ?? 50);
  const rows = await deliveryRepository.list({ endpointId, status, limit });
  res.json(rows);
});

router.post("/webhooks/send", async (req, res): Promise<void> => {
  try {
    const { tenantId, eventType, payload } = req.body;
    if (!tenantId || !eventType || !payload) {
      res.status(400).json({ error: "tenantId, eventType, and payload are required" });
      return;
    }
    const result = await sendWebhook.execute({ tenantId, eventType, payload });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;

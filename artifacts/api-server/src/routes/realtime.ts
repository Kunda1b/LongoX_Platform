import { Router, type Request, type Response } from "express";
import { createSseWriter, realtimeHub } from "@longox/shared-realtime";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.get(
  "/realtime/events",
  authMiddleware,
  (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const client = createSseWriter(res);
    client.interests.clear();
    client.interests.add("execution.started");
    client.interests.add("execution.completed");
    client.interests.add("execution.failed");
    client.interests.add("execution.cancelled");
    client.interests.add("workflow.published");
    client.interests.add("workflow.activated");
    client.interests.add("notification.new");

    const unregister = realtimeHub.register(client, {
      tenantId: String(user.tenantId ?? ""),
    });

    res.on("close", () => {
      unregister();
    });
  },
);

router.get(
  "/realtime/executions/:id",
  authMiddleware,
  (req: Request, res: Response) => {
    const executionId = req.params.id;
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const client = createSseWriter(res);
    client.interests.clear();
    client.interests.add("*");

    const unregister = realtimeHub.register(client, {
      tenantId: String(user.tenantId ?? ""),
      aggregateIds: [executionId],
    });

    client.send("connected", {
      executionId,
      message: "Monitoring execution updates",
    });

    res.on("close", () => {
      unregister();
    });
  },
);

export default router;

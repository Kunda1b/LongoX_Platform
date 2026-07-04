import { Router, type IRouter } from "express";
import { PostgresNotificationRepository } from "../../infrastructure/postgres/notification-repository";
import { ListNotificationsQuery } from "../../application/queries/list-notifications.query";
import { CreateNotificationCommand } from "../../application/commands/create-notification.command";
import { MarkNotificationReadCommand } from "../../application/commands/mark-notification-read.command";

const router: IRouter = Router();
const repository = new PostgresNotificationRepository();
const listNotifications = new ListNotificationsQuery(repository);
const createNotification = new CreateNotificationCommand(repository);
const markRead = new MarkNotificationReadCommand(repository);

router.get("/notifications", async (req, res): Promise<void> => {
  const recipientId = req.query.recipientId as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = Number(req.query.limit ?? 50);
  const rows = await listNotifications.execute({ recipientId, status, limit });
  res.json(rows);
});

router.post("/notifications", async (req, res): Promise<void> => {
  try {
    const row = await createNotification.execute(req.body as { title: string });
    res.status(201).json(row);
  } catch {
    res.status(400).json({ error: "title required" });
  }
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const row = await markRead.execute(String(req.params.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

export default router;

import { Router, type IRouter } from "express";
import { PostgresNotificationTemplateRepository } from "../../infrastructure/postgres/notification-template-repository";
import { ListNotificationTemplatesQuery } from "../../application/queries/list-notification-templates.query";
import { CreateNotificationTemplateCommand } from "../../application/commands/create-notification-template.command";

const router: IRouter = Router();
const repository = new PostgresNotificationTemplateRepository();
const listTemplates = new ListNotificationTemplatesQuery(repository);
const createTemplate = new CreateNotificationTemplateCommand(repository);

router.get("/notification-templates", async (_req, res): Promise<void> => {
  const rows = await listTemplates.execute();
  res.json(rows);
});

router.post("/notification-templates", async (req, res): Promise<void> => {
  try {
    const row = await createTemplate.execute(
      req.body as { name: string; body: string },
    );
    res.status(201).json(row);
  } catch {
    res.status(400).json({ error: "name and body required" });
  }
});

export default router;

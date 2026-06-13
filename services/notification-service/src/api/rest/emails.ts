import { Router, type IRouter } from "express";
import { PostgresEmailRepository } from "../../infrastructure/postgres/email-repository";
import { createEmailSender } from "../../infrastructure/email/ses-sender";
import { SendEmailCommand } from "../../application/commands/send-email.command";

const router: IRouter = Router();
const emailRepository = new PostgresEmailRepository();
const emailSender = createEmailSender();
const sendEmail = new SendEmailCommand(emailRepository, emailSender);

router.get("/emails", async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const limit = Number(req.query.limit ?? 50);
  const rows = await emailRepository.list({ status, limit });
  res.json(rows);
});

router.post("/emails/send", async (req, res): Promise<void> => {
  try {
    const { to, subject, body, htmlBody, templateName, metadata } = req.body;
    if (!to || !subject || !body) {
      res.status(400).json({ error: "to, subject, and body are required" });
      return;
    }
    const result = await sendEmail.execute({
      to,
      subject,
      body,
      htmlBody,
      templateName,
      metadata,
    });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;

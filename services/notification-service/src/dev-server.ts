import express from "express";
import pino from "pino-http";
import { notificationsRouter, notificationTemplatesRouter } from "./index";

const app = express();
app.use(pino());
app.use(express.json());
app.use(notificationsRouter);
app.use(notificationTemplatesRouter);

const PORT = parseInt(process.env.PORT ?? "3005", 10);
app.listen(PORT, () => {
  console.log(`[Notification Service] Dev server on port ${PORT}`);
});

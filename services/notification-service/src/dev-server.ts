import { initTelemetry } from "@longox/shared-observability";

initTelemetry({
  serviceName: "notification-service",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

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

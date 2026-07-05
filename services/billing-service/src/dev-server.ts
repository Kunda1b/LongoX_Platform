import { initTelemetry } from "@longox/shared-observability";

initTelemetry({
  serviceName: "billing-service",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

import express from "express";
import pino from "pino-http";
import {
  usageRouter,
  billingRouter,
  checkoutRouter,
  plansRouter,
  webhookRouter,
} from "./index";

const app = express();
app.use(pino());
app.use(express.json());
app.use(usageRouter);
app.use(billingRouter);
app.use(checkoutRouter);
app.use(plansRouter);
app.use(webhookRouter);

const PORT = parseInt(process.env.PORT ?? "3006", 10);
app.listen(PORT, () => {
  console.log(`[Billing Service] Dev server on port ${PORT}`);
});

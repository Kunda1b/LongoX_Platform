import { initTelemetry } from "@longox/shared-observability";

initTelemetry({
  serviceName: "workflow-service",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

import express from "express";
import pino from "pino-http";
import { workflowsRouter } from "./index";

const app = express();
app.use(pino());
app.use(express.json());
app.use(workflowsRouter);

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => {
  console.log(`[Workflow Service] Dev server on port ${PORT}`);
});

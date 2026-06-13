import { initTelemetry } from "@longox/shared-observability";
import app from "./app";

// Initialize OpenTelemetry before any other imports
initTelemetry({
  serviceName: "api-gateway",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.listen(PORT, () => {
  console.log(`[API Gateway] Listening on port ${PORT}`);
});

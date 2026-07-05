import { initTelemetry } from "@longox/shared-observability";
import IORedis from "ioredis";
import { setRedisClient } from "@longox/shared-realtime";
import app from "./app";

// Initialize OpenTelemetry before any other imports
initTelemetry({
  serviceName: "api-gateway",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

// ─── Redis-backed execution event bus (multi-instance SSE fanout) ────────────
// Wires the shared-realtime execution bus to Redis pub/sub so that execution
// events broadcast from any gateway instance (or from the execution-service
// worker, which runs in-process here) reach SSE clients connected to any
// other instance. Falls back to in-memory-only fanout if REDIS_URL is unset.
const redisUrl = process.env["REDIS_URL"];
if (redisUrl) {
  const pub = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  const sub = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  setRedisClient({
    publish: (channel: string, message: string) =>
      pub.publish(channel, message),
    subscribe: (channel: string, listener: (message: string) => void) => {
      sub.subscribe(channel);
      sub.on("message", (ch, msg) => {
        if (ch === channel) listener(msg);
      });
      return Promise.resolve();
    },
    unsubscribe: (channel: string) =>
      sub.unsubscribe(channel).then(() => undefined),
  });

  console.log(
    "[API Gateway] Execution event bus connected to Redis for multi-instance SSE fanout",
  );
} else {
  console.warn(
    "[API Gateway] REDIS_URL not set — SSE execution events are in-memory only (single instance)",
  );
}

const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.listen(PORT, () => {
  console.log(`[API Gateway] Listening on port ${PORT}`);
});

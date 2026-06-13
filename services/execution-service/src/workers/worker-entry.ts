import { initTelemetry } from "@longox/shared-observability";
import { jobQueue } from "../queue/bullmq-queue";

// Initialize OpenTelemetry before any other imports
initTelemetry({
  serviceName: "execution-worker",
  serviceVersion: process.env.npm_package_version ?? "0.0.0",
  environment: process.env.NODE_ENV ?? "development",
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function startWorker(): Promise<void> {
  console.log("[Worker] Starting execution worker...");

  await jobQueue.start();

  const stats = await jobQueue.getStats();
  console.log("[Worker] Queue stats:", stats);

  console.log("[Worker] Worker ready. Listening for jobs...");
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[Worker] Received ${signal}, shutting down gracefully...`);

  const shutdownTimer = setTimeout(() => {
    console.error("[Worker] Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await jobQueue.stop();
    console.log("[Worker] Worker stopped cleanly");
    clearTimeout(shutdownTimer);
    process.exit(0);
  } catch (err) {
    console.error("[Worker] Error during shutdown:", err);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Worker] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Worker] Uncaught exception:", err);
  shutdown("uncaughtException");
});

startWorker().catch((err) => {
  console.error("[Worker] Failed to start:", err);
  process.exit(1);
});

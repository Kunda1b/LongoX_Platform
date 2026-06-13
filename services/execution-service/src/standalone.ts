import express from "express";
import cors from "cors";
import pino from "pino-http";
import { executionsRouter } from "@longox/execution-service";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3002", 10);

app.use(cors());
app.use(pino());
app.use(express.json());

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({ status: "ok", service: "execution-service", port: PORT });
});

app.get("/api/ready", (_req, res) => {
  res.json({ ready: true, service: "execution-service" });
});

app.use(executionsRouter);

app.listen(PORT, () => {
  console.log(`[execution-service] Running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("[execution-service] Shutting down...");
  process.exit(0);
});

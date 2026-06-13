import express from "express";
import cors from "cors";
import pino from "pino-http";
import {
  aiModelsRouter,
  aiRunsRouter,
  promptsRouter,
  aiUsageRouter,
  aiRoutingPoliciesRouter,
  aiPlaygroundRouter,
  promptsGovernanceRouter,
  agentsRouter,
} from "@longox/ai-service";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3003", 10);

app.use(cors());
app.use(pino());
app.use(express.json());

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({ status: "ok", service: "ai-service", port: PORT });
});

app.get("/api/ready", (_req, res) => {
  res.json({ ready: true, service: "ai-service" });
});

app.use(aiModelsRouter);
app.use(aiRunsRouter);
app.use(promptsRouter);
app.use(aiUsageRouter);
app.use(aiRoutingPoliciesRouter);
app.use(aiPlaygroundRouter);
app.use(promptsGovernanceRouter);
app.use(agentsRouter);

app.listen(PORT, () => {
  console.log(`[ai-service] Running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("[ai-service] Shutting down...");
  process.exit(0);
});

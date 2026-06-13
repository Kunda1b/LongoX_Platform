import express from "express";
import cors from "cors";
import pino from "pino-http";
import {
  billingRouter,
  usageRouter,
  checkoutRouter,
  plansRouter,
  webhookRouter,
} from "@longox/billing-service";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3004", 10);

app.use(cors());
app.use(pino());
app.use(express.json());

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({ status: "ok", service: "billing-service", port: PORT });
});

app.get("/api/ready", (_req, res) => {
  res.json({ ready: true, service: "billing-service" });
});

app.use(webhookRouter);
app.use(billingRouter);
app.use(checkoutRouter);
app.use(plansRouter);
app.use(usageRouter);

app.listen(PORT, () => {
  console.log(`[billing-service] Running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("[billing-service] Shutting down...");
  process.exit(0);
});

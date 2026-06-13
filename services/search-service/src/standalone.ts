import express from "express";
import cors from "cors";
import pino from "pino-http";
import { searchRouter } from "@longox/search-service";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3005", 10);

app.use(cors());
app.use(pino());
app.use(express.json());

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({ status: "ok", service: "search-service", port: PORT });
});

app.get("/api/ready", (_req, res) => {
  res.json({ ready: true, service: "search-service" });
});

app.use(searchRouter);

app.listen(PORT, () => {
  console.log(`[search-service] Running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("[search-service] Shutting down...");
  process.exit(0);
});

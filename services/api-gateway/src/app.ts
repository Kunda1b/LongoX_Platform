import express from "express";
import pino from "pino-http";
import cors from "cors";
import authRouter from "./routes/auth";
import mfaRouter from "./routes/mfa";
import ssoRouter from "./routes/sso";
import webhookEndpointsRouter from "./routes/webhook-endpoints";
import { authMiddleware } from "./lib/auth";
import { apiRateLimiter } from "./lib/rate-limiter";

const app = express();

app.use(cors());
app.use(pino());
app.use(express.json());

// Rate limiting on all routes
app.use(apiRateLimiter.middleware());

// Public routes
app.use(authRouter);

// Protected routes
app.use(authMiddleware);
app.use(mfaRouter);
app.use(ssoRouter);
app.use(webhookEndpointsRouter);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

export default app;

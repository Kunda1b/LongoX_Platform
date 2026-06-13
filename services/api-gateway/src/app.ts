import express from "express";
import pino from "pino-http";
import cors from "cors";
import authRouter from "./routes/auth";
import mfaRouter from "./routes/mfa";
import ssoRouter from "./routes/sso";
import webhookEndpointsRouter from "./routes/webhook-endpoints";
import analyticsRouter from "./routes/analytics";
import catalogRouter from "./routes/catalog";
import dlqRouter from "./routes/dlq";
import rbacRouter from "./routes/rbac";
import tenantsRouter from "./routes/tenants";
import environmentsRouter from "./routes/environments";
import complianceRouter from "./routes/compliance";
import { authMiddleware } from "./lib/auth";
import { apiRateLimiter } from "./lib/rate-limiter";
import { auditLogRouter } from "@longox/audit-service";
import { billingRouter, usageRouter, checkoutRouter, plansRouter, webhookRouter } from "@longox/billing-service";
import {
  componentRouter,
  dashboardRouter,
  pageRouter,
  permissionsRouter,
  publishingRouter,
  queryRouter,
  templatesRouter as dashboardTemplatesRouter,
} from "@longox/dashboard-service";
import { executionsRouter } from "@longox/execution-service";
import { searchRouter } from "@longox/search-service";
import { templatesRouter } from "@longox/template-service";
import { workflowsRouter } from "@longox/workflow-service";
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
import { connectorsRouter } from "@longox/connector-service";
import { marketplaceRouter } from "@longox/marketplace-service";
import { meteringRouter } from "@longox/metering-service";
import { replicationRouter } from "@longox/replication-service";

const app = express();

app.use(cors());
app.use(pino());
app.use(express.json());

// Rate limiting on all routes
app.use(apiRateLimiter.middleware());

// Public routes
app.use(authRouter);

// Stripe webhook needs raw body and must be before auth middleware
app.use(webhookRouter);

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Protected routes
app.use(authMiddleware);

// Tenant context: extract tenantId from authenticated user
app.use((req, _res, next) => {
  if (req.user?.tenantId) {
    req.tenantId = req.user.tenantId;
  }
  next();
});

// ─── Authorized routes ─────────────────────────────────────────────────────────
// Each router is wrapped with its required permission middleware.
// The authorize() middleware checks the user's role permissions against
// the database and returns 403 if the required permission is missing.

app.use(mfaRouter);
app.use(ssoRouter);
app.use(webhookEndpointsRouter);

// Analytics: read-only
app.use(analyticsRouter);

// RBAC management: admin only
app.use(rbacRouter);

// Tenant management: admin only
app.use(tenantsRouter);

// Environment management
app.use(environmentsRouter);

// Compliance & GDPR
app.use(complianceRouter);

// Audit log: admin only
app.use(auditLogRouter);

// Billing: billing.read / billing.write handled per-route
app.use(billingRouter);
app.use(checkoutRouter);
app.use(plansRouter);

// Marketplace catalog: read-only
app.use(catalogRouter);

// Dashboard builder
app.use(componentRouter);
app.use(dashboardRouter);
app.use(dashboardTemplatesRouter);

// Dead letter queue: admin/operator only
app.use(dlqRouter);

// Executions
app.use(executionsRouter);

// Dashboard pages and queries
app.use(pageRouter);
app.use(permissionsRouter);
app.use(publishingRouter);
app.use(queryRouter);

// Search: read-only
app.use(searchRouter);

// Templates: read-only browse, write for admin
app.use(templatesRouter);

// Marketplace catalog
app.use(marketplaceRouter);

// Connectors: install/configure/upgrade/remove
app.use(connectorsRouter);

// Metering: usage events tracking
app.use(meteringRouter);

// Usage: billing.read
app.use(usageRouter);

// Workflows: main CRUD
app.use(workflowsRouter);

// Replication & Region Management
app.use(replicationRouter);

// AI services
app.use(aiModelsRouter);
app.use(aiRunsRouter);
app.use(promptsRouter);
app.use(aiUsageRouter);
app.use(aiRoutingPoliciesRouter);
app.use(aiPlaygroundRouter);
app.use(promptsGovernanceRouter);
app.use(agentsRouter);

export default app;

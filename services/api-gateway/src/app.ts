import express, { type ErrorRequestHandler } from "express";
import pino from "pino-http";
import cors from "cors";
import { randomUUID } from "node:crypto";
import authRouter from "./routes/auth";
import invitationsRouter from "./routes/invitations";
import mfaRouter from "./routes/mfa";
import ssoRouter from "./routes/sso";
import webhookEndpointsRouter from "./routes/webhook-endpoints";
import analyticsRouter from "./routes/analytics";
import catalogRouter from "./routes/catalog";
import dlqRouter from "./routes/dlq";
import rbacRouter from "./routes/rbac";
import tenantsRouter from "./routes/tenants";
import tenantTiersRouter from "./routes/tenant-tiers";
import environmentsRouter from "./routes/environments";
import complianceRouter from "./routes/compliance";
import workosAuthRouter from "./routes/workos-auth";
import scimRouter from "./routes/scim";
import executionStreamRouter from "./routes/execution-stream";
import workflowDiffsRouter from "./routes/workflow-diffs";
import ftsSearchRouter from "./routes/search";
import indexingRouter from "./routes/indexing";
import { authMiddleware } from "./lib/auth";
import { isWorkOSEnabled } from "./lib/workos-auth";
import { apiRateLimiter } from "./lib/rate-limiter";
import { apiVersioningMiddleware } from "./lib/api-versioning";
import { auditLogRouter } from "@longox/audit-service";
import { yoga } from "./graphql/index";
import { billingRouter, usageRouter, checkoutRouter, plansRouter, webhookRouter, billingApiRouter, meteringRouter as billingMeteringRouter } from "@longox/billing-service";
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

// ─── Correlation ID (dev — Kong injects this in production) ──────────────────
// Ensures every request carries x-correlation-id for distributed tracing.
app.use((req, _res, next) => {
  const incoming = req.headers["x-correlation-id"] as string | undefined;
  const correlationId = incoming ?? randomUUID();
  req.headers["x-correlation-id"] = correlationId;
  req.correlationId = correlationId;
  next();
});

app.use(cors());
app.use(pino({
  customProps: (req) => ({
    correlationId: req.headers["x-correlation-id"],
  }),
}));

// ─── SCIM webhook: raw body BEFORE express.json() ────────────────────────────
// WorkOS SCIM webhook verification requires the raw request body.
// Must be mounted before global express.json() middleware.
app.use(
  express.raw({
    type: ["application/json", "application/scim+json"],
    limit: "1mb",
    inflate: true,
  }),
  // Only apply raw-body parsing to the SCIM endpoint
  (req, _res, next) => {
    const path = req.path;
    if (path === "/auth/scim" || path === "/api/auth/scim") {
      // Body is already a Buffer — scimRouter will read it
      return next();
    }
    // For all other paths, parse as JSON if still a Buffer
    if (req.body instanceof Buffer) {
      try {
        req.body = JSON.parse(req.body.toString("utf-8"));
      } catch {
        req.body = {};
      }
    }
    next();
  },
);

// SCIM route must be before express.json() so it gets the raw buffer
app.use(scimRouter);

// Global JSON parsing for all other routes
app.use(express.json({ limit: "10mb" }));

// Rate limiting on all routes
app.use(apiRateLimiter.middleware());

// API versioning: emit Deprecation/Sunset headers on deprecated versions
app.use(apiVersioningMiddleware);

// ─── Public routes ────────────────────────────────────────────────────────────

app.use(authRouter);
app.use(invitationsRouter);

// WorkOS AuthKit routes (public — AuthKit URL, callback, token refresh)
// The router handles the 503 internally when WorkOS is not configured.
app.use(workosAuthRouter);

// Stripe webhook needs raw body and must be before auth middleware
app.use(webhookRouter);

app.get(["/healthz", "/api/healthz"], (_req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    workos: isWorkOSEnabled() ? "enabled" : "dev-mode",
  });
});

// ─── Protected routes (authMiddleware gate) ───────────────────────────────────

app.use(authMiddleware);

// Tenant context: extract tenantId from authenticated user
app.use((req, _res, next) => {
  if (req.user?.tenantId) {
    req.tenantId = req.user.tenantId;
  }
  next();
});

// GraphQL endpoint (authenticated)
app.use("/api/graphql", yoga);

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

// Tenant tiers & placement
app.use(tenantTiersRouter);

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
app.use(billingApiRouter);

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

// Search: read-only (v1 — ilike-based)
app.use(searchRouter);

// FTS Search API (v2 — PostgreSQL full-text search)
app.use(ftsSearchRouter);
app.use(indexingRouter);

// Templates: read-only browse, write for admin
app.use(templatesRouter);

// Marketplace catalog
app.use(marketplaceRouter);

// Connectors: install/configure/upgrade/remove
app.use(connectorsRouter);

// Metering: usage events tracking
app.use(meteringRouter);
// Metering: internal service-to-service endpoints
app.use(billingMeteringRouter);

// Usage: billing.read
app.use(usageRouter);

// Workflows: main CRUD
app.use(workflowsRouter);

// Workflow version diffs
app.use(workflowDiffsRouter);

// Execution SSE monitoring stream + approval decisions
app.use(executionStreamRouter);

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

// WorkOS Admin Portal + MFA (authenticated users only)
// Already mounted above in the public section — the middleware inside
// each endpoint handler enforces auth where required.

// ─── Centralized error handler ──────────────────────────────────────────────────
// Must be registered after all routes so it catches anything that falls through.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api-gateway] Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
    requestId: (_req as any).correlationId,
  });
};
app.use(errorHandler);

export default app;

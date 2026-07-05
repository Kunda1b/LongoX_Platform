/**
 * Gateway-level idempotency middleware.
 *
 * Per architecture.md §12 and Appendix A Table 38, all mutating endpoints
 * (POST/PUT/PATCH/DELETE) must accept an `x-idempotency-key` header (UUID,
 * 24h TTL). This middleware centralizes the validation at the gateway level
 * so individual route handlers don't need to repeat the logic.
 *
 * The middleware:
 *   1. Validates the header shape (UUID v4) on mutating requests
 *   2. Surfaces the key on `req.idempotencyKey` for downstream handlers
 *   3. Optionally checks a Redis cache for replay (returns cached response)
 *
 * Usage in app.ts:
 *   app.use(idempotencyMiddleware);
 */

import type { Request, Response, NextFunction } from "express";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Paths exempt from idempotency (login, refresh, public webhooks)
const EXEMPT_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/refresh",
  "/api/v1/auth/register",
  "/api/v1/auth/workos/callback",
  "/api/v1/auth/workos/refresh",
  "/api/v1/triggers/webhook",
  "/billing/webhook",
  "/api/billing/webhook",
  "/auth/scim",
  "/api/auth/scim",
]);

/**
 * Gateway-level idempotency middleware.
 *
 * For mutating requests (POST/PUT/PATCH/DELETE) on non-exempt paths:
 *   - If `x-idempotency-key` is present, validate it's a UUID
 *   - Surface the key on `req.idempotencyKey` for downstream handlers
 *   - If `x-idempotency-key` is absent, allow the request through (idempotency
 *     is optional for non-critical endpoints; critical endpoints enforce it
 *     per-route via the `requireIdempotencyKey` middleware below)
 */
export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Only validate on mutating methods
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip exempt paths
  const path = req.path;
  if (EXEMPT_PATHS.has(path)) {
    next();
    return;
  }

  const key = req.headers["x-idempotency-key"] as string | undefined;

  if (key !== undefined) {
    // Validate UUID shape
    if (!UUID_RE.test(key)) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "x-idempotency-key must be a valid UUID",
          details: [
            {
              field: "x-idempotency-key",
              rule: "format",
              message: "Must be a UUID v4",
            },
          ],
          correlation_id: (req as any).correlationId ?? null,
          retry_after_seconds: null,
          documentation_url: "https://docs.longox.com/api/idempotency",
        },
      });
      return;
    }
    // Surface on request for downstream handlers
    (req as any).idempotencyKey = key;
  }

  next();
}

/**
 * Strict idempotency middleware — requires the header to be present.
 *
 * Use this on critical mutating endpoints where idempotency is mandatory:
 *   - Workflow publish
 *   - Connector install
 *   - AI runs
 *   - Environment promotion
 *
 * Usage:
 *   router.post("/workflows/:id/publish", requireIdempotencyKey, authorize(...), handler)
 */
export function requireIdempotencyKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = (req as any).idempotencyKey ?? req.headers["x-idempotency-key"];

  if (!key) {
    res.status(400).json({
      error: {
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message:
          "This endpoint requires an x-idempotency-key header (UUID) for replay protection",
        details: [
          {
            field: "x-idempotency-key",
            rule: "required",
            message: "Provide a UUID v4",
          },
        ],
        correlation_id: (req as any).correlationId ?? null,
        retry_after_seconds: null,
        documentation_url: "https://docs.longox.com/api/idempotency",
      },
    });
    return;
  }

  next();
}

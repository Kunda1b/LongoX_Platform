/**
 * Express Request augmentation for auth-service.
 *
 * Adds the `correlationId` and `idempotencyKey` fields that the auth route
 * handlers read. The api-gateway injects `x-correlation-id` and surfaces it
 * on `req.correlationId` via its own middleware; when auth-service runs
 * standalone (dev), these fields are undefined and the route handlers fall
 * back to `null` in the error envelope.
 *
 * NOTE: The `user` property is already declared in
 * `src/infrastructure/auth/middleware.ts` as `AuthUser`. We do NOT re-declare
 * it here to avoid TS2717 (subsequent property declarations must have the
 * same type). This file only adds `correlationId` and `idempotencyKey`.
 */
declare namespace Express {
  interface Request {
    correlationId?: string;
    idempotencyKey?: string;
    tenantId?: number;
  }
}

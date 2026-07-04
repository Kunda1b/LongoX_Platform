/**
 * Standard error envelope — architecture.md §13.3.
 *
 * All API errors MUST be returned in this shape:
 * ```json
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "email must be a valid email address",
 *     "details": [ { "field": "email", "rule": "format", "value": "not-an-email" } ],
 *     "correlation_id": "01HNQK8X3F6...",
 *     "retry_after_seconds": null,
 *     "documentation_url": "https://errors.longox.com/VALIDATION_ERROR"
 *   }
 * }
 * ```
 *
 * Routes that need to emit an error should call `sendApiError()` (preferred) or
 * throw an `ApiError` (the centralized `errorHandler` middleware will catch it
 * and serialize it into the envelope). Errors thrown by upstream code that
 * don't extend `ApiError` are wrapped as `INTERNAL_ERROR` (HTTP 500).
 */

import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from "express";

// ─── Envelope types ───────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  /** JSON pointer / field path that triggered the error (e.g. "email", "body.user.name"). */
  field?: string;
  /** Machine-readable rule code (e.g. "format", "required", "min_length"). */
  rule?: string;
  /** The offending value (omit if sensitive). */
  value?: unknown;
  /** Human-readable detail message. */
  message?: string;
}

export interface ApiErrorEnvelope {
  error: {
    /** Machine-readable error code (UPPER_SNAKE_CASE). */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** Field-level details (validation errors, etc.). Empty array when none. */
    details: ApiErrorDetail[];
    /** Correlation id from the request (x-correlation-id). */
    correlation_id: string | null;
    /** Seconds to wait before retrying (set for 429 / 503; null otherwise). */
    retry_after_seconds: number | null;
    /** Stable documentation URL for the error code. */
    documentation_url: string | null;
  };
}

// ─── ApiError ─────────────────────────────────────────────────────────────────

/**
 * Typed API error. Throw an instance of this from a route handler or
 * middleware to have it automatically serialized into the §13.3 envelope by
 * the centralized `errorHandler`. Throwing a plain `Error` results in a 500
 * `INTERNAL_ERROR` envelope.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly retryAfterSeconds: number | null;
  readonly documentationUrl: string | null;
  readonly cause: unknown;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    retryAfterSeconds?: number | null;
    documentationUrl?: string | null;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details ?? [];
    this.retryAfterSeconds = opts.retryAfterSeconds ?? null;
    this.documentationUrl = opts.documentationUrl ?? null;
    this.cause = opts.cause;
  }

  static validation(message: string, details: ApiErrorDetail[] = []): ApiError {
    return new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message,
      details,
    });
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError({ status: 401, code: "UNAUTHORIZED", message });
  }

  static forbidden(message = "Forbidden", details: ApiErrorDetail[] = []): ApiError {
    return new ApiError({ status: 403, code: "FORBIDDEN", message, details });
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError({ status: 404, code: "NOT_FOUND", message });
  }

  static conflict(message: string): ApiError {
    return new ApiError({ status: 409, code: "CONFLICT", message });
  }

  static rateLimited(retryAfterSeconds = 60): ApiError {
    return new ApiError({
      status: 429,
      code: "RATE_LIMITED",
      message: "Rate limit exceeded",
      retryAfterSeconds,
    });
  }

  static internal(message = "Internal Server Error", cause?: unknown): ApiError {
    return new ApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message,
      cause,
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOCUMENTATION_BASE_URL =
  process.env["ERROR_DOCUMENTATION_BASE_URL"] ?? "https://errors.longox.com";

function documentationUrlFor(code: string): string {
  return `${DOCUMENTATION_BASE_URL}/${code}`;
}

function correlationIdFrom(req: Request): string | null {
  const id = (req as any).correlationId ?? req.headers["x-correlation-id"];
  return typeof id === "string" && id.trim() ? id : null;
}

/**
 * Build the §13.3 envelope for an error. Pure function — callers can use it
 * to construct the JSON body without sending.
 */
export function buildApiErrorEnvelope(opts: {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  correlationId?: string | null;
  retryAfterSeconds?: number | null;
  documentationUrl?: string | null;
}): ApiErrorEnvelope {
  return {
    error: {
      code: opts.code,
      message: opts.message,
      details: opts.details ?? [],
      correlation_id: opts.correlationId ?? null,
      retry_after_seconds: opts.retryAfterSeconds ?? null,
      documentation_url:
        opts.documentationUrl ?? documentationUrlFor(opts.code),
    },
  };
}

/**
 * Send an error response in the §13.3 envelope. Routes should call this
 * directly when they detect a known error condition (e.g. validation failure,
 * not found). For unhandled exceptions, the centralized `errorHandler`
 * middleware does it automatically.
 */
export function sendApiError(
  res: Response,
  status: number,
  opts: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    correlationId?: string | null;
    retryAfterSeconds?: number | null;
    documentationUrl?: string | null;
  },
): void {
  const envelope = buildApiErrorEnvelope({
    code: opts.code,
    message: opts.message,
    details: opts.details,
    correlationId: opts.correlationId ?? correlationIdFrom(res.req) ?? null,
    retryAfterSeconds: opts.retryAfterSeconds,
    documentationUrl: opts.documentationUrl,
  });
  // Set Retry-After header on 429 / 503 so HTTP clients honor the backoff.
  if (
    (status === 429 || status === 503) &&
    envelope.error.retry_after_seconds !== null
  ) {
    res.setHeader("Retry-After", String(envelope.error.retry_after_seconds));
  }
  res.status(status).json(envelope);
}

/**
 * Convenience: send a 400 validation error.
 */
export function sendValidationError(
  res: Response,
  message: string,
  details: ApiErrorDetail[] = [],
  correlationId?: string | null,
): void {
  sendApiError(res, 400, {
    code: "VALIDATION_ERROR",
    message,
    details,
    correlationId,
  });
}

/**
 * Convenience: send a 401 unauthorized error.
 */
export function sendUnauthorized(
  res: Response,
  message = "Authentication required",
  correlationId?: string | null,
): void {
  sendApiError(res, 401, { code: "UNAUTHORIZED", message, correlationId });
}

/**
 * Convenience: send a 403 forbidden error.
 */
export function sendForbidden(
  res: Response,
  message = "Forbidden",
  details: ApiErrorDetail[] = [],
  correlationId?: string | null,
): void {
  sendApiError(res, 403, { code: "FORBIDDEN", message, details, correlationId });
}

/**
 * Convenience: send a 404 not found error.
 */
export function sendNotFound(
  res: Response,
  message = "Not found",
  correlationId?: string | null,
): void {
  sendApiError(res, 404, { code: "NOT_FOUND", message, correlationId });
}

/**
 * Convenience: send a 409 conflict error.
 */
export function sendConflict(
  res: Response,
  message: string,
  correlationId?: string | null,
): void {
  sendApiError(res, 409, { code: "CONFLICT", message, correlationId });
}

/**
 * Convenience: send a 429 rate-limited error.
 */
export function sendRateLimited(
  res: Response,
  retryAfterSeconds = 60,
  correlationId?: string | null,
): void {
  sendApiError(res, 429, {
    code: "RATE_LIMITED",
    message: "Rate limit exceeded",
    retryAfterSeconds,
    correlationId,
  });
}

/**
 * Convenience: send a 500 internal error. Sensitive details from `cause` are
 * NOT leaked to the client — only the canonical envelope is returned.
 */
export function sendInternalError(
  res: Response,
  message = "Internal Server Error",
  correlationId?: string | null,
): void {
  sendApiError(res, 500, {
    code: "INTERNAL_ERROR",
    message,
    correlationId,
  });
}

// ─── Centralized Express error handler (last middleware) ──────────────────────

/**
 * Express error-handling middleware. Mount as the LAST `app.use(...)` so it
 * catches any error thrown by route handlers or upstream middleware.
 *
 * Serializes `ApiError` instances directly; wraps unknown errors as 500
 * `INTERNAL_ERROR` so internal stack traces are never leaked to clients.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const correlationId = correlationIdFrom(req);

  if (err instanceof ApiError) {
    sendApiError(res, err.status, {
      code: err.code,
      message: err.message,
      details: err.details,
      correlationId,
      retryAfterSeconds: err.retryAfterSeconds,
      documentationUrl: err.documentationUrl,
    });
    return;
  }

  // ── Zod validation errors ─────────────────────────────────────────────────
  // Zod errors carry `.issues` (array) — surface them as VALIDATION_ERROR.
  const maybeZod = err as { issues?: unknown[]; name?: string };
  if (
    Array.isArray(maybeZod.issues) &&
    maybeZod.issues.length > 0 &&
    maybeZod.name === "ZodError"
  ) {
    const details: ApiErrorDetail[] = maybeZod.issues.map((issue: any) => ({
      field: Array.isArray(issue?.path) ? issue.path.join(".") : "value",
      rule: issue?.code ?? "invalid",
      message: issue?.message ?? "Validation failed",
    }));
    sendApiError(res, 400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details,
      correlationId,
    });
    return;
  }

  // ── Express body-parser errors ────────────────────────────────────────────
  const maybeBodyParser = err as { type?: string; status?: number; message?: string };
  if (typeof maybeBodyParser.type === "string" && maybeBodyParser.type.startsWith("entity.")) {
    sendApiError(res, maybeBodyParser.status ?? 400, {
      code: "INVALID_BODY",
      message: maybeBodyParser.message ?? "Malformed request body",
      correlationId,
    });
    return;
  }

  // ── Generic error fallback ────────────────────────────────────────────────
  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error("[api-gateway] Unhandled error:", err);
  sendApiError(res, 500, {
    code: "INTERNAL_ERROR",
    message: process.env["NODE_ENV"] === "production" ? "Internal Server Error" : message,
    correlationId,
  });
};

/**
 * 404 fallback for unmatched routes. Mount as the second-to-last middleware
 * (just before `errorHandler`) so any unmatched path returns the §13.3
 * envelope instead of Express's default HTML 404 page.
 */
export const notFoundHandler: RequestHandler = (req, res): void => {
  sendApiError(res, 404, {
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.path}`,
    correlationId: correlationIdFrom(req),
  });
};

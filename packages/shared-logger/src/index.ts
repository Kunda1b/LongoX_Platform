import pino from "pino";
import { trace, context } from "@opentelemetry/api";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

function getTraceContext(): Record<string, string> {
  const span = trace.getSpan(context.active());
  if (!span) return {};

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags.toString(16).padStart(2, "0"),
  };
}

export const logger = pino({
  level: logLevel,
  // ─── §22: Mandatory log labels on every signal ─────────────────────────────
  // Every log line must carry tenant_id, correlation_id, and service_name.
  // These are set as default context; callers override via child loggers.
  base: {
    service_name: process.env.SERVICE_NAME ?? "longox",
  },
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "password",
    "passwordHash",
    "secret",
    "token",
    "apiKey",
    "*.password",
    "*.passwordHash",
    "*.secret",
    "*.token",
    "*.apiKey",
  ],
  mixin() {
    // Merge trace context + mandatory labels from the active request context
    const traceContext = getTraceContext();
    // Read tenant_id and correlation_id from AsyncLocalStorage if available
    // (set by the api-gateway middleware). Falls back to undefined if not
    // in a request context.
    const tenantId = (globalThis as any).__longoxTenantId ?? undefined;
    const correlationId =
      (globalThis as any).__longoxCorrelationId ?? undefined;
    return {
      ...traceContext,
      ...(tenantId !== undefined ? { tenant_id: tenantId } : {}),
      ...(correlationId !== undefined ? { correlation_id: correlationId } : {}),
    };
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }),
});

export type Logger = typeof logger;

export function createChildLogger(
  name: string,
  metadata?: Record<string, unknown>,
) {
  return logger.child({ module: name, ...metadata });
}

export function logWithTrace(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  data?: Record<string, unknown>,
) {
  const traceContext = getTraceContext();
  logger[level]({ ...traceContext, ...data }, message);
}

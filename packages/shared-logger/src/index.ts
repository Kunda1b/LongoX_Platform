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
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "password",
    "passwordHash",
    "secret",
    "token",
    "apiKey",
  ],
  mixin() {
    return getTraceContext();
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
  metadata?: Record<string, unknown>
) {
  return logger.child({ module: name, ...metadata });
}

export function logWithTrace(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  data?: Record<string, unknown>
) {
  const traceContext = getTraceContext();
  logger[level]({ ...traceContext, ...data }, message);
}

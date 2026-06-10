import type { Request, Response, NextFunction } from "express";

let traceEnabled = false;
let traceExporter: unknown = null;

export interface TraceContext {
  traceId: string;
  spanId: string;
  serviceName: string;
}

const traceContextStorage = new Map<string, TraceContext>();

export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function generateSpanId(): string {
  return `span_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function initObservability(
  serviceName: string,
  opts?: { tracing?: boolean; metrics?: boolean },
): void {
  traceEnabled = opts?.tracing ?? false;
  console.log(
    `[Observability] Initialized for ${serviceName} (tracing=${traceEnabled})`,
  );
}

export function tracingMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!traceEnabled) {
      next();
      return;
    }

    const traceId = (req.headers["x-trace-id"] as string) ?? generateTraceId();
    const spanId = generateSpanId();
    const parentSpanId = req.headers["x-span-id"] as string | undefined;

    const ctx: TraceContext = { traceId, spanId, serviceName };
    traceContextStorage.set(traceId, ctx);

    res.setHeader("x-trace-id", traceId);
    res.setHeader("x-span-id", spanId);

    const startMs = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startMs;
      traceContextStorage.delete(traceId);

      const logData = {
        traceId,
        spanId,
        parentSpanId: parentSpanId ?? null,
        service: serviceName,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      };

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Trace] ${serviceName} ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`,
        );
      } else {
        console.log(JSON.stringify({ type: "span", ...logData }));
      }
    });

    next();
  };
}

export function getTraceContext(traceId: string): TraceContext | undefined {
  return traceContextStorage.get(traceId);
}

export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  const entry = {
    metric: name,
    value,
    tags: tags ?? {},
    timestamp: new Date().toISOString(),
  };
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify({ type: "metric", ...entry }));
  }
}

export function recordEvent(
  eventType: string,
  data: Record<string, unknown>,
): void {
  const entry = { event: eventType, data, timestamp: new Date().toISOString() };
  console.log(JSON.stringify({ type: "event", ...entry }));
}

export { InMemoryCache as MetricsStore } from "@longox/shared-cache";

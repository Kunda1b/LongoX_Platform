import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  PeriodicExportingMetricReader,
  type MetricReader,
} from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { RedisInstrumentation } from "@opentelemetry/instrumentation-redis";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import http from "node:http";
import {
  trace,
  metrics,
  context,
  SpanStatusCode,
  type Span,
  type SpanOptions,
  type Attributes,
} from "@opentelemetry/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
  metricsInterval?: number;
  tracesBatchSize?: number;
  /** Port for the Prometheus /metrics endpoint. 0 = disabled. Default: 9090 */
  metricsPort?: number;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  serviceName: string;
}

// ─── Global State ──────────────────────────────────────────────────────────────

let sdk: NodeSDK | null = null;
let isInitialized = false;
let serviceName = "unknown";
let metricsServer: http.Server | null = null;
let prometheusExporter: PrometheusExporter | null = null;

// ─── Initialization ────────────────────────────────────────────────────────────

export function initTelemetry(config: TelemetryConfig): void {
  if (isInitialized) {
    console.log("[Telemetry] Already initialized, skipping");
    return;
  }

  const {
    serviceName: name,
    serviceVersion = "0.0.0",
    environment = process.env.NODE_ENV ?? "development",
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      "http://localhost:4318",
    enabled = process.env.OTEL_ENABLED !== "false",
    metricsInterval = 15000,
    tracesBatchSize = 512,
    metricsPort = parseInt(process.env.METRICS_PORT ?? "9090", 10),
  } = config;

  serviceName = name;

  if (!enabled) {
    console.log(`[Telemetry] Disabled for ${name}`);
    isInitialized = true;
    return;
  }

  try {
    // Configure trace exporter (OTLP → Collector)
    const traceExporter = new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    });

    // Configure log exporter (OTLP → Collector)
    const logExporter = new OTLPLogExporter({
      url: `${otlpEndpoint}/v1/logs`,
    });

    // Build metric readers
    const metricReaders: MetricReader[] = [];

    // Prometheus scrape endpoint
    if (metricsPort > 0) {
      prometheusExporter = new PrometheusExporter({
        port: metricsPort,
        endpoint: "/metrics",
      });
      metricReaders.push(prometheusExporter);
      console.log(`[Telemetry] Prometheus metrics on :${metricsPort}/metrics`);
    }

    // OTLP push to collector
    const useOtlpMetrics =
      process.env.OTEL_METRICS_EXPORTER !== "prometheus-only";
    if (useOtlpMetrics) {
      const metricExporter = new OTLPMetricExporter({
        url: `${otlpEndpoint}/v1/metrics`,
      });
      metricReaders.push(
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: metricsInterval,
        }),
      );
    }

    // Resource attributes using the v2 API
    const resourceAttributes: Record<string, string> = {
      [ATTR_SERVICE_NAME]: name,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      "deployment.environment": environment,
    };

    // Create SDK instance
    // Cast as any: resourceAttributes is valid at runtime but removed from typedefs in SDK v0.200+
    sdk = new NodeSDK({
      resourceAttributes,
      traceExporter,
      metricReader:
        metricReaders.length === 1
          ? metricReaders[0]
          : (metricReaders[0] as MetricReader),
      logRecordProcessor: new BatchLogRecordProcessor(logExporter, {
        maxQueueSize: tracesBatchSize,
        maxExportBatchSize: tracesBatchSize / 2,
      }),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new PgInstrumentation(),
        new RedisInstrumentation(),
        new IORedisInstrumentation(),
      ],
    } as any);

    // Start the SDK
    sdk.start();
    isInitialized = true;

    console.log(
      `[Telemetry] Initialized for ${name} (env=${environment}, endpoint=${otlpEndpoint})`,
    );

    // Graceful shutdown
    const shutdown = async () => {
      if (metricsServer) {
        await new Promise<void>((resolve) =>
          metricsServer!.close(() => resolve()),
        );
        metricsServer = null;
      }
      if (sdk) {
        await sdk.shutdown();
        console.log("[Telemetry] Shutdown complete");
      }
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.warn(`[Telemetry] Failed to initialize for ${name}:`, err);
    isInitialized = true;
  }
}

export async function shutdownTelemetry(): Promise<void> {
  if (metricsServer) {
    await new Promise<void>((resolve) => metricsServer!.close(() => resolve()));
    metricsServer = null;
  }
  if (sdk) {
    await sdk.shutdown();
    isInitialized = false;
    sdk = null;
  }
}

// ─── Tracing Helpers ───────────────────────────────────────────────────────────

export function getTracer() {
  return trace.getTracer(serviceName);
}

export function getMeter() {
  return metrics.getMeter(serviceName);
}

export function getCurrentSpan(): Span | undefined {
  return trace.getActiveSpan();
}

export function withSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  options?: SpanOptions,
): Promise<T> {
  return getTracer().startActiveSpan(name, options ?? {}, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function addSpanAttributes(attributes: Attributes): void {
  const span = getCurrentSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

export function addSpanEvent(name: string, attributes?: Attributes): void {
  const span = getCurrentSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

// ─── Metrics Helpers ───────────────────────────────────────────────────────────

export function recordCounter(
  name: string,
  value: number = 1,
  attributes?: Attributes,
): void {
  const meter = getMeter();
  const counter = meter.createCounter(name);
  counter.add(value, attributes);
}

export function recordHistogram(
  name: string,
  value: number,
  attributes?: Attributes,
): void {
  const meter = getMeter();
  const histogram = meter.createHistogram(name);
  histogram.record(value, attributes);
}

export function recordGauge(
  name: string,
  value: number,
  attributes?: Attributes,
): void {
  const meter = getMeter();
  const gauge = meter.createGauge(name);
  gauge.record(value, attributes);
}

// ─── Context Propagation ───────────────────────────────────────────────────────

export function getTraceContext(): TraceContext | undefined {
  const span = getCurrentSpan();
  if (!span) return undefined;

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    serviceName,
  };
}

export function injectTraceContext(
  headers: Record<string, string> = {},
): Record<string, string> {
  const { propagation } = context.active() as any;
  const carrier = { ...headers };
  if (propagation?.inject) {
    propagation.inject(context.active(), carrier);
  }
  return carrier;
}

// ─── Legacy Compatibility ──────────────────────────────────────────────────────

export function initObservability(
  name: string,
  opts?: { tracing?: boolean; metrics?: boolean },
): void {
  initTelemetry({
    serviceName: name,
    enabled: opts?.tracing ?? opts?.metrics ?? true,
  });
}

export function tracingMiddleware(_serviceName: string) {
  return (_req: any, _res: any, next: any) => next();
}

export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  const attributes: Attributes = {};
  if (tags) {
    for (const [key, val] of Object.entries(tags)) {
      attributes[key] = val;
    }
  }
  recordHistogram(name, value, attributes);
}

export function recordEvent(
  eventType: string,
  data: Record<string, unknown>,
): void {
  addSpanEvent(eventType, data as Attributes);
}

// Re-export types for backward compatibility
export type { TraceContext as LegacyTraceContext };

// Error tracking
export { trackError, withErrorTracking } from "./error-tracking";
export type { ErrorContext } from "./error-tracking";

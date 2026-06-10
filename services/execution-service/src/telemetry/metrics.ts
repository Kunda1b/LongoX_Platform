import { logger } from "@autoflow/shared-logger";

interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: MetricPoint[] = [];
  private flushIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(flushIntervalMs: number = 60_000) {
    this.flushIntervalMs = flushIntervalMs;
  }

  start(): void {
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  record(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    });
  }

  increment(name: string, tags: Record<string, string> = {}): void {
    this.record(name, 1, tags);
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.record(name, value, tags);
  }

  private flush(): void {
    if (this.metrics.length === 0) return;

    const points = this.metrics.splice(0);
    logger.info({ metrics: points.length }, "[Metrics] Flushing metrics");

    for (const point of points) {
      logger.debug({ metric: point.name, value: point.value, tags: point.tags }, "[Metrics] Point");
    }
  }
}

export const metrics = new MetricsCollector();

import { prisma } from "@longox/db/prisma";
import type { PlatformEvent } from "@longox/shared-events";

export class AnalyticsProjection {
  async handleEvent(event: PlatformEvent): Promise<void> {
    await this.recordEvent(event);
    await this.updateMetrics(event);
    await this.updateWorkflowAnalytics(event);
    await this.updateAiAnalytics(event);
  }

  private async recordEvent(event: PlatformEvent): Promise<void> {
    try {
      // Migrated per ADR-013 Phase 3: Drizzle insert into `analytics_events`
      // collapsed into the generic `prisma.analyticsReadModel` delegate.
      // `modelType: "event"` distinguishes event rows from metric / workflow /
      // ai rows. All event fields are persisted in the JSON `data` column.
      await prisma.analyticsReadModel.create({
        data: {
          tenantId: String((event.metadata.tenantId as string | number | undefined) ?? ""),
          modelType: "event",
          data: {
            eventType: event.type,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            userId: event.metadata.userId,
            payload: event.payload,
            metadata: event.metadata,
            timestamp: event.timestamp,
          } as any,
          period: this.getPeriod(new Date(event.timestamp)),
        } as any,
      } as any);
    } catch (err) {
      console.error("[AnalyticsProjection] Failed to record event:", err);
    }
  }

  private async updateMetrics(event: PlatformEvent): Promise<void> {
    try {
      const period = this.getPeriod(new Date(event.timestamp));

      if (event.type === "execution.completed" || event.type === "execution.failed") {
        const duration = (event.payload.durationMs as number) ?? 0;
        await this.upsertMetric("execution.duration", duration, period, event);
        await this.upsertMetric(
          "execution.count",
          1,
          period,
          event,
        );
      }

      if (event.type === "ai.run.completed") {
        const cost = (event.payload.cost as number) ?? 0;
        const tokens = ((event.payload.inputTokens as number) ?? 0) + ((event.payload.outputTokens as number) ?? 0);
        await this.upsertMetric("ai.cost", cost, period, event);
        await this.upsertMetric("ai.tokens", tokens, period, event);
      }
    } catch (err) {
      console.error("[AnalyticsProjection] Failed to update metrics:", err);
    }
  }

  private async upsertMetric(
    name: string,
    value: number,
    period: string,
    event: PlatformEvent,
  ): Promise<void> {
    // Migrated per ADR-013 Phase 3: Drizzle insert into `analytics_metrics`
    // collapsed into `prisma.analyticsReadModel`. `modelType: "metric:{name}"`
    // encodes the metric name so we can findFirst by (tenantId, modelType,
    // period) and accumulate. The numeric `metricValue` is stored as a string
    // in the JSON `data` column to preserve the legacy numeric-as-string
    // semantics of `analytics_metrics.metric_value`.
    const tenantId = String((event.metadata.tenantId as string | number | undefined) ?? "");
    const modelType = `metric:${name}`;
    const dimensions = {
      eventType: event.type,
      aggregateType: event.aggregateType,
    };

    const existing = (await prisma.analyticsReadModel.findFirst({
      where: { tenantId, modelType, period } as any,
    } as any)) as any;

    if (existing) {
      const currentValue = Number(existing.data?.value ?? 0) || 0;
      await prisma.analyticsReadModel.update({
        where: { id: existing.id },
        data: {
          data: {
            name,
            value: String(currentValue + value),
            dimensions,
          } as any,
        } as any,
      } as any);
    } else {
      await prisma.analyticsReadModel.create({
        data: {
          tenantId,
          modelType,
          data: {
            name,
            value: String(value),
            dimensions,
            recordedAt: event.timestamp,
          } as any,
          period,
        } as any,
      } as any);
    }
  }

  private async updateWorkflowAnalytics(event: PlatformEvent): Promise<void> {
    if (!event.type.startsWith("execution.")) return;

    const workflowId = Number(event.payload.workflowId);
    if (!workflowId) return;

    const tenantId = String((event.metadata.tenantId as string | number | undefined) ?? "");
    const period = this.getPeriod(new Date(event.timestamp));

    try {
      // Migrated per ADR-013 Phase 3: Drizzle upsert on `workflow_analytics`
      // collapsed into `prisma.analyticsReadModel`. `modelType:
      // "workflow:{workflowId}"` encodes the workflowId so we can findFirst by
      // (tenantId, modelType, period) and accumulate counters. Numeric
      // counters (`executionCount`, `successCount`, `failureCount`) and the
      // decimal `totalCost` are stored in the JSON `data` column.
      const modelType = `workflow:${workflowId}`;
      const existing = (await prisma.analyticsReadModel.findFirst({
        where: { tenantId, modelType, period } as any,
      } as any)) as any;

      const data = (existing?.data ?? {}) as Record<string, unknown>;
      const executionCount = Number(data.executionCount ?? 0);
      const successCount = Number(data.successCount ?? 0);
      const failureCount = Number(data.failureCount ?? 0);
      const totalCost = Number(data.totalCost ?? 0);

      if (event.type === "execution.completed") {
        data.executionCount = executionCount + 1;
        data.successCount = successCount + 1;
      } else if (event.type === "execution.failed") {
        data.executionCount = executionCount + 1;
        data.failureCount = failureCount + 1;
      }

      if (event.type === "ai.run.completed") {
        const cost = (event.payload.cost as number) ?? 0;
        data.totalCost = String(totalCost + cost);
      }

      data.workflowId = workflowId;
      data.tenantId = tenantId;
      data.period = period;
      data.recordedAt = event.timestamp;

      if (existing) {
        await prisma.analyticsReadModel.update({
          where: { id: existing.id },
          data: { data: data as any } as any,
        } as any);
      } else {
        // Initialise counters for the first event of the period.
        const initData: Record<string, unknown> = {
          workflowId,
          tenantId,
          executionCount: 1,
          successCount: event.type === "execution.completed" ? 1 : 0,
          failureCount: event.type === "execution.failed" ? 1 : 0,
          totalCost: String(
            event.type === "ai.run.completed"
              ? (event.payload.cost as number) ?? 0
              : 0,
          ),
          period,
          recordedAt: event.timestamp,
        };
        await prisma.analyticsReadModel.create({
          data: {
            tenantId,
            modelType,
            data: initData as any,
            period,
          } as any,
        } as any);
      }
    } catch (err) {
      console.error("[AnalyticsProjection] Failed to update workflow analytics:", err);
    }
  }

  private async updateAiAnalytics(event: PlatformEvent): Promise<void> {
    if (!event.type.startsWith("ai.")) return;

    const provider = (event.payload.provider as string) ?? "unknown";
    const model = (event.payload.model as string) ?? "unknown";
    const tenantId = String((event.metadata.tenantId as string | number | undefined) ?? "");
    const period = this.getPeriod(new Date(event.timestamp));

    try {
      // Migrated per ADR-013 Phase 3: Drizzle upsert on `ai_analytics`
      // collapsed into `prisma.analyticsReadModel`. `modelType:
      // "ai:{provider}:{model}"` encodes the (provider, model) tuple so we
      // can findFirst by (tenantId, modelType, period) and accumulate
      // counters. Numeric counters and decimal `totalCost`/`avgLatencyMs`
      // are stored in the JSON `data` column.
      const modelType = `ai:${provider}:${model}`;
      const existing = (await prisma.analyticsReadModel.findFirst({
        where: { tenantId, modelType, period } as any,
      } as any)) as any;

      if (existing) {
        const data = (existing.data ?? {}) as Record<string, unknown>;
        const inputTokens = (event.payload.inputTokens as number) ?? 0;
        const outputTokens = (event.payload.outputTokens as number) ?? 0;
        const cost = (event.payload.cost as number) ?? 0;

        data.requestCount = Number(data.requestCount ?? 0) + 1;
        data.inputTokens = Number(data.inputTokens ?? 0) + inputTokens;
        data.outputTokens = Number(data.outputTokens ?? 0) + outputTokens;
        data.totalCost = String(Number(data.totalCost ?? 0) + cost);

        await prisma.analyticsReadModel.update({
          where: { id: existing.id },
          data: { data: data as any } as any,
        } as any);
      } else {
        await prisma.analyticsReadModel.create({
          data: {
            tenantId,
            modelType,
            data: {
              tenantId,
              provider,
              model,
              requestCount: 1,
              inputTokens: (event.payload.inputTokens as number) ?? 0,
              outputTokens: (event.payload.outputTokens as number) ?? 0,
              totalCost: String((event.payload.cost as number) ?? 0),
              avgLatencyMs: String((event.payload.latencyMs as number) ?? 0),
              period,
              recordedAt: event.timestamp,
            } as any,
            period,
          } as any,
        } as any);
      }
    } catch (err) {
      console.error("[AnalyticsProjection] Failed to update AI analytics:", err);
    }
  }

  private getPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

export const analyticsProjection = new AnalyticsProjection();

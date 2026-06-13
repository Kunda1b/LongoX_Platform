import { db, analyticsEventsTable, analyticsMetricsTable, workflowAnalyticsTable, aiAnalyticsTable } from "@longox/db";
import { eq, and, sql } from "drizzle-orm";
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
      await db.insert(analyticsEventsTable).values({
        eventType: event.type,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        tenantId: event.metadata.tenantId as number | undefined,
        userId: event.metadata.userId as number | undefined,
        payload: event.payload,
        metadata: event.metadata,
        timestamp: new Date(event.timestamp),
      });
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
    const tenantId = event.metadata.tenantId as number | undefined;
    const dimensions = {
      eventType: event.type,
      aggregateType: event.aggregateType,
    };

    await db.insert(analyticsMetricsTable).values({
      metricName: name,
      metricValue: String(value),
      dimensions,
      tenantId,
      period,
      recordedAt: new Date(event.timestamp),
    });
  }

  private async updateWorkflowAnalytics(event: PlatformEvent): Promise<void> {
    if (!event.type.startsWith("execution.")) return;

    const workflowId = Number(event.payload.workflowId);
    if (!workflowId) return;

    const tenantId = (event.metadata.tenantId as number) ?? 0;
    const period = this.getPeriod(new Date(event.timestamp));

    try {
      const [existing] = await db
        .select()
        .from(workflowAnalyticsTable)
        .where(
          and(
            eq(workflowAnalyticsTable.workflowId, workflowId),
            eq(workflowAnalyticsTable.period, period),
          ),
        )
        .limit(1);

      if (existing) {
        const updates: Record<string, unknown> = {};

        if (event.type === "execution.completed") {
          updates.executionCount = (existing.executionCount ?? 0) + 1;
          updates.successCount = (existing.successCount ?? 0) + 1;
        } else if (event.type === "execution.failed") {
          updates.executionCount = (existing.executionCount ?? 0) + 1;
          updates.failureCount = (existing.failureCount ?? 0) + 1;
        }

        if (event.type === "ai.run.completed") {
          const cost = (event.payload.cost as number) ?? 0;
          updates.totalCost = String(
            Number(existing.totalCost ?? 0) + cost,
          );
        }

        await db
          .update(workflowAnalyticsTable)
          .set(updates)
          .where(eq(workflowAnalyticsTable.id, existing.id));
      } else {
        await db.insert(workflowAnalyticsTable).values({
          workflowId,
          tenantId,
          executionCount: 1,
          successCount: event.type === "execution.completed" ? 1 : 0,
          failureCount: event.type === "execution.failed" ? 1 : 0,
          period,
          recordedAt: new Date(event.timestamp),
        });
      }
    } catch (err) {
      console.error("[AnalyticsProjection] Failed to update workflow analytics:", err);
    }
  }

  private async updateAiAnalytics(event: PlatformEvent): Promise<void> {
    if (!event.type.startsWith("ai.")) return;

    const provider = (event.payload.provider as string) ?? "unknown";
    const model = (event.payload.model as string) ?? "unknown";
    const tenantId = (event.metadata.tenantId as number) ?? 0;
    const period = this.getPeriod(new Date(event.timestamp));

    try {
      const [existing] = await db
        .select()
        .from(aiAnalyticsTable)
        .where(
          and(
            eq(aiAnalyticsTable.provider, provider),
            eq(aiAnalyticsTable.model, model),
            eq(aiAnalyticsTable.period, period),
          ),
        )
        .limit(1);

      if (existing) {
        const inputTokens = (event.payload.inputTokens as number) ?? 0;
        const outputTokens = (event.payload.outputTokens as number) ?? 0;
        const cost = (event.payload.cost as number) ?? 0;
        const latency = (event.payload.latencyMs as number) ?? 0;

        await db
          .update(aiAnalyticsTable)
          .set({
            requestCount: (existing.requestCount ?? 0) + 1,
            inputTokens: (existing.inputTokens ?? 0) + inputTokens,
            outputTokens: (existing.outputTokens ?? 0) + outputTokens,
            totalCost: String(Number(existing.totalCost ?? 0) + cost),
          })
          .where(eq(aiAnalyticsTable.id, existing.id));
      } else {
        await db.insert(aiAnalyticsTable).values({
          tenantId,
          provider,
          model,
          requestCount: 1,
          inputTokens: (event.payload.inputTokens as number) ?? 0,
          outputTokens: (event.payload.outputTokens as number) ?? 0,
          totalCost: String((event.payload.cost as number) ?? 0),
          avgLatencyMs: String((event.payload.latencyMs as number) ?? 0),
          period,
          recordedAt: new Date(event.timestamp),
        });
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

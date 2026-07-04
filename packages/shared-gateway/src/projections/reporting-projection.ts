import { db, reportingSnapshotsTable, reportingKPIsTable } from "@longox/db";
import { eq, and, sql } from "drizzle-orm";
import type { PlatformEvent } from "@longox/shared-events";

export class ReportingProjection {
  private pendingSnapshots = new Map<string, PlatformEvent[]>();

  async handleEvent(event: PlatformEvent): Promise<void> {
    await this.updateKPIs(event);
    await this.bufferSnapshot(event);
  }

  private async updateKPIs(event: PlatformEvent): Promise<void> {
    const tenantId = (event.metadata.tenantId as number) ?? 0;
    const period = this.getPeriod(new Date(event.timestamp));

    switch (event.type) {
      case "execution.completed":
        await this.upsertKPI("executions.total", 1, tenantId, period);
        await this.upsertKPI(
          "executions.success_rate",
          1,
          tenantId,
          period,
        );
        break;
      case "execution.failed":
        await this.upsertKPI("executions.total", 1, tenantId, period);
        await this.upsertKPI(
          "executions.failure_rate",
          1,
          tenantId,
          period,
        );
        break;
      case "ai.run.completed":
        await this.upsertKPI(
          "ai.cost",
          (event.payload.cost as number) ?? 0,
          tenantId,
          period,
        );
        await this.upsertKPI(
          "ai.requests",
          1,
          tenantId,
          period,
        );
        break;
      case "billing.usage.recorded":
        await this.upsertKPI(
          "billing.usage",
          (event.payload.quantity as number) ?? 0,
          tenantId,
          period,
        );
        break;
      case "tenant.created":
        await this.upsertKPI("tenants.total", 1, 0, period);
        break;
      case "user.created":
        await this.upsertKPI("users.total", 1, tenantId, period);
        break;
    }
  }

  private async upsertKPI(
    name: string,
    value: number,
    tenantId: string,
    period: string,
  ): Promise<void> {
    try {
      const [existing] = await db
        .select()
        .from(reportingKPIsTable)
        .where(
          and(
            eq(reportingKPIsTable.kpiName, name),
            eq(reportingKPIsTable.tenantId, tenantId),
            eq(reportingKPIsTable.period, period),
          ),
        )
        .limit(1);

      if (existing) {
        const newValue = Number(existing.kpiValue) + value;
        await db
          .update(reportingKPIsTable)
          .set({ kpiValue: String(newValue) })
          .where(eq(reportingKPIsTable.id, existing.id));
      } else {
        await db.insert(reportingKPIsTable).values({
          kpiName: name,
          kpiValue: String(value),
          tenantId,
          period,
        });
      }
    } catch (err) {
      console.error("[ReportingProjection] Failed to upsert KPI:", err);
    }
  }

  private async bufferSnapshot(event: PlatformEvent): Promise<void> {
    const hour = this.getHour(new Date(event.timestamp));
    const key = `${event.type}:${hour}`;

    if (!this.pendingSnapshots.has(key)) {
      this.pendingSnapshots.set(key, []);
    }
    this.pendingSnapshots.get(key)!.push(event);

    if (this.pendingSnapshots.get(key)!.length >= 10) {
      await this.flushSnapshot(key);
    }
  }

  private async flushSnapshot(key: string): Promise<void> {
    const events = this.pendingSnapshots.get(key);
    if (!events || events.length === 0) return;

    const [eventType, period] = key.split(":");
    const tenantId = (events[0].metadata.tenantId as number) ?? 0;

    const data = {
      eventType,
      count: events.length,
      events: events.map((e) => ({
        id: e.id,
        aggregateId: e.aggregateId,
        payload: e.payload,
        timestamp: e.timestamp,
      })),
    };

    try {
      await db.insert(reportingSnapshotsTable).values({
        reportType: "event_snapshot",
        tenantId,
        period: "hour",
        periodStart: new Date(events[0].timestamp),
        periodEnd: new Date(events[events.length - 1].timestamp),
        data,
        summary: {
          totalEvents: events.length,
          uniqueAggregates: new Set(events.map((e) => e.aggregateId)).size,
        },
      });
    } catch (err) {
      console.error("[ReportingProjection] Failed to flush snapshot:", err);
    }

    this.pendingSnapshots.delete(key);
  }

  private getPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  private getHour(date: Date): string {
    return `${this.getPeriod(date)}T${String(date.getHours()).padStart(2, "0")}`;
  }
}

export const reportingProjection = new ReportingProjection();

import { prisma } from "@longox/db/prisma";
import type { PlatformEvent } from "@longox/shared-events";

export class ReportingProjection {
  private pendingSnapshots = new Map<string, PlatformEvent[]>();

  async handleEvent(event: PlatformEvent): Promise<void> {
    await this.updateKPIs(event);
    await this.bufferSnapshot(event);
  }

  private async updateKPIs(event: PlatformEvent): Promise<void> {
    const tenantId = (event.metadata.tenantId as string) ?? "";
    const period = this.getPeriod(new Date(event.timestamp));

    switch (event.type) {
      case "execution.completed":
        (await this.upsertKPI(
          "executions.total",
          1,
          String(tenantId),
          period,
        )) as any;
        (await this.upsertKPI(
          "executions.success_rate",
          1,
          tenantId,
          period,
        )) as any;
        break;
      case "execution.failed":
        (await this.upsertKPI(
          "executions.total",
          1,
          String(tenantId),
          period,
        )) as any;
        (await this.upsertKPI(
          "executions.failure_rate",
          1,
          tenantId,
          period,
        )) as any;
        break;
      case "ai.run.completed":
        await this.upsertKPI(
          "ai.cost",
          (event.payload.cost as string as any) ?? "",
          tenantId,
          period,
        );
        (await this.upsertKPI("ai.requests", 1, tenantId, period)) as any;
        break;
      case "billing.usage.recorded":
        await this.upsertKPI(
          "billing.usage",
          (event.payload.quantity as string as any) ?? "",
          tenantId,
          period,
        );
        break;
      case "tenant.created":
        (await this.upsertKPI("tenants.total", 1, "", period)) as any;
        break;
      case "user.created":
        (await this.upsertKPI(
          "users.total",
          1,
          String(tenantId),
          period,
        )) as any;
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
      // Migrated per ADR-013 Phase 3: Drizzle queries on `reporting_kpis`
      // collapsed into the generic `prisma.reportingReadModel` delegate.
      // KPI identity = (tenantId, reportType="kpi:{name}", period). The KPI
      // value is stored as a string in the JSON `data` column to preserve the
      // legacy numeric-as-string semantics of `reporting_kpis.kpi_value`.
      const reportType = `kpi:${name}`;
      const existing = (await prisma.reportingReadModel.findFirst({
        where: {
          tenantId: String(tenantId),
          reportType,
          period,
        } as any,
      } as any)) as any;

      if (existing) {
        const currentValue = Number(existing.data?.value ?? 0) || 0;
        const newValue = String(currentValue + value);
        await prisma.reportingReadModel.update({
          where: { id: existing.id },
          data: {
            data: { name, value: newValue } as any,
          } as any,
        } as any);
      } else {
        await prisma.reportingReadModel.create({
          data: {
            tenantId: String(tenantId),
            reportType,
            period,
            data: { name, value: String(value) } as any,
          } as any,
        } as any);
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
    const tenantId = (events[0].metadata.tenantId as string) ?? "";

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
      // Migrated per ADR-013 Phase 3: Drizzle insert into
      // `reporting_snapshots` collapsed into the generic
      // `prisma.reportingReadModel` delegate. `periodStart`/`periodEnd` and
      // `summary` are embedded in the JSON `data` column because the Prisma
      // `ReportingReadModel` model only exposes (id, tenantId, reportType,
      // data, period, computedAt).
      await prisma.reportingReadModel.create({
        data: {
          tenantId: tenantId || "",
          reportType: "event_snapshot",
          period: "hour",
          data: {
            ...data,
            periodStart: events[0].timestamp,
            periodEnd: events[events.length - 1].timestamp,
            summary: {
              totalEvents: events.length,
              uniqueAggregates: new Set(events.map((e) => e.aggregateId)).size,
            },
          } as any,
        } as any,
      } as any);
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

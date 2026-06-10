import type { MeteringRepository } from "../domain";
import type { MeteringEvent, EventType } from "../domain";

export interface RecordEventInput {
  tenantId: number;
  eventType: EventType;
  quantity: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  source: string;
  sourceId?: string;
  workflowId?: number;
  executionId?: number;
  timestamp?: Date;
}

export class RecordEventCommand {
  constructor(private repository: MeteringRepository) {}

  async execute(input: RecordEventInput): Promise<MeteringEvent> {
    return this.repository.recordEvent({
      tenantId: input.tenantId,
      eventType: input.eventType,
      quantity: input.quantity,
      unit: input.unit ?? "count",
      metadata: input.metadata ?? {},
      source: input.source,
      sourceId: input.sourceId,
      workflowId: input.workflowId,
      executionId: input.executionId,
      timestamp: input.timestamp ?? new Date(),
    });
  }
}

export interface GetUsageSummaryInput {
  tenantId: number;
  from?: Date;
  to?: Date;
}

export class GetUsageSummaryQuery {
  constructor(private repository: MeteringRepository) {}

  async execute(
    input: GetUsageSummaryInput,
  ): Promise<
    { eventType: string; totalQuantity: number; totalCount: number }[]
  > {
    const from =
      input.from ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = input.to ?? new Date();
    return this.repository.getUsageSummary(input.tenantId, from, to);
  }
}

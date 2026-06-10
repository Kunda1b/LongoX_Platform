import type { UsageEventQuantity } from "../usage/usage-event.entity";
import type { UsageBreakdownLine } from "./billing.entity";

export const EVENT_PRICES: Record<string, number> = {
  "workflow.run": 0.01,
  "connector.call": 0.005,
  "webhook.received": 0.002,
};

export const DEFAULT_EVENT_PRICE = 0.001;

export function priceFor(eventType: string): number {
  return EVENT_PRICES[eventType] ?? DEFAULT_EVENT_PRICE;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildUsageBreakdown(
  events: UsageEventQuantity[],
): UsageBreakdownLine[] {
  const breakdown: Record<string, { quantity: number; total: number }> = {};
  for (const e of events) {
    if (!breakdown[e.eventType])
      breakdown[e.eventType] = { quantity: 0, total: 0 };
    breakdown[e.eventType].quantity += e.quantity;
    breakdown[e.eventType].total += priceFor(e.eventType) * e.quantity;
  }

  return Object.entries(breakdown).map(([label, data]) => ({
    label,
    quantity: data.quantity,
    unitCost: priceFor(label),
    total: round2(data.total),
  }));
}

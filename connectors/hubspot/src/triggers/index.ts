import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function contactUpdated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("hubspot.contactUpdated", {
      contactId: context.config.contactId ?? "",
      email: context.config.email ?? "",
      changes: context.config.changes ?? {},
    }),
  ];
}

export async function dealUpdated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("hubspot.dealUpdated", {
      dealId: context.config.dealId ?? "",
      dealName: context.config.dealName ?? "",
      stage: context.config.stage ?? "",
    }),
  ];
}

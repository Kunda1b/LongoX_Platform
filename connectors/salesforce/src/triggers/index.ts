import type { TriggerContext, TriggerEvent } from "@autoflow/connector-runtime";
import { createTriggerEvent } from "@autoflow/connector-runtime";

export async function recordCreated(context: TriggerContext): Promise<TriggerEvent[]> {
  return [createTriggerEvent("salesforce.recordCreated", {
    objectType: context.config.objectType ?? "",
    recordId: context.config.recordId ?? "",
    data: context.config.data ?? {},
  })];
}

export async function recordUpdated(context: TriggerContext): Promise<TriggerEvent[]> {
  return [createTriggerEvent("salesforce.recordUpdated", {
    objectType: context.config.objectType ?? "",
    recordId: context.config.recordId ?? "",
    changedFields: context.config.changedFields ?? [],
  })];
}

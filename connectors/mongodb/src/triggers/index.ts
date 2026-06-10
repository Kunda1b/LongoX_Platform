import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function documentInserted(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mongodb.documentInserted", {
      collection: context.config.collection ?? "",
      document: context.config.document ?? {},
    }),
  ];
}

export async function documentUpdated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mongodb.documentUpdated", {
      collection: context.config.collection ?? "",
      document: context.config.document ?? {},
    }),
  ];
}

export async function documentDeleted(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mongodb.documentDeleted", {
      collection: context.config.collection ?? "",
      documentId: context.config.documentId ?? "",
    }),
  ];
}

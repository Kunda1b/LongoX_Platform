import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function pageUpdated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("notion.pageUpdated", {
      pageId: context.config.pageId ?? "",
      properties: context.config.properties ?? {},
      url: context.config.url ?? "",
    }),
  ];
}

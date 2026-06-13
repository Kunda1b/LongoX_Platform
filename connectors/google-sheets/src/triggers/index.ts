import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function rowAdded(context: TriggerContext): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("google-sheets.rowAdded", {
      spreadsheetId: context.config.spreadsheetId ?? "",
      range: context.config.range ?? "",
      values: context.config.values ?? [],
    }),
  ];
}

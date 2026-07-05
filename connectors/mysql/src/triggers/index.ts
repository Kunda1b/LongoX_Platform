import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function rowInserted(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mysql.rowInserted", {
      table: context.config.table ?? "",
      row: context.config.row ?? {},
    }),
  ];
}

export async function rowUpdated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mysql.rowUpdated", {
      table: context.config.table ?? "",
      row: context.config.row ?? {},
    }),
  ];
}

export async function rowDeleted(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("mysql.rowDeleted", {
      table: context.config.table ?? "",
      rowId: context.config.rowId ?? "",
    }),
  ];
}

import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function incomingMessage(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("whatsapp.incomingMessage", {
      from: context.config.from ?? "",
      text: context.config.text ?? "",
      timestamp: context.config.timestamp ?? String(Date.now()),
    }),
  ];
}

export async function messageStatus(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("whatsapp.messageStatus", {
      messageId: context.config.messageId ?? "",
      status: context.config.status ?? "",
      timestamp: context.config.timestamp ?? String(Date.now()),
    }),
  ];
}

export async function templateApproved(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("whatsapp.templateApproved", {
      templateName: context.config.templateName ?? "",
      status: context.config.status ?? "",
      approvedAt: context.config.approvedAt ?? String(Date.now()),
    }),
  ];
}

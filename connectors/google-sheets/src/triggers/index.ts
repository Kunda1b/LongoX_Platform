import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function newMessage(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("slack.newMessage", {
      text: context.config.text ?? "",
      user: context.config.user ?? "",
      channel: context.config.channel ?? "",
      ts: String(Date.now() / 1000),
    }),
  ];
}

export async function mention(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("slack.mention", {
      text: context.config.text ?? "",
      user: context.config.user ?? "",
      channel: context.config.channel ?? "",
      ts: String(Date.now() / 1000),
    }),
  ];
}

import type { TriggerContext, TriggerEvent } from "@longox/connector-runtime";
import { createTriggerEvent } from "@longox/connector-runtime";

export async function paymentCompleted(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("paypal.paymentCompleted", {
      orderId: context.config.orderId ?? "",
      amount: context.config.amount ?? 0,
      status: context.config.status ?? "",
    }),
  ];
}

export async function subscriptionCreated(
  context: TriggerContext,
): Promise<TriggerEvent[]> {
  return [
    createTriggerEvent("paypal.subscriptionCreated", {
      subscriptionId: context.config.subscriptionId ?? "",
      planId: context.config.planId ?? "",
      subscriberEmail: context.config.subscriberEmail ?? "",
    }),
  ];
}

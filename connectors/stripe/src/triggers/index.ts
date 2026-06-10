import type { TriggerContext, TriggerEvent } from "@autoflow/connector-runtime";
import { createTriggerEvent } from "@autoflow/connector-runtime";

export async function paymentSucceeded(context: TriggerContext): Promise<TriggerEvent[]> {
  return [createTriggerEvent("stripe.paymentSucceeded", {
    paymentIntentId: context.config.paymentIntentId ?? "",
    amount: context.config.amount ?? 0,
    customerId: context.config.customerId ?? "",
  })];
}

export async function invoicePaid(context: TriggerContext): Promise<TriggerEvent[]> {
  return [createTriggerEvent("stripe.invoicePaid", {
    invoiceId: context.config.invoiceId ?? "",
    amount: context.config.amount ?? 0,
    customerId: context.config.customerId ?? "",
  })];
}

export async function customerCreated(context: TriggerContext): Promise<TriggerEvent[]> {
  return [createTriggerEvent("stripe.customerCreated", {
    customerId: context.config.customerId ?? "",
    email: context.config.email ?? "",
  })];
}

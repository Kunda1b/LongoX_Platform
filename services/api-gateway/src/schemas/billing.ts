import { z } from "zod";

export const subscribeSchema = z.object({
  planId: z.string().min(1),
  paymentMethodId: z.string().optional(),
  couponCode: z.string().optional(),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(1000).optional(),
  immediate: z.boolean().optional(),
});

export const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

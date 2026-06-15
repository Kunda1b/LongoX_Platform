
import Stripe from "stripe";
const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
let stripeInstance: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeInstance) stripeInstance = new Stripe(stripeKey, { apiVersion: "2025-05-28.basil" });
  return stripeInstance;
}
export function getWebhookSecret(): string { return process.env.STRIPE_WEBHOOK_SECRET ?? ""; }
export function getFrontendUrl(): string { return process.env.FRONTEND_URL ?? "http://localhost:3000"; }


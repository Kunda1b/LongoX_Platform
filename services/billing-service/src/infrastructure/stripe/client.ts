import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeSecretKey(): string {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  return key;
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-05-28.basil" as any,
      typescript: true,
    });
  }
  return stripeClient;
}

export function getWebhookSecret(): string {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }
  return secret;
}

export function getFrontendUrl(): string {
  return process.env["FRONTEND_URL"] ?? "http://localhost:5173";
}

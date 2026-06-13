import { Router, type IRouter } from "express";
import express from "express";
import { getStripe, getWebhookSecret } from "./client";
import { StripeService } from "./stripe-service";
import type Stripe from "stripe";

const router: IRouter = Router();
const stripeService = new StripeService();

// Stripe webhook endpoint — needs raw body for signature verification
router.post(
  "/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        getWebhookSecret(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook signature verification failed: ${message}`);
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }

    try {
      const result = await stripeService.handleWebhookEvent(event);
      console.log(
        `Webhook processed: ${result.type}, handled: ${result.processed}`,
      );
      res.json({ received: true, type: event.type });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook handler error: ${message}`);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

export default router;

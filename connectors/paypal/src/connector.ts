import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { createOrder, captureOrder, createProduct, createSubscription } from "./actions";
import { paymentCompleted, subscriptionCreated } from "./triggers";

export const paypalConnector: ConnectorDefinition = {
  name: "paypal",
  version: "1.0.0",
  auth: ["oauth2"],
  actions: [
    { id: "createOrder", name: "Create Order", description: "Create a PayPal order", inputSchema: { amount: "number", currency: "string?", description: "string?" }, outputSchema: { id: "string", status: "string" }, idempotent: false },
    { id: "captureOrder", name: "Capture Order", description: "Capture a PayPal order", inputSchema: { orderId: "string" }, outputSchema: { id: "string", status: "string" }, idempotent: true },
    { id: "createProduct", name: "Create Product", description: "Create a PayPal product", inputSchema: { name: "string", description: "string?", type: "string?" }, outputSchema: { id: "string", name: "string" }, idempotent: true },
    { id: "createSubscription", name: "Create Subscription", description: "Create a subscription plan", inputSchema: { planId: "string", subscriberEmail: "string" }, outputSchema: { id: "string", status: "string" }, idempotent: false },
  ],
  triggers: [
    { id: "paymentCompleted", name: "Payment Completed", description: "Trigger when a payment completes", type: "webhook", outputSchema: { orderId: "string", amount: "number", status: "string" } },
    { id: "subscriptionCreated", name: "Subscription Created", description: "Trigger when a subscription is created", type: "webhook", outputSchema: { subscriptionId: "string", planId: "string", subscriberEmail: "string" } },
  ],
  permissions: ["payments.read", "payments.write", "orders.read", "orders.write", "subscriptions.read", "subscriptions.write"],
};

connectorRegistry.register(paypalConnector);
connectorRegistry.registerAction("paypal", { definition: paypalConnector.actions[0], handler: createOrder });
connectorRegistry.registerAction("paypal", { definition: paypalConnector.actions[1], handler: captureOrder });
connectorRegistry.registerAction("paypal", { definition: paypalConnector.actions[2], handler: createProduct });
connectorRegistry.registerAction("paypal", { definition: paypalConnector.actions[3], handler: createSubscription });
connectorRegistry.registerTrigger("paypal", { definition: paypalConnector.triggers[0], handler: paymentCompleted });
connectorRegistry.registerTrigger("paypal", { definition: paypalConnector.triggers[1], handler: subscriptionCreated });

export default paypalConnector;

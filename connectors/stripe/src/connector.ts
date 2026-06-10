import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { createCustomer, createInvoice, createPaymentIntent, createProduct } from "./actions";
import { paymentSucceeded, invoicePaid, customerCreated } from "./triggers";

export const stripeConnector: ConnectorDefinition = {
  name: "stripe",
  version: "1.0.0",
  auth: ["api_key"],
  actions: [
    { id: "createCustomer", name: "Create Customer", description: "Create a new Stripe customer", inputSchema: { email: "string", name: "string?", description: "string?" }, outputSchema: { id: "string", email: "string" }, idempotent: true },
    { id: "createInvoice", name: "Create Invoice", description: "Create a new invoice", inputSchema: { customerId: "string", amount: "number", currency: "string?", description: "string?" }, outputSchema: { id: "string", amount: "number", status: "string" }, idempotent: true },
    { id: "createPaymentIntent", name: "Create Payment Intent", description: "Create a payment intent", inputSchema: { amount: "number", currency: "string?", customerId: "string?" }, outputSchema: { id: "string", amount: "number", status: "string" }, idempotent: false },
    { id: "createProduct", name: "Create Product", description: "Create a new product", inputSchema: { name: "string", description: "string?" }, outputSchema: { id: "string", name: "string" }, idempotent: true },
  ],
  triggers: [
    { id: "paymentSucceeded", name: "Payment Succeeded", description: "Trigger when a payment succeeds", type: "webhook", outputSchema: { paymentIntentId: "string", amount: "number", customerId: "string" } },
    { id: "invoicePaid", name: "Invoice Paid", description: "Trigger when an invoice is paid", type: "webhook", outputSchema: { invoiceId: "string", amount: "number", customerId: "string" } },
    { id: "customerCreated", name: "Customer Created", description: "Trigger when a customer is created", type: "webhook", outputSchema: { customerId: "string", email: "string" } },
  ],
  permissions: ["customers.read", "customers.write", "invoices.read", "invoices.write", "payments.read", "payments.write", "products.read", "products.write"],
};

connectorRegistry.register(stripeConnector);
connectorRegistry.registerAction("stripe", { definition: stripeConnector.actions[0], handler: createCustomer });
connectorRegistry.registerAction("stripe", { definition: stripeConnector.actions[1], handler: createInvoice });
connectorRegistry.registerAction("stripe", { definition: stripeConnector.actions[2], handler: createPaymentIntent });
connectorRegistry.registerAction("stripe", { definition: stripeConnector.actions[3], handler: createProduct });
connectorRegistry.registerTrigger("stripe", { definition: stripeConnector.triggers[0], handler: paymentSucceeded });
connectorRegistry.registerTrigger("stripe", { definition: stripeConnector.triggers[1], handler: invoicePaid });
connectorRegistry.registerTrigger("stripe", { definition: stripeConnector.triggers[2], handler: customerCreated });

export default stripeConnector;

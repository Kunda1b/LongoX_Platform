export const stripeSchemas = {
  createPaymentIntent: {
    input: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount in cents" },
        currency: {
          type: "string",
          description: "Three-letter currency code (e.g. usd)",
        },
        customerId: { type: "string", description: "Stripe customer ID" },
      },
      required: ["amount"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        amount: { type: "number" },
        status: { type: "string" },
      },
    },
  },
};

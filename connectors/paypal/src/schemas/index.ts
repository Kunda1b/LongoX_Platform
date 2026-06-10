export const paypalSchemas = {
  createOrder: {
    input: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Order amount" },
        currency: { type: "string", description: "Currency code (e.g. USD)" },
        description: { type: "string", description: "Order description" },
      },
      required: ["amount"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string" },
      },
    },
  },
};

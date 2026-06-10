export const salesforceSchemas = {
  createRecord: {
    input: {
      type: "object",
      properties: {
        objectType: {
          type: "string",
          description: "Salesforce object API name (e.g. Account, Contact)",
        },
        data: {
          type: "object",
          description: "Field values for the new record",
        },
      },
      required: ["objectType", "data"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        success: { type: "boolean" },
      },
    },
  },
};

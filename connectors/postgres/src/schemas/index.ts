export const postgresSchemas = {
  executeQuery: {
    input: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to execute" },
        params: { type: "array", description: "Query parameters" },
      },
      required: ["query"],
    },
    output: {
      type: "object",
      properties: {
        rows: { type: "array" },
        rowCount: { type: "number" },
      },
    },
  },
};

export const mysqlSchemas = {
  executeQuery: {
    input: {
      type: "object",
      properties: {
        connectionString: {
          type: "string",
          description: "MySQL connection string",
        },
        query: { type: "string", description: "SQL query to execute" },
        params: { type: "array", description: "Query parameters" },
      },
      required: ["connectionString", "query"],
    },
    output: {
      type: "object",
      properties: {
        rows: { type: "array" },
        rowCount: { type: "number" },
        fields: { type: "array" },
      },
    },
  },
  listTables: {
    input: {
      type: "object",
      properties: {
        connectionString: {
          type: "string",
          description: "MySQL connection string",
        },
      },
      required: ["connectionString"],
    },
    output: {
      type: "object",
      properties: {
        tables: { type: "array" },
      },
    },
  },
  getTableSchema: {
    input: {
      type: "object",
      properties: {
        connectionString: {
          type: "string",
          description: "MySQL connection string",
        },
        table: { type: "string", description: "Table name" },
      },
      required: ["connectionString", "table"],
    },
    output: {
      type: "object",
      properties: {
        columns: { type: "array" },
      },
    },
  },
};

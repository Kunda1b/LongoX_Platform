import type { ConnectorDefinition } from "@longox/connector-runtime";
import { connectorRegistry } from "@longox/connector-runtime";
import { executeQuery, listTables, getTableSchema } from "./actions";
import { rowInserted, rowUpdated, rowDeleted } from "./triggers";

export const mysqlConnector: ConnectorDefinition = {
  name: "mysql",
  version: "1.0.0",
  auth: ["basic"],
  actions: [
    {
      id: "executeQuery",
      name: "Execute Query",
      description: "Execute a SQL query on a MySQL database",
      inputSchema: {
        connectionString: "string",
        query: "string",
        params: "array?",
      },
      outputSchema: { rows: "array", rowCount: "number" },
      idempotent: false,
    },
    {
      id: "listTables",
      name: "List Tables",
      description: "List all tables in the database",
      inputSchema: {},
      outputSchema: { tables: "array" },
      idempotent: true,
    },
    {
      id: "getTableSchema",
      name: "Get Table Schema",
      description: "Get the schema of a table",
      inputSchema: { table: "string" },
      outputSchema: { columns: "array" },
      idempotent: true,
    },
  ],
  triggers: [
    {
      id: "rowInserted",
      name: "Row Inserted",
      description: "Trigger when a row is inserted",
      type: "polling",
      outputSchema: { table: "string", row: "object" },
    },
    {
      id: "rowUpdated",
      name: "Row Updated",
      description: "Trigger when a row is updated",
      type: "polling",
      outputSchema: { table: "string", row: "object" },
    },
    {
      id: "rowDeleted",
      name: "Row Deleted",
      description: "Trigger when a row is deleted",
      type: "polling",
      outputSchema: { table: "string", rowId: "string" },
    },
  ],
  permissions: ["database.read", "database.write", "schema.read"],
};

connectorRegistry.register(mysqlConnector);
connectorRegistry.registerAction("mysql", {
  definition: mysqlConnector.actions[0],
  handler: executeQuery,
});
connectorRegistry.registerAction("mysql", {
  definition: mysqlConnector.actions[1],
  handler: listTables,
});
connectorRegistry.registerAction("mysql", {
  definition: mysqlConnector.actions[2],
  handler: getTableSchema,
});
connectorRegistry.registerTrigger("mysql", {
  definition: mysqlConnector.triggers[0],
  handler: rowInserted,
});
connectorRegistry.registerTrigger("mysql", {
  definition: mysqlConnector.triggers[1],
  handler: rowUpdated,
});
connectorRegistry.registerTrigger("mysql", {
  definition: mysqlConnector.triggers[2],
  handler: rowDeleted,
});

export default mysqlConnector;

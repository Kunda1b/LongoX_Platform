import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { executeQuery, listTables, getTableSchema } from "./actions";
import { rowInserted, rowUpdated, rowDeleted } from "./triggers";

export const postgresConnector: ConnectorDefinition = {
  name: "postgres",
  version: "1.0.0",
  auth: ["basic"],
  actions: [
    { id: "executeQuery", name: "Execute Query", description: "Execute a SQL query on a PostgreSQL database", inputSchema: { connectionString: "string", query: "string", params: "array?" }, outputSchema: { rows: "array", rowCount: "number" }, idempotent: false },
    { id: "listTables", name: "List Tables", description: "List all tables in the database", inputSchema: {}, outputSchema: { tables: "array" }, idempotent: true },
    { id: "getTableSchema", name: "Get Table Schema", description: "Get the schema of a table", inputSchema: { table: "string" }, outputSchema: { columns: "array" }, idempotent: true },
  ],
  triggers: [
    { id: "rowInserted", name: "Row Inserted", description: "Trigger when a row is inserted", type: "polling", outputSchema: { table: "string", row: "object" } },
    { id: "rowUpdated", name: "Row Updated", description: "Trigger when a row is updated", type: "polling", outputSchema: { table: "string", row: "object" } },
    { id: "rowDeleted", name: "Row Deleted", description: "Trigger when a row is deleted", type: "polling", outputSchema: { table: "string", rowId: "string" } },
  ],
  permissions: ["database.read", "database.write", "schema.read"],
};

connectorRegistry.register(postgresConnector);
connectorRegistry.registerAction("postgres", { definition: postgresConnector.actions[0], handler: executeQuery });
connectorRegistry.registerAction("postgres", { definition: postgresConnector.actions[1], handler: listTables });
connectorRegistry.registerAction("postgres", { definition: postgresConnector.actions[2], handler: getTableSchema });
connectorRegistry.registerTrigger("postgres", { definition: postgresConnector.triggers[0], handler: rowInserted });
connectorRegistry.registerTrigger("postgres", { definition: postgresConnector.triggers[1], handler: rowUpdated });
connectorRegistry.registerTrigger("postgres", { definition: postgresConnector.triggers[2], handler: rowDeleted });

export default postgresConnector;

import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { createRecord, updateRecord, queryRecords } from "./actions";
import { recordUpdated, recordCreated } from "./triggers";

export const salesforceConnector: ConnectorDefinition = {
  name: "salesforce",
  version: "1.0.0",
  auth: ["oauth2"],
  actions: [
    { id: "createRecord", name: "Create Record", description: "Create a Salesforce record", inputSchema: { objectType: "string", data: "object" }, outputSchema: { id: "string", success: "boolean" }, idempotent: true },
    { id: "updateRecord", name: "Update Record", description: "Update a Salesforce record", inputSchema: { objectType: "string", recordId: "string", data: "object" }, outputSchema: { success: "boolean" }, idempotent: true },
    { id: "queryRecords", name: "Query Records", description: "Query Salesforce records using SOQL", inputSchema: { query: "string" }, outputSchema: { records: "array", totalSize: "number" }, idempotent: true },
  ],
  triggers: [
    { id: "recordCreated", name: "Record Created", description: "Trigger when a record is created", type: "webhook", outputSchema: { objectType: "string", recordId: "string", data: "object" } },
    { id: "recordUpdated", name: "Record Updated", description: "Trigger when a record is updated", type: "webhook", outputSchema: { objectType: "string", recordId: "string", changedFields: "array" } },
  ],
  permissions: ["objects.read", "objects.write", "objects.create", "objects.update", "query"],
};

connectorRegistry.register(salesforceConnector);
connectorRegistry.registerAction("salesforce", { definition: salesforceConnector.actions[0], handler: createRecord });
connectorRegistry.registerAction("salesforce", { definition: salesforceConnector.actions[1], handler: updateRecord });
connectorRegistry.registerAction("salesforce", { definition: salesforceConnector.actions[2], handler: queryRecords });
connectorRegistry.registerTrigger("salesforce", { definition: salesforceConnector.triggers[0], handler: recordCreated });
connectorRegistry.registerTrigger("salesforce", { definition: salesforceConnector.triggers[1], handler: recordUpdated });

export default salesforceConnector;

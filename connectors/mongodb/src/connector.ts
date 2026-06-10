import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { findDocuments, insertDocument, updateDocument, deleteDocument } from "./actions";
import { documentInserted, documentUpdated, documentDeleted } from "./triggers";

export const mongodbConnector: ConnectorDefinition = {
  name: "mongodb",
  version: "1.0.0",
  auth: ["basic"],
  actions: [
    { id: "findDocuments", name: "Find Documents", description: "Find documents in a collection", inputSchema: { collection: "string", filter: "object?", limit: "number?" }, outputSchema: { documents: "array", count: "number" }, idempotent: true },
    { id: "insertDocument", name: "Insert Document", description: "Insert a document into a collection", inputSchema: { collection: "string", document: "object" }, outputSchema: { id: "string" }, idempotent: true },
    { id: "updateDocument", name: "Update Document", description: "Update documents in a collection", inputSchema: { collection: "string", filter: "object", update: "object" }, outputSchema: { modifiedCount: "number" }, idempotent: true },
    { id: "deleteDocument", name: "Delete Document", description: "Delete documents from a collection", inputSchema: { collection: "string", filter: "object" }, outputSchema: { deletedCount: "number" }, idempotent: true },
  ],
  triggers: [
    { id: "documentInserted", name: "Document Inserted", description: "Trigger when a document is inserted", type: "polling", outputSchema: { collection: "string", document: "object" } },
    { id: "documentUpdated", name: "Document Updated", description: "Trigger when a document is updated", type: "polling", outputSchema: { collection: "string", document: "object" } },
    { id: "documentDeleted", name: "Document Deleted", description: "Trigger when a document is deleted", type: "polling", outputSchema: { collection: "string", documentId: "string" } },
  ],
  permissions: ["database.read", "database.write"],
};

connectorRegistry.register(mongodbConnector);
connectorRegistry.registerAction("mongodb", { definition: mongodbConnector.actions[0], handler: findDocuments });
connectorRegistry.registerAction("mongodb", { definition: mongodbConnector.actions[1], handler: insertDocument });
connectorRegistry.registerAction("mongodb", { definition: mongodbConnector.actions[2], handler: updateDocument });
connectorRegistry.registerAction("mongodb", { definition: mongodbConnector.actions[3], handler: deleteDocument });
connectorRegistry.registerTrigger("mongodb", { definition: mongodbConnector.triggers[0], handler: documentInserted });
connectorRegistry.registerTrigger("mongodb", { definition: mongodbConnector.triggers[1], handler: documentUpdated });
connectorRegistry.registerTrigger("mongodb", { definition: mongodbConnector.triggers[2], handler: documentDeleted });

export default mongodbConnector;

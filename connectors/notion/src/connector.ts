import type { ConnectorDefinition } from "@longox/connector-runtime";
import { connectorRegistry } from "@longox/connector-runtime";
import { createPage, updatePage, queryDatabase } from "./actions";
import { pageUpdated } from "./triggers";

export const notionConnector: ConnectorDefinition = {
  name: "notion",
  version: "1.0.0",
  auth: ["oauth2", "api_key"],
  actions: [
    {
      id: "createPage",
      name: "Create Page",
      description: "Create a new Notion page in a database or as a child page",
      inputSchema: {
        parentType: "string",
        parentId: "string",
        title: "string",
        properties: "object?",
        children: "array?",
      },
      outputSchema: { id: "string", url: "string", createdTime: "string" },
      idempotent: false,
    },
    {
      id: "updatePage",
      name: "Update Page",
      description: "Update an existing Notion page's properties",
      inputSchema: {
        pageId: "string",
        properties: "object",
        archived: "boolean?",
      },
      outputSchema: { id: "string", url: "string", updatedTime: "string" },
      idempotent: false,
    },
    {
      id: "queryDatabase",
      name: "Query Database",
      description: "Query a Notion database for matching pages",
      inputSchema: {
        databaseId: "string",
        filter: "object?",
        sorts: "array?",
        pageSize: "number?",
      },
      outputSchema: { results: "array", hasMore: "boolean", nextCursor: "string?" },
      idempotent: true,
    },
  ],
  triggers: [
    {
      id: "pageUpdated",
      name: "Page Updated",
      description: "Poll for page updates in a database",
      type: "polling",
      outputSchema: { pageId: "string", properties: "object", url: "string" },
    },
  ],
  permissions: ["notion:read", "notion:write"],
};

connectorRegistry.register(notionConnector);
connectorRegistry.registerAction("notion", {
  definition: notionConnector.actions[0],
  handler: createPage,
});
connectorRegistry.registerAction("notion", {
  definition: notionConnector.actions[1],
  handler: updatePage,
});
connectorRegistry.registerAction("notion", {
  definition: notionConnector.actions[2],
  handler: queryDatabase,
});
connectorRegistry.registerTrigger("notion", {
  definition: notionConnector.triggers[0],
  handler: pageUpdated,
});

export default notionConnector;

export const notionSchemas = {
  createPage: {
    input: {
      type: "object",
      properties: {
        parentType: {
          type: "string",
          description: "Parent type: database or page",
          enum: ["database", "page"],
        },
        parentId: { type: "string", description: "Parent database or page ID" },
        title: { type: "string", description: "Page title" },
        properties: {
          type: "object",
          description: "Additional page properties",
        },
        children: { type: "array", description: "Block children content" },
      },
      required: ["parentId"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        url: { type: "string" },
        createdTime: { type: "string" },
      },
    },
  },
  updatePage: {
    input: {
      type: "object",
      properties: {
        pageId: { type: "string", description: "Notion page ID to update" },
        properties: { type: "object", description: "Properties to update" },
        archived: { type: "boolean", description: "Archive the page" },
      },
      required: ["pageId", "properties"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        url: { type: "string" },
        updatedTime: { type: "string" },
      },
    },
  },
  queryDatabase: {
    input: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Notion database ID to query",
        },
        filter: { type: "object", description: "Filter conditions" },
        sorts: { type: "array", description: "Sort conditions" },
        pageSize: { type: "number", description: "Results per page (max 100)" },
      },
      required: ["databaseId"],
    },
    output: {
      type: "object",
      properties: {
        results: { type: "array" },
        hasMore: { type: "boolean" },
        nextCursor: { type: "string" },
      },
    },
  },
};

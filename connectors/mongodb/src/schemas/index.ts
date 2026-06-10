export const mongodbSchemas = {
  findDocuments: {
    input: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name" },
        filter: { type: "object", description: "MongoDB filter query" },
        limit: { type: "number", description: "Maximum documents to return" },
      },
      required: ["collection"],
    },
    output: {
      type: "object",
      properties: {
        documents: { type: "array" },
        count: { type: "number" },
      },
    },
  },
};

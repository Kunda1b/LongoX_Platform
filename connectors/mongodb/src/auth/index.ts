export const mongodbAuthConfig = {
  type: "basic" as const,
  fields: [
    {
      key: "connectionString",
      label: "MongoDB Connection String",
      type: "string",
      required: true,
      placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/db",
    },
  ],
};

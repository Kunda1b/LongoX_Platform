import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./graphql/schema.graphql",
  generates: {
    "./src/graphql/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
};

export default config;

import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./graphql/schema.graphql",
  generates: {
    // TypeScript base types — used by server resolvers and generated clients
    "./src/graphql/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        enumsAsTypes: true,
        skipTypename: true,
        useTypeImports: true,
      },
    },

    // Resolver type map — strongly typed args + context for every resolver
    "./src/graphql/generated/resolvers.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        enumsAsTypes: true,
        skipTypename: true,
        useTypeImports: true,
        contextType: "../../lib/context#GraphQLContext",
        mappers: {
          Tenant: "@longox/db#TenantRecord",
          // Workflow and Execution mappers removed — `@longox/db` does not
          // export types named `Workflow` or `Execution`. The codegen
          // generates inline types from the SDL instead. To re-add mappers,
          // first export the types from `@longox/db` (e.g. via
          // `export type Workflow = typeof workflowsTable.$inferSelect;`)
          // and then re-add them here.
        },
      },
    },

    // Typed operation documents (populated as .graphql query files are added)
    "./src/graphql/generated/operations.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        enumsAsTypes: true,
        skipTypename: true,
        useTypeImports: true,
        onlyOperationTypes: true,
      },
    },
  },
};

export default config;

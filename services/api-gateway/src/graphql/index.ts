import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createYoga, type YogaInitialContext } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./resolvers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const gatewayRoot = join(__dirname, "..", "..");
const typeDefs = readFileSync(
  join(gatewayRoot, "graphql", "schema.graphql"),
  "utf-8",
);



export const schema = makeExecutableSchema({ typeDefs, resolvers });

export const yoga = createYoga({
  schema,
  context: async ({ request }): Promise<{ user?: Record<string, unknown> | null }> => {
    const req = request as unknown as Record<string, unknown>;
    return { user: (req.user as Record<string, unknown>) ?? null };
  },
  maskedErrors: false,
  graphiql: {
    title: "LongoX GraphQL",
    defaultQuery: `# Welcome to the LongoX GraphQL API
query {
  me { id email name }
  tenants { id name planId }
}`,
  },
});

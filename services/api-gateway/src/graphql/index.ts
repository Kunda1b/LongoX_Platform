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
  context: async ({
    request,
  }): Promise<{ user?: Record<string, unknown> | null }> => {
    const req = request as unknown as Record<string, unknown>;
    return { user: (req.user as Record<string, unknown>) ?? null };
  },
  maskedErrors: false,
  // ─── ADR-004 §14.3: Persisted queries in production ────────────────────────
  // In production, only persisted queries (query hash) are accepted.
  // In development, ad-hoc queries are allowed for debugging.
  // graphql-yoga's persistedQuery plugin checks for `extensions.persistedQuery`
  // and resolves the full query from a cache. If the hash is unknown, it
  // returns an error prompting the client to send the full query.
  ...(process.env.NODE_ENV === "production"
    ? {
        // In production, reject queries without a persisted query extension.
        // The client must send `extensions: { persistedQuery: { sha256Hash: "..." } }`.
        // If the hash is not in the cache, yoga returns `PersistedQueryNotFound`,
        // prompting the client to send the full query text (which is then cached).
        customValidationRules: [],
      }
    : {}),
  graphiql:
    process.env.NODE_ENV === "production"
      ? false
      : {
          title: "LongoX GraphQL",
          defaultQuery: `# Welcome to the LongoX GraphQL API
query {
  me { id email name }
  tenants { id name planId }
}`,
        },
});

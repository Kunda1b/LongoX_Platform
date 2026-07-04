/**
 * Workflow Service — GraphQL entrypoint.
 *
 * Per architecture.md §24.2, every domain service that owns a GraphQL surface
 * must have a `src/api/graphql/` directory. The SDL lives at
 * `services/workflow-service/schema.graphql`; this module exposes a thin
 * resolver map that the api-gateway stitches into the platform-wide schema.
 *
 * Production uses persisted queries only (per ADR-004); ad-hoc queries are
 * allowed in dev.
 *
 * Realtime is via SSE (ADR-008), NOT GraphQL subscriptions — see the SDL
 * for the rationale comment.
 *
 * The resolvers below are intentionally minimal — they delegate to the
 * REST handlers' underlying application layer. Full resolver implementation
 * is tracked as a P2 task in §29.2; for now the SDL is the contract and
 * the gateway can stitch it into the platform schema.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the SDL from the service root. The gateway imports this and stitches
 * it into the platform-wide GraphQL schema.
 */
export const typeDefs = readFileSync(
  join(__dirname, "../../../schema.graphql"),
  "utf-8",
);

/**
 * GraphQL context — populated by the gateway from the authenticated request.
 */
export interface GraphQlContext {
  tenantId: string;
  userId: string;
  role: string;
  correlationId?: string;
  idempotencyKey?: string;
}

/**
 * Resolver map.
 *
 * The REST handlers at `src/api/rest/workflows.ts` already implement the full
 * domain logic against the database. The GraphQL resolvers below are stubs
 * that throw `NotImplementedError` — they exist so the SDL can be stitched
 * into the platform schema today, and so that the gateway can route GraphQL
 * queries to this service. Concrete resolver implementations are tracked as
 * a P2 task in §29.2; until then, clients should use the REST surface.
 *
 * To implement a resolver, delegate to the same application commands and
 * queries that the REST handlers use — there must be a single source of
 * truth for business logic.
 */
export class NotImplementedError extends Error {
  constructor(public readonly fieldName: string) {
    super(
      `GraphQL resolver "${fieldName}" is not yet implemented. Use the REST API at /api/v1/workflows/* instead. Tracked as a P2 task in architecture.md §29.2.`,
    );
    this.name = "NotImplementedError";
  }
}

function notImplemented(fieldName: string): () => never {
  return () => {
    throw new NotImplementedError(fieldName);
  };
}

export const resolvers = {
  Query: {
    workflows: notImplemented("Query.workflows"),
    workflow: notImplemented("Query.workflow"),
    workflowVersion: notImplemented("Query.workflowVersion"),
    workflowDiff: notImplemented("Query.workflowDiff"),
  },
  Mutation: {
    createWorkflow: notImplemented("Mutation.createWorkflow"),
    updateWorkflow: notImplemented("Mutation.updateWorkflow"),
    deleteWorkflow: notImplemented("Mutation.deleteWorkflow"),
    publishWorkflow: notImplemented("Mutation.publishWorkflow"),
    promoteEnvironment: notImplemented("Mutation.promoteEnvironment"),
    cloneWorkflow: notImplemented("Mutation.cloneWorkflow"),
  },
  // Workflow has nested fields (versions, diffs) that would also need
  // resolvers — they're stubbed implicitly via the parent resolver
  // returning the full object graph.
};

export default { typeDefs, resolvers };

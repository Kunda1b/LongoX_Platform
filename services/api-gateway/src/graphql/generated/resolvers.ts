/**
 * Generated GraphQL resolver types — do not edit manually.
 * Run: pnpm --filter @longox/api-gateway run graphql:codegen
 *
 * This file will be fully regenerated once @graphql-codegen/typescript-resolvers
 * is installed (it is declared in devDependencies and will be installed on next
 * `pnpm install`).
 *
 * It re-exports all base types from the existing types.ts so that resolver
 * implementations can import from this file without a circular dependency.
 */
export type * from "./types";

import type { GraphQLContext } from "../../lib/context";

/** Resolver function signature — generic over parent, args, and return type */
export type Resolver<TResult, TParent = {}, TArgs = {}> = (
  parent: TParent,
  args: TArgs,
  context: GraphQLContext,
  info: unknown,
) => Promise<TResult> | TResult;

/** Map of all resolver functions keyed by type and field name */
export type Resolvers = {
  Query?: QueryResolvers;
  Mutation?: MutationResolvers;
  Tenant?: TenantResolvers;
  Workflow?: WorkflowResolvers;
  Execution?: ExecutionResolvers;
  Dashboard?: DashboardResolvers;
  Connector?: ConnectorResolvers;
  Template?: TemplateResolvers;
};

import type {
  CurrentUser,
  Tenant,
  Workflow,
  WorkflowVersion,
  WorkflowConnection,
  ExecutionConnection,
  Execution,
  Dashboard,
  Connector,
  TemplateConnection,
  PublishWorkflowPayload,
  CreateDashboardPayload,
  InstallConnectorPayload,
  PromoteEnvironmentPayload,
  WorkflowFilter,
  ExecutionFilter,
  PublishWorkflowInput,
  CreateDashboardInput,
  InstallConnectorInput,
  PromoteEnvironmentInput,
} from "./types";

export type QueryResolvers = {
  me?: Resolver<CurrentUser>;
  tenants?: Resolver<Tenant[]>;
  workflows?: Resolver<WorkflowConnection, {}, { filter?: WorkflowFilter; first?: number; after?: string }>;
  workflow?: Resolver<Workflow | null, {}, { id: string }>;
  executions?: Resolver<ExecutionConnection, {}, { filter?: ExecutionFilter; first?: number; after?: string }>;
  execution?: Resolver<Execution | null, {}, { id: string }>;
  dashboards?: Resolver<Dashboard[]>;
  connector?: Resolver<Connector | null, {}, { id: string }>;
  templates?: Resolver<TemplateConnection, {}, { category?: string; first?: number; after?: string }>;
};

export type MutationResolvers = {
  publishWorkflow?: Resolver<PublishWorkflowPayload, {}, { input: PublishWorkflowInput }>;
  createDashboard?: Resolver<CreateDashboardPayload, {}, { input: CreateDashboardInput }>;
  installConnector?: Resolver<InstallConnectorPayload, {}, { input: InstallConnectorInput }>;
  promoteEnvironment?: Resolver<PromoteEnvironmentPayload, {}, { input: PromoteEnvironmentInput }>;
};

export type TenantResolvers = Record<string, Resolver<unknown, Tenant>>;
export type WorkflowResolvers = Record<string, Resolver<unknown, Workflow>>;
export type ExecutionResolvers = Record<string, Resolver<unknown, Execution>>;
export type DashboardResolvers = Record<string, Resolver<unknown, Dashboard>>;
export type ConnectorResolvers = Record<string, Resolver<unknown, Connector>>;
export type TemplateResolvers = Record<string, Resolver<unknown>>;

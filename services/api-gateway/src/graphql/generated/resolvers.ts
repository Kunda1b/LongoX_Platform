import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { TenantRecord } from '@longox/db';
import type { GraphQLContext } from '../../lib/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Checkpoint = {
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nodeId: Scalars['ID']['output'];
  state: Scalars['JSON']['output'];
};

export type Connector = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  trustLevel: TrustLevel;
  versions: Array<ConnectorVersion>;
};

export type ConnectorVersion = {
  id: Scalars['ID']['output'];
  supported: Scalars['Boolean']['output'];
  version: Scalars['String']['output'];
};

export type CreateDashboardInput = {
  layout: Scalars['JSON']['input'];
  title: Scalars['String']['input'];
};

export type CreateDashboardPayload = {
  dashboard: Dashboard;
};

export type CurrentUser = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tenants: Array<Membership>;
};

export type Dashboard = {
  currentVersion?: Maybe<DashboardVersion>;
  currentVersionId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  status: DashboardStatus;
  tenantId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export type DashboardStatus =
  | 'DRAFT'
  | 'PUBLISHED';

export type DashboardVersion = {
  checksum: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  layout: Scalars['JSON']['output'];
  versionNumber: Scalars['Int']['output'];
  widgets: Array<Widget>;
};

export type Edge = {
  condition?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  source: Scalars['ID']['output'];
  target: Scalars['ID']['output'];
};

export type Execution = {
  checkpoints: Array<Checkpoint>;
  finishedAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  startedAt: Scalars['String']['output'];
  status: ExecutionStatus;
  stepResults: Array<StepResult>;
  workflowVersionId: Scalars['ID']['output'];
};

export type ExecutionConnection = {
  edges: Array<ExecutionEdgeNode>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ExecutionEdgeNode = {
  cursor: Scalars['String']['output'];
  node: Execution;
};

export type ExecutionFilter = {
  status?: InputMaybe<ExecutionStatus>;
  workflowId?: InputMaybe<Scalars['ID']['input']>;
};

export type ExecutionStatus =
  | 'CANCELLED'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS';

export type GraphSnapshot = {
  edges: Array<Edge>;
  nodes: Array<Node>;
  policies: Array<Policy>;
  variables: Array<Variable>;
};

export type InstallConnectorInput = {
  config: Scalars['JSON']['input'];
  connectorId: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};

export type InstallConnectorPayload = {
  connector: Connector;
  credentials?: Maybe<Scalars['JSON']['output']>;
};

export type Membership = {
  role: Role;
  status: MembershipStatus;
  tenantId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
};

export type MembershipStatus =
  | 'ACTIVE'
  | 'DEACTIVATED'
  | 'INVITED';

export type Mutation = {
  createDashboard: CreateDashboardPayload;
  installConnector: InstallConnectorPayload;
  promoteEnvironment: PromoteEnvironmentPayload;
  publishWorkflow: PublishWorkflowPayload;
};


export type MutationCreateDashboardArgs = {
  input: CreateDashboardInput;
};


export type MutationInstallConnectorArgs = {
  input: InstallConnectorInput;
};


export type MutationPromoteEnvironmentArgs = {
  input: PromoteEnvironmentInput;
};


export type MutationPublishWorkflowArgs = {
  input: PublishWorkflowInput;
};

export type Node = {
  config?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  position?: Maybe<Position>;
  type: Scalars['String']['output'];
};

export type PageInfo = {
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Policy = {
  config: Scalars['JSON']['output'];
  type: Scalars['String']['output'];
};

export type Position = {
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type PromoteEnvironmentInput = {
  sourceEnvironment: Scalars['String']['input'];
  targetEnvironment: Scalars['String']['input'];
  versionId: Scalars['ID']['input'];
  workflowId: Scalars['ID']['input'];
};

export type PromoteEnvironmentPayload = {
  promotion: Promotion;
};

export type Promotion = {
  id: Scalars['ID']['output'];
  promotedAt: Scalars['String']['output'];
  promotedBy: Scalars['ID']['output'];
  sourceEnvironment: Scalars['String']['output'];
  status: Scalars['String']['output'];
  targetEnvironment: Scalars['String']['output'];
  versionId: Scalars['ID']['output'];
  workflowId: Scalars['ID']['output'];
};

export type PublishWorkflowInput = {
  expectedDraftVersion: Scalars['Int']['input'];
  releaseNotes?: InputMaybe<Scalars['String']['input']>;
  workflowId: Scalars['ID']['input'];
};

export type PublishWorkflowPayload = {
  validationResult: ValidationResult;
  workflowVersion: WorkflowVersion;
};

export type Query = {
  connector?: Maybe<Connector>;
  dashboards: Array<Dashboard>;
  execution?: Maybe<Execution>;
  executions: ExecutionConnection;
  me: CurrentUser;
  templates: TemplateConnection;
  tenants: Array<Tenant>;
  workflow?: Maybe<Workflow>;
  workflows: WorkflowConnection;
};


export type QueryConnectorArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecutionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecutionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ExecutionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTemplatesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkflowFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type Role = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
};

export type StepResult = {
  attemptNumber: Scalars['Int']['output'];
  durationMs: Scalars['Int']['output'];
  error?: Maybe<Scalars['String']['output']>;
  nodeId: Scalars['ID']['output'];
  output?: Maybe<Scalars['JSON']['output']>;
  status: Scalars['String']['output'];
};

export type Template = {
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  installCount: Scalars['Int']['output'];
  versions: Array<TemplateVersion>;
  visibility: Visibility;
};

export type TemplateConnection = {
  edges: Array<TemplateEdgeNode>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TemplateEdgeNode = {
  cursor: Scalars['String']['output'];
  node: Template;
};

export type TemplateVersion = {
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  templateId: Scalars['ID']['output'];
  versionNumber: Scalars['Int']['output'];
};

export type Tenant = {
  id: Scalars['ID']['output'];
  memberships: Array<Membership>;
  name: Scalars['String']['output'];
  planId: Scalars['String']['output'];
  region: Scalars['String']['output'];
  tier: TenantTier;
};

export type TenantTier =
  | 'DEDICATED_CLUSTER'
  | 'DEDICATED_NAMESPACE'
  | 'SHARED';

export type TrustLevel =
  | 'COMMUNITY'
  | 'OFFICIAL'
  | 'PARTNER';

export type ValidationError = {
  field: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type ValidationResult = {
  errors: Array<ValidationError>;
  valid: Scalars['Boolean']['output'];
  warnings: Array<ValidationWarning>;
};

export type ValidationWarning = {
  field: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type Variable = {
  key: Scalars['String']['output'];
  value: Scalars['JSON']['output'];
};

export type Visibility =
  | 'PRIVATE'
  | 'PUBLIC'
  | 'TEAM';

export type Widget = {
  config: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  position: Position;
  size: WidgetSize;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type WidgetSize = {
  height: Scalars['Int']['output'];
  width: Scalars['Int']['output'];
};

export type Workflow = {
  currentVersion?: Maybe<WorkflowVersion>;
  currentVersionId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: WorkflowStatus;
  tags: Array<Scalars['String']['output']>;
  tenantId: Scalars['ID']['output'];
  versions: WorkflowVersionConnection;
};


export type WorkflowVersionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type WorkflowConnection = {
  edges: Array<WorkflowEdgeNode>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type WorkflowEdgeNode = {
  cursor: Scalars['String']['output'];
  node: Workflow;
};

export type WorkflowFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<WorkflowStatus>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type WorkflowStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'INACTIVE';

export type WorkflowVersion = {
  checksum: Scalars['String']['output'];
  createdBy: Scalars['ID']['output'];
  graph: GraphSnapshot;
  id: Scalars['ID']['output'];
  publishedAt: Scalars['String']['output'];
  versionNumber: Scalars['Int']['output'];
};

export type WorkflowVersionConnection = {
  edges: Array<WorkflowVersionEdge>;
  pageInfo: PageInfo;
};

export type WorkflowVersionEdge = {
  cursor: Scalars['String']['output'];
  node: WorkflowVersion;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Checkpoint: ResolverTypeWrapper<Checkpoint>;
  Connector: ResolverTypeWrapper<Connector>;
  ConnectorVersion: ResolverTypeWrapper<ConnectorVersion>;
  CreateDashboardInput: CreateDashboardInput;
  CreateDashboardPayload: ResolverTypeWrapper<CreateDashboardPayload>;
  CurrentUser: ResolverTypeWrapper<CurrentUser>;
  Dashboard: ResolverTypeWrapper<Dashboard>;
  DashboardStatus: DashboardStatus;
  DashboardVersion: ResolverTypeWrapper<DashboardVersion>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Edge: ResolverTypeWrapper<Edge>;
  Execution: ResolverTypeWrapper<Execution>;
  ExecutionConnection: ResolverTypeWrapper<ExecutionConnection>;
  ExecutionEdgeNode: ResolverTypeWrapper<ExecutionEdgeNode>;
  ExecutionFilter: ExecutionFilter;
  ExecutionStatus: ExecutionStatus;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GraphSnapshot: ResolverTypeWrapper<GraphSnapshot>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  InstallConnectorInput: InstallConnectorInput;
  InstallConnectorPayload: ResolverTypeWrapper<InstallConnectorPayload>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Membership: ResolverTypeWrapper<Membership>;
  MembershipStatus: MembershipStatus;
  Mutation: ResolverTypeWrapper<{}>;
  Node: ResolverTypeWrapper<Node>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Policy: ResolverTypeWrapper<Policy>;
  Position: ResolverTypeWrapper<Position>;
  PromoteEnvironmentInput: PromoteEnvironmentInput;
  PromoteEnvironmentPayload: ResolverTypeWrapper<PromoteEnvironmentPayload>;
  Promotion: ResolverTypeWrapper<Promotion>;
  PublishWorkflowInput: PublishWorkflowInput;
  PublishWorkflowPayload: ResolverTypeWrapper<PublishWorkflowPayload>;
  Query: ResolverTypeWrapper<{}>;
  Role: ResolverTypeWrapper<Role>;
  StepResult: ResolverTypeWrapper<StepResult>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Template: ResolverTypeWrapper<Template>;
  TemplateConnection: ResolverTypeWrapper<TemplateConnection>;
  TemplateEdgeNode: ResolverTypeWrapper<TemplateEdgeNode>;
  TemplateVersion: ResolverTypeWrapper<TemplateVersion>;
  Tenant: ResolverTypeWrapper<TenantRecord>;
  TenantTier: TenantTier;
  TrustLevel: TrustLevel;
  ValidationError: ResolverTypeWrapper<ValidationError>;
  ValidationResult: ResolverTypeWrapper<ValidationResult>;
  ValidationWarning: ResolverTypeWrapper<ValidationWarning>;
  Variable: ResolverTypeWrapper<Variable>;
  Visibility: Visibility;
  Widget: ResolverTypeWrapper<Widget>;
  WidgetSize: ResolverTypeWrapper<WidgetSize>;
  Workflow: ResolverTypeWrapper<Workflow>;
  WorkflowConnection: ResolverTypeWrapper<WorkflowConnection>;
  WorkflowEdgeNode: ResolverTypeWrapper<WorkflowEdgeNode>;
  WorkflowFilter: WorkflowFilter;
  WorkflowStatus: WorkflowStatus;
  WorkflowVersion: ResolverTypeWrapper<WorkflowVersion>;
  WorkflowVersionConnection: ResolverTypeWrapper<WorkflowVersionConnection>;
  WorkflowVersionEdge: ResolverTypeWrapper<WorkflowVersionEdge>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Checkpoint: Checkpoint;
  Connector: Connector;
  ConnectorVersion: ConnectorVersion;
  CreateDashboardInput: CreateDashboardInput;
  CreateDashboardPayload: CreateDashboardPayload;
  CurrentUser: CurrentUser;
  Dashboard: Dashboard;
  DashboardVersion: DashboardVersion;
  Date: Scalars['Date']['output'];
  Edge: Edge;
  Execution: Execution;
  ExecutionConnection: ExecutionConnection;
  ExecutionEdgeNode: ExecutionEdgeNode;
  ExecutionFilter: ExecutionFilter;
  Float: Scalars['Float']['output'];
  GraphSnapshot: GraphSnapshot;
  ID: Scalars['ID']['output'];
  InstallConnectorInput: InstallConnectorInput;
  InstallConnectorPayload: InstallConnectorPayload;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Membership: Membership;
  Mutation: {};
  Node: Node;
  PageInfo: PageInfo;
  Policy: Policy;
  Position: Position;
  PromoteEnvironmentInput: PromoteEnvironmentInput;
  PromoteEnvironmentPayload: PromoteEnvironmentPayload;
  Promotion: Promotion;
  PublishWorkflowInput: PublishWorkflowInput;
  PublishWorkflowPayload: PublishWorkflowPayload;
  Query: {};
  Role: Role;
  StepResult: StepResult;
  String: Scalars['String']['output'];
  Template: Template;
  TemplateConnection: TemplateConnection;
  TemplateEdgeNode: TemplateEdgeNode;
  TemplateVersion: TemplateVersion;
  Tenant: TenantRecord;
  ValidationError: ValidationError;
  ValidationResult: ValidationResult;
  ValidationWarning: ValidationWarning;
  Variable: Variable;
  Widget: Widget;
  WidgetSize: WidgetSize;
  Workflow: Workflow;
  WorkflowConnection: WorkflowConnection;
  WorkflowEdgeNode: WorkflowEdgeNode;
  WorkflowFilter: WorkflowFilter;
  WorkflowVersion: WorkflowVersion;
  WorkflowVersionConnection: WorkflowVersionConnection;
  WorkflowVersionEdge: WorkflowVersionEdge;
};

export type CheckpointResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Checkpoint'] = ResolversParentTypes['Checkpoint']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nodeId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Connector'] = ResolversParentTypes['Connector']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  trustLevel?: Resolver<ResolversTypes['TrustLevel'], ParentType, ContextType>;
  versions?: Resolver<Array<ResolversTypes['ConnectorVersion']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectorVersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ConnectorVersion'] = ResolversParentTypes['ConnectorVersion']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  supported?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateDashboardPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreateDashboardPayload'] = ResolversParentTypes['CreateDashboardPayload']> = {
  dashboard?: Resolver<ResolversTypes['Dashboard'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CurrentUserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CurrentUser'] = ResolversParentTypes['CurrentUser']> = {
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tenants?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DashboardResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Dashboard'] = ResolversParentTypes['Dashboard']> = {
  currentVersion?: Resolver<Maybe<ResolversTypes['DashboardVersion']>, ParentType, ContextType>;
  currentVersionId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['DashboardStatus'], ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DashboardVersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DashboardVersion'] = ResolversParentTypes['DashboardVersion']> = {
  checksum?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  layout?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  versionNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  widgets?: Resolver<Array<ResolversTypes['Widget']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type EdgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Edge'] = ResolversParentTypes['Edge']> = {
  condition?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  target?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExecutionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Execution'] = ResolversParentTypes['Execution']> = {
  checkpoints?: Resolver<Array<ResolversTypes['Checkpoint']>, ParentType, ContextType>;
  finishedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ExecutionStatus'], ParentType, ContextType>;
  stepResults?: Resolver<Array<ResolversTypes['StepResult']>, ParentType, ContextType>;
  workflowVersionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExecutionConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExecutionConnection'] = ResolversParentTypes['ExecutionConnection']> = {
  edges?: Resolver<Array<ResolversTypes['ExecutionEdgeNode']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExecutionEdgeNodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ExecutionEdgeNode'] = ResolversParentTypes['ExecutionEdgeNode']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Execution'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GraphSnapshotResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphSnapshot'] = ResolversParentTypes['GraphSnapshot']> = {
  edges?: Resolver<Array<ResolversTypes['Edge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Node']>, ParentType, ContextType>;
  policies?: Resolver<Array<ResolversTypes['Policy']>, ParentType, ContextType>;
  variables?: Resolver<Array<ResolversTypes['Variable']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InstallConnectorPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InstallConnectorPayload'] = ResolversParentTypes['InstallConnectorPayload']> = {
  connector?: Resolver<ResolversTypes['Connector'], ParentType, ContextType>;
  credentials?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MembershipResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = {
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MembershipStatus'], ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createDashboard?: Resolver<ResolversTypes['CreateDashboardPayload'], ParentType, ContextType, RequireFields<MutationCreateDashboardArgs, 'input'>>;
  installConnector?: Resolver<ResolversTypes['InstallConnectorPayload'], ParentType, ContextType, RequireFields<MutationInstallConnectorArgs, 'input'>>;
  promoteEnvironment?: Resolver<ResolversTypes['PromoteEnvironmentPayload'], ParentType, ContextType, RequireFields<MutationPromoteEnvironmentArgs, 'input'>>;
  publishWorkflow?: Resolver<ResolversTypes['PublishWorkflowPayload'], ParentType, ContextType, RequireFields<MutationPublishWorkflowArgs, 'input'>>;
};

export type NodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node']> = {
  config?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  position?: Resolver<Maybe<ResolversTypes['Position']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PolicyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Policy'] = ResolversParentTypes['Policy']> = {
  config?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PositionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Position'] = ResolversParentTypes['Position']> = {
  x?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  y?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PromoteEnvironmentPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PromoteEnvironmentPayload'] = ResolversParentTypes['PromoteEnvironmentPayload']> = {
  promotion?: Resolver<ResolversTypes['Promotion'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PromotionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Promotion'] = ResolversParentTypes['Promotion']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  promotedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  promotedBy?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sourceEnvironment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targetEnvironment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  workflowId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PublishWorkflowPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PublishWorkflowPayload'] = ResolversParentTypes['PublishWorkflowPayload']> = {
  validationResult?: Resolver<ResolversTypes['ValidationResult'], ParentType, ContextType>;
  workflowVersion?: Resolver<ResolversTypes['WorkflowVersion'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  connector?: Resolver<Maybe<ResolversTypes['Connector']>, ParentType, ContextType, RequireFields<QueryConnectorArgs, 'id'>>;
  dashboards?: Resolver<Array<ResolversTypes['Dashboard']>, ParentType, ContextType>;
  execution?: Resolver<Maybe<ResolversTypes['Execution']>, ParentType, ContextType, RequireFields<QueryExecutionArgs, 'id'>>;
  executions?: Resolver<ResolversTypes['ExecutionConnection'], ParentType, ContextType, Partial<QueryExecutionsArgs>>;
  me?: Resolver<ResolversTypes['CurrentUser'], ParentType, ContextType>;
  templates?: Resolver<ResolversTypes['TemplateConnection'], ParentType, ContextType, Partial<QueryTemplatesArgs>>;
  tenants?: Resolver<Array<ResolversTypes['Tenant']>, ParentType, ContextType>;
  workflow?: Resolver<Maybe<ResolversTypes['Workflow']>, ParentType, ContextType, RequireFields<QueryWorkflowArgs, 'id'>>;
  workflows?: Resolver<ResolversTypes['WorkflowConnection'], ParentType, ContextType, Partial<QueryWorkflowsArgs>>;
};

export type RoleResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StepResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StepResult'] = ResolversParentTypes['StepResult']> = {
  attemptNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  durationMs?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodeId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  output?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = {
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  versions?: Resolver<Array<ResolversTypes['TemplateVersion']>, ParentType, ContextType>;
  visibility?: Resolver<ResolversTypes['Visibility'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateConnection'] = ResolversParentTypes['TemplateConnection']> = {
  edges?: Resolver<Array<ResolversTypes['TemplateEdgeNode']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateEdgeNodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateEdgeNode'] = ResolversParentTypes['TemplateEdgeNode']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Template'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateVersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TemplateVersion'] = ResolversParentTypes['TemplateVersion']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  templateId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  versionNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TenantResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Tenant'] = ResolversParentTypes['Tenant']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  memberships?: Resolver<Array<ResolversTypes['Membership']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  planId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  region?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tier?: Resolver<ResolversTypes['TenantTier'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ValidationErrorResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ValidationError'] = ResolversParentTypes['ValidationError']> = {
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ValidationResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ValidationResult'] = ResolversParentTypes['ValidationResult']> = {
  errors?: Resolver<Array<ResolversTypes['ValidationError']>, ParentType, ContextType>;
  valid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  warnings?: Resolver<Array<ResolversTypes['ValidationWarning']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ValidationWarningResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ValidationWarning'] = ResolversParentTypes['ValidationWarning']> = {
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VariableResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Variable'] = ResolversParentTypes['Variable']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WidgetResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Widget'] = ResolversParentTypes['Widget']> = {
  config?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Position'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['WidgetSize'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WidgetSizeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WidgetSize'] = ResolversParentTypes['WidgetSize']> = {
  height?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  width?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Workflow'] = ResolversParentTypes['Workflow']> = {
  currentVersion?: Resolver<Maybe<ResolversTypes['WorkflowVersion']>, ParentType, ContextType>;
  currentVersionId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkflowStatus'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  tenantId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  versions?: Resolver<ResolversTypes['WorkflowVersionConnection'], ParentType, ContextType, Partial<WorkflowVersionsArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkflowConnection'] = ResolversParentTypes['WorkflowConnection']> = {
  edges?: Resolver<Array<ResolversTypes['WorkflowEdgeNode']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowEdgeNodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkflowEdgeNode'] = ResolversParentTypes['WorkflowEdgeNode']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Workflow'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowVersionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkflowVersion'] = ResolversParentTypes['WorkflowVersion']> = {
  checksum?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  graph?: Resolver<ResolversTypes['GraphSnapshot'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  publishedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  versionNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowVersionConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkflowVersionConnection'] = ResolversParentTypes['WorkflowVersionConnection']> = {
  edges?: Resolver<Array<ResolversTypes['WorkflowVersionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkflowVersionEdgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WorkflowVersionEdge'] = ResolversParentTypes['WorkflowVersionEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['WorkflowVersion'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  Checkpoint?: CheckpointResolvers<ContextType>;
  Connector?: ConnectorResolvers<ContextType>;
  ConnectorVersion?: ConnectorVersionResolvers<ContextType>;
  CreateDashboardPayload?: CreateDashboardPayloadResolvers<ContextType>;
  CurrentUser?: CurrentUserResolvers<ContextType>;
  Dashboard?: DashboardResolvers<ContextType>;
  DashboardVersion?: DashboardVersionResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Edge?: EdgeResolvers<ContextType>;
  Execution?: ExecutionResolvers<ContextType>;
  ExecutionConnection?: ExecutionConnectionResolvers<ContextType>;
  ExecutionEdgeNode?: ExecutionEdgeNodeResolvers<ContextType>;
  GraphSnapshot?: GraphSnapshotResolvers<ContextType>;
  InstallConnectorPayload?: InstallConnectorPayloadResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Membership?: MembershipResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Policy?: PolicyResolvers<ContextType>;
  Position?: PositionResolvers<ContextType>;
  PromoteEnvironmentPayload?: PromoteEnvironmentPayloadResolvers<ContextType>;
  Promotion?: PromotionResolvers<ContextType>;
  PublishWorkflowPayload?: PublishWorkflowPayloadResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  StepResult?: StepResultResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  TemplateConnection?: TemplateConnectionResolvers<ContextType>;
  TemplateEdgeNode?: TemplateEdgeNodeResolvers<ContextType>;
  TemplateVersion?: TemplateVersionResolvers<ContextType>;
  Tenant?: TenantResolvers<ContextType>;
  ValidationError?: ValidationErrorResolvers<ContextType>;
  ValidationResult?: ValidationResultResolvers<ContextType>;
  ValidationWarning?: ValidationWarningResolvers<ContextType>;
  Variable?: VariableResolvers<ContextType>;
  Widget?: WidgetResolvers<ContextType>;
  WidgetSize?: WidgetSizeResolvers<ContextType>;
  Workflow?: WorkflowResolvers<ContextType>;
  WorkflowConnection?: WorkflowConnectionResolvers<ContextType>;
  WorkflowEdgeNode?: WorkflowEdgeNodeResolvers<ContextType>;
  WorkflowVersion?: WorkflowVersionResolvers<ContextType>;
  WorkflowVersionConnection?: WorkflowVersionConnectionResolvers<ContextType>;
  WorkflowVersionEdge?: WorkflowVersionEdgeResolvers<ContextType>;
};


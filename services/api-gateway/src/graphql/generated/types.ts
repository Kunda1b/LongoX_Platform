export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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

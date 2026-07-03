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

export type CreateDashboardInput = {
  layout: Scalars['JSON']['input'];
  title: Scalars['String']['input'];
};

export type DashboardStatus =
  | 'DRAFT'
  | 'PUBLISHED';

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

export type InstallConnectorInput = {
  config: Scalars['JSON']['input'];
  connectorId: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};

export type MembershipStatus =
  | 'ACTIVE'
  | 'DEACTIVATED'
  | 'INVITED';

export type PromoteEnvironmentInput = {
  sourceEnvironment: Scalars['String']['input'];
  targetEnvironment: Scalars['String']['input'];
  versionId: Scalars['ID']['input'];
  workflowId: Scalars['ID']['input'];
};

export type PublishWorkflowInput = {
  expectedDraftVersion: Scalars['Int']['input'];
  releaseNotes?: InputMaybe<Scalars['String']['input']>;
  workflowId: Scalars['ID']['input'];
};

export type TenantTier =
  | 'DEDICATED_CLUSTER'
  | 'DEDICATED_NAMESPACE'
  | 'SHARED';

export type TrustLevel =
  | 'COMMUNITY'
  | 'OFFICIAL'
  | 'PARTNER';

export type Visibility =
  | 'PRIVATE'
  | 'PUBLIC'
  | 'TEAM';

export type WorkflowFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<WorkflowStatus>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type WorkflowStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'INACTIVE';

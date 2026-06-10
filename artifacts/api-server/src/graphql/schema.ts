export const typeDefs = `#graphql
  type Query {
    me: User
    workflow(id: ID!): Workflow
    workflows(limit: Int, offset: Int): [Workflow!]!
    workflowVersion(id: ID!): WorkflowVersion
    execution(id: ID!): Execution
    executions(workflowId: ID, limit: Int, offset: Int): [Execution!]!
    dashboard(id: ID!): Dashboard
    dashboards(limit: Int, offset: Int): [Dashboard!]!
    connectors(limit: Int, offset: Int): [Connector!]!
    connector(id: ID!): Connector
    templates(category: String, limit: Int, offset: Int): [Template!]!
    template(id: ID!): Template
  }

  type Mutation {
    publishWorkflow(id: ID!, message: String): PublishResult
    createExecution(workflowId: ID!, triggerType: String!): Execution
    cancelExecution(id: ID!): Execution
  }

  type Subscription {
    executionUpdated(workflowId: ID): ExecutionUpdate
  }

  type User {
    id: ID!
    email: String!
    name: String!
    tenantId: ID
    role: String!
    permissions: [String!]
  }

  type Workflow {
    id: ID!
    name: String!
    status: String!
    description: String
    nodes: [WorkflowNode!]!
    edges: [WorkflowEdge!]!
    versions: [WorkflowVersion!]!
    currentVersion: WorkflowVersion
    createdAt: String!
    updatedAt: String!
    lastRunStatus: String
    lastRunAt: String
    executionCount: Int!
  }

  type WorkflowNode {
    id: ID!
    name: String!
    type: String
    nodeTypeId: String
    position: Position
    config: JSON
  }

  type WorkflowEdge {
    id: ID!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    label: String
  }

  type Position {
    x: Float!
    y: Float!
  }

  type WorkflowVersion {
    id: ID!
    versionNumber: Int!
    graph: JSON
    checksum: String
    status: String!
    message: String
    createdAt: String!
    isActive: Boolean!
  }

  type Execution {
    id: ID!
    workflowId: ID!
    workflowName: String!
    status: String!
    startedAt: String!
    finishedAt: String
    durationMs: Int
    errorMessage: String
    steps: [ExecutionStep!]
  }

  type ExecutionStep {
    nodeId: ID!
    nodeName: String!
    status: String!
    durationMs: Int
    error: String
  }

  type ExecutionUpdate {
    executionId: ID!
    workflowId: ID
    status: String!
    nodeId: ID
    nodeStatus: String
    progress: Int
    message: String
    timestamp: String!
  }

  type Dashboard {
    id: ID!
    title: String!
    description: String
    layout: JSON
    widgets: [Widget!]
    status: String!
    version: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Widget {
    id: ID!
    type: String!
    title: String
    config: JSON
    position: WidgetPosition
  }

  type WidgetPosition {
    x: Int!
    y: Int!
    w: Int!
    h: Int!
  }

  type Connector {
    id: ID!
    name: String!
    slug: String!
    description: String
    version: String!
    trustLevel: String!
    authMethods: [String!]
    actions: [ConnectorAction!]
    triggers: [ConnectorTrigger!]
  }

  type ConnectorAction {
    name: String!
    description: String
    inputSchema: JSON
    outputSchema: JSON
  }

  type ConnectorTrigger {
    name: String!
    description: String
    type: String!
  }

  type Template {
    id: ID!
    name: String!
    category: String!
    description: String
    version: String!
    installCount: Int!
    createdAt: String!
  }

  type PublishResult {
    version: WorkflowVersion!
    validationResult: ValidationResult!
  }

  type ValidationResult {
    valid: Boolean!
    errors: [ValidationError!]
    warnings: [ValidationError!]
  }

  type ValidationError {
    type: String!
    message: String!
    nodeId: ID
    code: String!
  }

  scalar JSON
`;

/**
 * TypeScript types generated from services/api-gateway/openapi/openapi.yaml
 *
 * Run: pnpm --filter @longox/shared-types run codegen
 * Tool: openapi-typescript v7
 *
 * This file is auto-generated — do not edit manually.
 * To regenerate: pnpm --filter @longox/shared-types run codegen
 */

export interface paths {
  "/auth/login": {
    post: operations["loginUser"];
  };
  "/auth/logout": {
    post: operations["logoutUser"];
  };
  "/auth/refresh": {
    post: operations["refreshToken"];
  };
  "/tenants/me": {
    get: operations["getMyTenant"];
  };
  "/users": {
    get: operations["listUsers"];
  };
  "/roles": {
    get: operations["listRoles"];
    post: operations["createRole"];
  };
  "/workflows": {
    get: operations["listWorkflows"];
    post: operations["createWorkflow"];
  };
  "/workflows/{id}": {
    get: operations["getWorkflow"];
    put: operations["updateWorkflow"];
  };
  "/workflows/{id}/publish": {
    post: operations["publishWorkflow"];
  };
  "/workflows/{id}/clone": {
    post: operations["cloneWorkflow"];
  };
  "/workflows/{id}/versions": {
    get: operations["listWorkflowVersions"];
  };
  "/executions": {
    get: operations["listExecutions"];
  };
  "/executions/{id}": {
    get: operations["getExecution"];
  };
  "/executions/{id}/retry": {
    post: operations["retryExecution"];
  };
  "/executions/{id}/cancel": {
    post: operations["cancelExecution"];
  };
  "/triggers/webhook": {
    post: operations["receiveWebhookTrigger"];
  };
  "/connectors": {
    get: operations["listConnectors"];
    post: operations["createConnector"];
  };
  "/connectors/{id}/install": {
    post: operations["installConnector"];
  };
  "/templates": {
    get: operations["listTemplates"];
    post: operations["publishTemplate"];
  };
  "/dashboards": {
    get: operations["listDashboards"];
    post: operations["createDashboard"];
  };
  "/dashboards/{id}/publish": {
    post: operations["publishDashboard"];
  };
  "/billing/usage": {
    get: operations["getBillingUsage"];
  };
  "/invoices": {
    get: operations["listInvoices"];
  };
  "/ai/runs": {
    post: operations["createAiRun"];
  };
  "/ai/models": {
    get: operations["listAiModels"];
  };
  "/audit": {
    get: operations["listAuditLog"];
  };
  "/feature-flags": {
    get: operations["listFeatureFlags"];
    post: operations["upsertFeatureFlag"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    ErrorDetail: {
      field?: string;
      rule?: string;
      value?: string;
    };
    ErrorEnvelope: {
      error: {
        code: string;
        message: string;
        details?: components["schemas"]["ErrorDetail"][];
        correlation_id: string;
        retry_after_seconds?: number | null;
        documentation_url?: string;
      };
    };
    PageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    LoginInput: {
      email: string;
      password: string;
      mfa_code?: string;
      sso_assertion?: string;
    };
    TenantContext: {
      tenant_id: string;
      name: string;
      tier: "shared" | "dedicated_namespace" | "dedicated_cluster";
      plan_id: string;
      region?: string;
    };
    AuthResponse: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      tenant_context: components["schemas"]["TenantContext"];
    };
    Tenant: {
      id: string;
      name: string;
      slug: string;
      plan: string;
      tier: "shared" | "dedicated_namespace" | "dedicated_cluster";
      status: "active" | "suspended" | "cancelled";
      billing_account_id?: string;
      region_policy?: string;
      created_at?: string;
    };
    User: {
      id: string;
      email: string;
      name: string;
      status: "active" | "deactivated";
      locale?: string;
      avatar_url?: string;
      created_at?: string;
    };
    UserPage: {
      data: components["schemas"]["User"][];
      page_info: components["schemas"]["PageInfo"];
      total_count: number;
    };
    Role: {
      id: string;
      tenant_id?: string;
      name: string;
      scope: "platform" | "tenant" | "environment" | "resource";
      permissions?: string[];
    };
    RoleInput: {
      name: string;
      scope: "platform" | "tenant" | "environment" | "resource";
      permission_ids?: string[];
    };
    WorkflowStatus: "draft" | "active" | "inactive" | "archived";
    GraphNode: {
      id: string;
      name?: string;
      type: string;
      position?: { x: number; y: number };
      config?: Record<string, unknown>;
    };
    GraphEdge: {
      id: string;
      source: string;
      target: string;
      label?: string;
      condition?: Record<string, unknown>;
    };
    GraphSnapshot: {
      nodes: components["schemas"]["GraphNode"][];
      edges: components["schemas"]["GraphEdge"][];
      variables?: Record<string, unknown>[];
      policies?: Record<string, unknown>[];
    };
    Workflow: {
      id: string;
      tenant_id: string;
      name: string;
      description?: string;
      status: components["schemas"]["WorkflowStatus"];
      trigger_type?: "manual" | "schedule" | "webhook" | "event";
      current_version_id?: string;
      tags?: string[];
      last_run_at?: string;
      last_run_status?: string;
      created_at?: string;
      updated_at?: string;
    };
    WorkflowInput: {
      name: string;
      description?: string;
      trigger_type?: "manual" | "schedule" | "webhook" | "event";
      graph?: components["schemas"]["GraphSnapshot"];
      tags?: string[];
    };
    WorkflowUpdate: {
      name?: string;
      description?: string;
      trigger_type?: string;
      graph?: components["schemas"]["GraphSnapshot"];
      tags?: string[];
    };
    WorkflowVersion: {
      id: string;
      workflow_id: string;
      version_number: number;
      graph?: components["schemas"]["GraphSnapshot"];
      checksum: string;
      release_notes?: string;
      created_by?: string;
      published_at?: string;
      created_at: string;
    };
    PublishWorkflowInput: {
      expected_draft_version?: number;
      release_notes?: string;
    };
    PublishWorkflowResponse: {
      version_id: string;
      version_number: number;
      checksum: string;
      published_at: string;
    };
    WorkflowPage: {
      data: components["schemas"]["Workflow"][];
      page_info: components["schemas"]["PageInfo"];
      total_count: number;
    };
    ExecutionStatus:
      | "pending"
      | "running"
      | "success"
      | "failed"
      | "cancelled"
      | "timed_out";
    ExecutionTriggerType: "manual" | "schedule" | "webhook" | "event" | "api";
    StepResult: {
      node_id: string;
      status: string;
      output?: Record<string, unknown>;
      error?: string;
      duration_ms: number;
      attempt_number: number;
    };
    Checkpoint: {
      id: string;
      node_id: string;
      state: Record<string, unknown>;
      created_at: string;
    };
    Execution: {
      id: string;
      workflow_id: string;
      workflow_version_id?: string;
      status: components["schemas"]["ExecutionStatus"];
      trigger_type: components["schemas"]["ExecutionTriggerType"];
      started_at: string;
      finished_at?: string;
      duration_ms?: number;
      error_message?: string;
      step_results?: components["schemas"]["StepResult"][];
      checkpoints?: components["schemas"]["Checkpoint"][];
    };
    ExecutionPage: {
      data: components["schemas"]["Execution"][];
      page_info: components["schemas"]["PageInfo"];
      total_count: number;
    };
    TrustLevel: "first_party" | "partner" | "community";
    Connector: {
      id: string;
      slug: string;
      name: string;
      description?: string;
      icon?: string;
      category?: string;
      trust_level: components["schemas"]["TrustLevel"];
      scope?: string;
      installed?: boolean;
    };
    ConnectorInstallInput: {
      version_id: string;
      secret_ref: string;
      config?: Record<string, unknown>;
    };
    ConnectorInstallResponse: {
      install_id: string;
      status: string;
    };
    TemplateVisibility: "public" | "team" | "private";
    Template: {
      id: string;
      name?: string;
      description?: string;
      category: string;
      visibility: components["schemas"]["TemplateVisibility"];
      status: "draft" | "published" | "deprecated";
      source_type?: string;
      install_count?: number;
      created_at?: string;
    };
    Dashboard: {
      id: string;
      tenant_id: string;
      title: string;
      description?: string;
      status: "draft" | "published";
      current_version_id?: string;
      layout_version?: number;
      created_at?: string;
      updated_at?: string;
    };
    DashboardInput: {
      title: string;
      description?: string;
      layout?: Record<string, unknown>;
    };
    UsageSummary: {
      tenant_id: string;
      period_start: string;
      period_end: string;
      metrics?: Record<string, number>;
    };
    Invoice: {
      id: string;
      billing_account_id?: string;
      invoice_number: string;
      period_start?: string;
      period_end?: string;
      status: "draft" | "open" | "paid" | "void";
      total_amount?: number;
      currency?: string;
    };
    AiModel: {
      provider: string;
      model_name: string;
      context_window?: number;
      price_json?: Record<string, unknown>;
      risk_tags?: string[];
      status: "active" | "deprecated" | "disabled";
    };
    AiRunInput: {
      prompt_version_id: string;
      model: string;
      parameters?: {
        temperature?: number;
        max_tokens?: number;
      };
      fallback_chain?: string[];
      rag_config?: {
        knowledge_base_id?: string;
        top_k?: number;
      };
      variables?: Record<string, unknown>;
    };
    AiRunResponse: {
      run_id: string;
      output: string;
      token_usage: {
        prompt_tokens: number;
        completion_tokens: number;
        cached_tokens?: number;
        cost_usd: number;
      };
      prompt_version_id?: string;
      model: string;
      provider: string;
    };
    AuditLogEntry: {
      id: string;
      actor_id: string;
      action: string;
      target_type?: string;
      target_id?: string;
      diff_json?: Record<string, unknown>;
      occurred_at: string;
    };
    AuditLogPage: {
      data: components["schemas"]["AuditLogEntry"][];
      page_info: components["schemas"]["PageInfo"];
      total_count: number;
    };
    FeatureFlag: {
      id: string;
      tenant_id?: string;
      key: string;
      value: Record<string, unknown>;
      updated_at?: string;
    };
    FeatureFlagInput: {
      tenant_id?: string;
      key: string;
      value: Record<string, unknown>;
    };
    WebhookTriggerResponse: {
      execution_id: string;
      queued_at: string;
    };
  };
  responses: {
    Unauthorized: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    Forbidden: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    NotFound: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    Conflict: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    ValidationError: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    RateLimited: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
    TokenBudgetExhausted: {
      content: { "application/json": components["schemas"]["ErrorEnvelope"] };
    };
  };
  parameters: {
    IdempotencyKey: { header: { "x-idempotency-key": string } };
    TenantId: { header: { "x-tenant-id"?: string } };
    CorrelationId: { header: { "x-correlation-id"?: string } };
    PathId: { path: { id: string } };
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export interface operations {
  loginUser: {
    parameters: {
      header: {
        "x-idempotency-key": string;
        "x-correlation-id"?: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LoginInput"];
      };
    };
    responses: {
      200: {
        content: { "application/json": components["schemas"]["AuthResponse"] };
      };
      401: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
      422: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
      429: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  logoutUser: {
    parameters: {};
    responses: { 204: { content: never } };
  };
  refreshToken: {
    parameters: {};
    responses: {
      200: { content: { "application/json": components["schemas"]["AuthResponse"] } };
      401: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  getMyTenant: {
    parameters: {};
    responses: {
      200: { content: { "application/json": components["schemas"]["Tenant"] } };
      401: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listUsers: {
    parameters: {
      query?: {
        search?: string;
        status?: "active" | "deactivated";
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["UserPage"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listRoles: {
    parameters: {};
    responses: {
      200: { content: { "application/json": components["schemas"]["Role"][] } };
    };
  };
  createRole: {
    requestBody: { content: { "application/json": components["schemas"]["RoleInput"] } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Role"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listWorkflows: {
    parameters: {
      query?: {
        status?: components["schemas"]["WorkflowStatus"];
        search?: string;
        tags?: string[];
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["WorkflowPage"] } };
    };
  };
  createWorkflow: {
    requestBody: { content: { "application/json": components["schemas"]["WorkflowInput"] } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Workflow"] } };
      422: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  getWorkflow: {
    parameters: { path: { id: string } };
    responses: {
      200: { content: { "application/json": components["schemas"]["Workflow"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  updateWorkflow: {
    parameters: { path: { id: string } };
    requestBody: { content: { "application/json": components["schemas"]["WorkflowUpdate"] } };
    responses: {
      200: { content: { "application/json": components["schemas"]["Workflow"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  publishWorkflow: {
    parameters: {
      path: { id: string };
      header: { "x-idempotency-key": string };
    };
    requestBody?: { content: { "application/json": components["schemas"]["PublishWorkflowInput"] } };
    responses: {
      201: { content: { "application/json": components["schemas"]["PublishWorkflowResponse"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
      409: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  cloneWorkflow: {
    parameters: { path: { id: string }; header: { "x-idempotency-key": string } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Workflow"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listWorkflowVersions: {
    parameters: { path: { id: string }; query?: { first?: number; after?: string } };
    responses: {
      200: { content: { "application/json": components["schemas"]["WorkflowVersion"][] } };
    };
  };
  listExecutions: {
    parameters: {
      query?: {
        workflow_id?: string;
        status?: components["schemas"]["ExecutionStatus"];
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["ExecutionPage"] } };
    };
  };
  getExecution: {
    parameters: { path: { id: string } };
    responses: {
      200: { content: { "application/json": components["schemas"]["Execution"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  retryExecution: {
    parameters: { path: { id: string }; header: { "x-idempotency-key": string } };
    responses: {
      202: { content: { "application/json": components["schemas"]["Execution"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  cancelExecution: {
    parameters: { path: { id: string } };
    responses: {
      202: { content: never };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  receiveWebhookTrigger: {
    parameters: {
      header: {
        "x-webhook-signature": string;
        "x-webhook-timestamp": number;
      };
    };
    requestBody: { content: { "application/json": Record<string, unknown> } };
    responses: {
      202: { content: { "application/json": components["schemas"]["WebhookTriggerResponse"] } };
      401: { content: never };
    };
  };
  listConnectors: {
    parameters: {
      query?: {
        category?: string;
        search?: string;
        trust_level?: components["schemas"]["TrustLevel"];
        installed?: boolean;
        first?: number;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["Connector"][] } };
    };
  };
  createConnector: {
    requestBody: { content: { "application/json": Record<string, unknown> } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Connector"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  installConnector: {
    parameters: { path: { id: string }; header: { "x-idempotency-key": string } };
    requestBody: { content: { "application/json": components["schemas"]["ConnectorInstallInput"] } };
    responses: {
      201: { content: { "application/json": components["schemas"]["ConnectorInstallResponse"] } };
      409: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listTemplates: {
    parameters: {
      query?: {
        category?: string;
        search?: string;
        visibility?: components["schemas"]["TemplateVisibility"];
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["Template"][] } };
    };
  };
  publishTemplate: {
    requestBody: { content: { "application/json": Record<string, unknown> } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Template"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listDashboards: {
    parameters: {
      query?: { search?: string; status?: "draft" | "published" };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["Dashboard"][] } };
    };
  };
  createDashboard: {
    requestBody: { content: { "application/json": components["schemas"]["DashboardInput"] } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Dashboard"] } };
    };
  };
  publishDashboard: {
    parameters: { path: { id: string }; header: { "x-idempotency-key": string } };
    responses: {
      201: { content: { "application/json": components["schemas"]["Dashboard"] } };
      404: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  getBillingUsage: {
    parameters: { query?: { period_start?: string; period_end?: string } };
    responses: {
      200: { content: { "application/json": components["schemas"]["UsageSummary"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listInvoices: {
    parameters: {
      query?: {
        status?: "draft" | "open" | "paid" | "void";
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["Invoice"][] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  createAiRun: {
    parameters: {
      header: {
        "x-idempotency-key": string;
        "x-correlation-id"?: string;
        accept?: "application/json" | "text/event-stream";
      };
    };
    requestBody: { content: { "application/json": components["schemas"]["AiRunInput"] } };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["AiRunResponse"];
          "text/event-stream": string;
        };
      };
      402: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
      422: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listAiModels: {
    parameters: {
      query?: { provider?: string; status?: "active" | "deprecated" };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["AiModel"][] } };
    };
  };
  listAuditLog: {
    parameters: {
      query?: {
        actor_id?: string;
        action?: string;
        target_type?: string;
        target_id?: string;
        from?: string;
        to?: string;
        first?: number;
        after?: string;
      };
    };
    responses: {
      200: { content: { "application/json": components["schemas"]["AuditLogPage"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  upsertFeatureFlag: {
    requestBody: { content: { "application/json": components["schemas"]["FeatureFlagInput"] } };
    responses: {
      200: { content: { "application/json": components["schemas"]["FeatureFlag"] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
  listFeatureFlags: {
    parameters: { query?: { tenant_id?: string } };
    responses: {
      200: { content: { "application/json": components["schemas"]["FeatureFlag"][] } };
      403: { content: { "application/json": components["schemas"]["ErrorEnvelope"] } };
    };
  };
}

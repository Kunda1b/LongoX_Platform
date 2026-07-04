export type SearchableType = "workflows" | "apps" | "templates" | "connectors";

export type SearchCollection =
  | "workflows"
  | "executions"
  | "prompts"
  | "audit_logs"
  | "connectors";

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string | null;
  url: string;
  metadata: Record<string, unknown> | null;
  score?: number;
}

export interface SearchQueryInput {
  query: string;
  types: SearchableType[];
  limitPerType?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export interface ExecutionSearchInput {
  query: string;
  tenantId: string;
  status?: string;
  workflowId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AuditLogSearchInput {
  query: string;
  tenantId: string;
  action?: string;
  resource?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AiPromptSearchInput {
  query: string;
  tenantId: string;
  model?: string;
  limit?: number;
}

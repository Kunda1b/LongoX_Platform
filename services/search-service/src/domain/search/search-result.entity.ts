export type SearchableType = "workflows" | "apps" | "templates" | "connectors";

export type SearchCollection =
  | "workflows"
  | "executions"
  | "prompts"
  | "audit_logs"
  | "connectors";

export interface SearchResult {
  id: number;
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
  tenantId: number;
  status?: string;
  workflowId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AuditLogSearchInput {
  query: string;
  tenantId: number;
  action?: string;
  resource?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AiPromptSearchInput {
  query: string;
  tenantId: number;
  model?: string;
  limit?: number;
}

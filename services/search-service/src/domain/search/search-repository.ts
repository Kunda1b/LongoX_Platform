import type { SearchResult, SearchableType } from "./search-result.entity";

export interface SearchRepository {
  search(
    query: string,
    types: SearchableType[],
    limitPerType: number,
  ): Promise<SearchResult[]>;

  searchExecutions(
    query: string,
    tenantId: string,
    filters?: {
      status?: string;
      workflowId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
  ): Promise<SearchResult[]>;

  searchAuditLogs(
    query: string,
    tenantId: string,
    filters?: {
      action?: string;
      resource?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
  ): Promise<SearchResult[]>;

  searchAiPrompts(
    query: string,
    tenantId: string,
    filters?: {
      model?: string;
    },
    limit?: number,
  ): Promise<SearchResult[]>;
}

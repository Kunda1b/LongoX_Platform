import type { SearchResult, SearchableType } from "./search-result.entity";

export interface SearchRepository {
  search(
    query: string,
    types: SearchableType[],
    limitPerType: number,
  ): Promise<SearchResult[]>;

  searchExecutions(
    query: string,
    tenantId: number,
    filters?: {
      status?: string;
      workflowId?: number;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
  ): Promise<SearchResult[]>;

  searchAuditLogs(
    query: string,
    tenantId: number,
    filters?: {
      action?: string;
      resource?: string;
      userId?: number;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
  ): Promise<SearchResult[]>;

  searchAiPrompts(
    query: string,
    tenantId: number,
    filters?: {
      model?: string;
    },
    limit?: number,
  ): Promise<SearchResult[]>;
}

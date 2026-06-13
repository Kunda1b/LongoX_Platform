import type { SearchRepository } from "../../domain/search/search-repository";
import type {
  SearchQueryInput,
  SearchResponse,
  ExecutionSearchInput,
  AuditLogSearchInput,
  AiPromptSearchInput,
  SearchResult,
} from "../../domain/search/search-result.entity";

export class SearchQuery {
  constructor(private readonly repository: SearchRepository) {}

  async execute(input: SearchQueryInput): Promise<SearchResponse> {
    const query = input.query.trim();
    if (!query) return { query, results: [], total: 0 };

    const results = await this.repository.search(
      query,
      input.types,
      input.limitPerType ?? 10,
    );
    return { query, results, total: results.length };
  }

  async searchExecutions(input: ExecutionSearchInput): Promise<SearchResponse> {
    const query = input.query.trim();
    if (!query) return { query, results: [], total: 0 };

    const results = await this.repository.searchExecutions(
      query,
      input.tenantId,
      {
        status: input.status,
        workflowId: input.workflowId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      input.limit ?? 20,
    );

    return { query, results, total: results.length };
  }

  async searchAuditLogs(input: AuditLogSearchInput): Promise<SearchResponse> {
    const query = input.query.trim();
    if (!query) return { query, results: [], total: 0 };

    const results = await this.repository.searchAuditLogs(
      query,
      input.tenantId,
      {
        action: input.action,
        resource: input.resource,
        userId: input.userId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      input.limit ?? 20,
    );

    return { query, results, total: results.length };
  }

  async searchAiPrompts(input: AiPromptSearchInput): Promise<SearchResponse> {
    const query = input.query.trim();
    if (!query) return { query, results: [], total: 0 };

    const results = await this.repository.searchAiPrompts(
      query,
      input.tenantId,
      {
        model: input.model,
      },
      input.limit ?? 20,
    );

    return { query, results, total: results.length };
  }
}

import type { SearchRepository } from "../../domain/search/search-repository";
import type {
  SearchQueryInput,
  SearchResponse,
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
}

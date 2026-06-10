import type { SearchResult, SearchableType } from "./search-result.entity";

export interface SearchRepository {
  search(
    query: string,
    types: SearchableType[],
    limitPerType: number,
  ): Promise<SearchResult[]>;
}

export type SearchableType = "workflows" | "apps" | "templates" | "connectors";

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  description: string | null;
  url: string;
  metadata: Record<string, unknown> | null;
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

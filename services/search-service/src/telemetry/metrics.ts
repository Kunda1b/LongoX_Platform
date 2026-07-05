import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("search-service");

// Counters
export const searchQueriesCounter = meter.createCounter("search.queries", {
  description: "Total search queries",
});

export const searchResultsCounter = meter.createCounter("search.results", {
  description: "Total search results returned",
});

// Histograms
export const searchDurationHistogram = meter.createHistogram(
  "search.duration",
  {
    description: "Search query duration in milliseconds",
    unit: "ms",
  },
);

export const searchResultsPerQueryHistogram = meter.createHistogram(
  "search.results.per_query",
  {
    description: "Number of results per search query",
  },
);

// Gauges
export const searchIndexSizeGauge = meter.createGauge("search.index.size", {
  description: "Search index size",
});

// Helper functions
export function recordSearchQuery(
  queryType: string,
  tenantId: string,
  durationMs: number,
  resultCount: number,
): void {
  const attrs = { query_type: queryType, tenant_id: tenantId };
  searchQueriesCounter.add(1, attrs);
  searchDurationHistogram.record(durationMs, attrs);
  searchResultsCounter.add(resultCount, attrs);
  searchResultsPerQueryHistogram.record(resultCount, attrs);
}

export function updateSearchIndexSize(size: number): void {
  searchIndexSizeGauge.record(size);
}

export * from "./postgres/search-repository";
// Typesense removed per ADR-010 — PostgreSQL FTS is the sole search backend.
// Escape path to OpenSearch documented in ADR-010; not implemented as a
// runtime switch (would require a separate migration if triggered).

# ADR-010: PostgreSQL Full-Text Search for v2.x

- **Status**: Accepted
- **Date**: 2026-06-18
- **Deciders**: Search Team, Platform Architecture, SRE Lead
- **Supersedes**: n/a
- **Superseded by**: n/a

## Context

The platform needs search across workflows, templates, connectors, dashboards, executions, and audit logs.

## Decision

Use PostgreSQL full-text search (tsvector + GIN index) for v2.x with a documented escape path to OpenSearch.

## Consequences

- Positive: no new stateful dependency
- Negative: PostgreSQL FTS ranking less sophisticated than OpenSearch
- Neutral: SearchService abstraction makes future migration mechanical

## References

architecture.md Section 26.11, services/api-gateway/src/services/search.service.ts

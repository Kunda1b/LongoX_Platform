# ADR-013: Prisma ORM Migration Plan

## Status

Accepted

## Context

The LongoX platform currently uses Drizzle ORM for database access. Per Section 29.2 of the architecture document, Prisma is designated as the long-term canonical schema and migration layer. The `schema.prisma` file (2071 lines, 50+ models) is already defined and must become the primary ORM.

## Decision

Execute a three-phase migration from Drizzle to Prisma across all services.

## Phase 1: Prisma Client Generation + Parallel Drizzle/Prisma

- Generate Prisma Client from the canonical `schema.prisma`
- Add `@prisma/client` and `prisma` CLI as `postinstall` hook
- Run both Drizzle and Prisma schemas in parallel for the `shared-db` package
- Validate that `prisma generate` produces matching types
- Estimated effort: 2–3 days

## Phase 2: Service-by-Service Migration

Migrate services one at a time, starting with those that only use `shared-db`:

| Service              | Drizzle Scope                   | Prisma Migration Effort | Priority |
| -------------------- | ------------------------------- | ----------------------- | -------- |
| shared-db            | Full schema re-export           | 2d (base layer)         | P0       |
| auth-service         | users, memberships, sessions    | 1d                      | P0       |
| workflow-service     | workflows, versions, diffs      | 2d                      | P0       |
| execution-service    | executions, checkpoints, leases | 2d                      | P0       |
| connector-service    | connectors, versions, installs  | 1d                      | P1       |
| billing-service      | plans, invoices, usage          | 1d                      | P1       |
| metering-service     | metering_events, rollups        | 0.5d                    | P1       |
| notification-service | notifications, templates        | 0.5d                    | P1       |
| audit-service        | audit_logs                      | 0.5d                    | P1       |
| ai-service           | models, prompts, eval, rag      | 2d                      | P1       |
| scheduler-service    | schedules                       | 0.5d                    | P1       |
| dashboard-service    | dashboards, widgets             | 1d                      | P2       |
| datasource-service   | data_sources                    | 0.5d                    | P2       |
| template-service     | templates, versions             | 0.5d                    | P2       |
| search-service       | search_index, suggestions       | 0.5d                    | P2       |
| marketplace-service  | listings, installs, reviews     | 1d                      | P2       |
| compliance-service   | evidence, gdpr                  | 0.5d                    | P2       |
| admin-frontend       | (none — API only)               | 0d                      | P3       |

**Strategy per service:**

1. Add `PrismaService` wrapper alongside existing Drizzle client
2. Migrate read queries first (SELECT) while writes still use Drizzle
3. Migrate write queries in the same PR
4. Remove Drizzle imports for that service
5. Run integration tests against both clients to verify parity

## Phase 3: Remove Drizzle Dependency

- Remove `drizzle-orm`, `drizzle-kit`, `drizzle-zod` from `shared-db/package.json`
- Delete `packages/shared-db/src/schema/` directory
- Delete `drizzle.config.ts`
- Remove Drizzle-specific CI steps (`drizzle-kit check`)
- Remove Drizzle-specific scripts from all `package.json` files
- Clean up `catalog:` entries for Drizzle in root `package.json`
- Estimated effort: 1 day

## Consequences

- **Positive**: Type-safe queries, unified migration tooling, stronger schema enforcement
- **Positive**: Prisma Migrate provides production-grade migration history and rollback
- **Negative**: Drizzle's raw SQL-like DX is lost; some complex queries need raw fallback
- **Negative**: Migration requires coordinated PRs across multiple services
- **Negative**: pgvector support in Prisma requires `Unsupported("vector(1536)")` type workaround

## Estimated Total Effort

Phase 1: 2–3 days
Phase 2: 14–18 days total across all services
Phase 3: 1 day

Total: ~17–22 days elapsed (can be parallelized across service owners)

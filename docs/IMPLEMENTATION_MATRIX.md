# Implementation Matrix

Architecture requirement → implementation status tracking per `architecture.md` v2.1.

| Area | Requirement | Status | Notes |
|------|-----------|--------|-------|
| **Build & CI** | Root typecheck passes | ✅ | 3 project references build; services check independently |
| | Lint (prettier) passes | ✅ | Configured in CI |
| | Tests pass | 🟡 | Vitest + Playwright configured; contract + unit tests; root `pnpm test` |
| | CI gates fail on error | ✅ | No `\|\| true` in required CI gates |
| **API Contracts** | OpenAPI 3.1 spec | ✅ | Complete spec at `lib/api-spec/openapi.yaml` |
| | Generated TS client from OpenAPI | ✅ | Orval-generated `api-client-react` |
| | GraphQL schema | ✅ | SDL at `services/api-gateway/graphql/schema.graphql`; codegen types in `src/graphql/generated/` |
| | Zod request schemas | 🟡 | Partial (only workflow + execution schemas, ~20% coverage) |
| **Database** | Drizzle schema | ✅ | 50+ tables defined in `packages/shared-db/src/schema/` |
| | Prisma as canonical schema | ❌ | Not implemented; project still on Drizzle per ADR pending |
| | Architecture-complete schema | ✅ | All tables present: workflow_diffs, environment_releases, tenant_settings, usage_rollups, token_budgets, RAG tables, AI eval tables, tenant_tiers, retention_config, etc. |
| **Auth** | JWT auth | ✅ | Basic email/password in auth-service |
| | WorkOS SSO/MFA | 🟡 | WorkOS SDK fully wired in backend (routes, SCIM sync, Admin Portal, MFA TOTP); AuthKit frontend components not yet connected; WebAuthn/SMS MFA not implemented |
| | RBAC enforcement | ✅ | Shared RBAC package with 35+ permissions, 7 roles, authorization middleware, caching, tests |
| **API Gateway** | Kong gateway | 🟡 | Kong declarative config exists (YAML + Terraform + Helm + dev docker-compose); no CI/CD pipeline for Kong deployments; `opentelemetry` plugin missing |
| | Versioned API routing | 🟡 | `/api/v1` prefix used; deprecation headers emitted; `registerVersionedRoutes()` unused; all versions run identical code |
| **Workflow Engine** | DAG execution | ✅ | Topological sort, executors, retry, checkpoint, parallel fan-out |
| | Bounded loops | ✅ | Implemented in `DAGRunner.executeBoundedLoop()` with maxIterations, breakOnKey, continueCondition |
| | Node leases | ✅ | `InMemoryLeaseStore` + `RedisLeaseStore` + `NoOpLeaseStore` implemented; lease acquired before each node in DAGRunner |
| | Saga compensation | ✅ | LIFO reverse-order compensation in `DAGRunner.runSagaCompensation()`; opt-in per node |
| | Child workflows | ✅ | Subworkflow nodes with `spawnChildWorkflow` callback; parent-child correlation via `parentExecutionId` |
| | Human approval pause/resume | ✅ | Approval gate in `executeNodeWithPolicy()`; writes to `approvalTasksTable`; pauses execution, resumes on signal |
| | JSON Patch diffs | ✅ | `computeFullDiff()` from `@longox/workflow-canvas` integrated in `publishWorkflow()` command; persisted to `workflowDiffsTable` with semantic summary |
| | Semantic diff rendering | 🟡 | `diff.ts` + `json-patch.ts` in `workflow-canvas` implement `classifyPatch()` with semantic change types; not yet connected to workflow builder UI |
| **Realtime** | SSE monitoring | 🟡 | SSE hub with `execution-stream` endpoint; `redis-execution-bus` adds multi-instance Redis pub/sub; event demultiplexing still single-connection per execution |
| **Executions** | Full execution lifecycle | ✅ | Production-ready in execution-service with BullMQ + Redis |
| | Dead-letter queue | ✅ | DLQ management implemented |
| | Retry with backoff | ✅ | Per-node retry with configurable attempts, exponential backoff, jitter |
| **Connectors** | Connector runtime | ✅ | 11 connectors; runtime with auth, actions, triggers |
| | Deno sandbox | ❌ | Still on Node.js `vm` module; `deno_core` not installed; `DenoIsolate` class uses `vm.Script`/`vm.runInNewContext` (security risk) |
| | Marketplace lifecycle | ✅ | Install, configure, upgrade, remove all implemented |
| **AI Platform** | Multi-provider routing | ✅ | 7 providers; AI router with strategies |
| | Prompt registry | ✅ | Versioned prompts with publish flow |
| | RAG (pgvector) | ❌ | Vector search service exists but no pgvector schema or actual RAG pipeline |
| | AI evaluation | 🟡 | Schema tables for datasets, entries, runs, results exist; eval framework code exists but CI eval gate not wired |
| | Guardrails & moderation | ✅ | Moderation service implemented |
| | Token accounting | ✅ | Token tracking and budgets |
| **Search** | PostgreSQL FTS | ✅ | FTS implemented in search-service + api-gateway (`websearch_to_tsquery`, `ts_rank`, GIN-indexed `search_index` table); parameterized queries (SQL injection fixed) |
| | Typesense integration | ✅ | Typesense client configured as alternative backend |
| **Billing** | Stripe integration | ✅ | Checkout, subscriptions, webhooks, invoices |
| | Usage metering | ✅ | Usage events with rollups |
| | Plan entitlements | 🟡 | Plans defined but enforcement not fully tested |
| **Infrastructure** | Terraform | ✅ | Modules for Vault, Redis, Postgres, EKS, networking, monitoring, Kong, WorkOS |
| | Kubernetes manifests | ✅ | All 19 services have base K8s manifests in 4 namespaces |
| | Helm chart | 🟡 | Renamed to longox; needs expansion beyond api-gateway + worker |
| | Observability (Grafana/Prometheus/OTel) | ✅ | Dashboards, datasources, OTel collector, Prometheus rules, synthetic checks configured |
| | Docker Compose | ✅ | Dev and distributed compose files |
| **Frontend** | Design system | 🟡 | 3 shared components (Button, Card, Badge) + tokens in `packages/design-system`; full Radix suite exists in `apps/web` but not shared |
| | Workflow builder UX | 🟡 | React Flow-based builder in `apps/web` with 25+ node types; `packages/workflow-canvas` data layer (diff, normalization, collab) built but not connected to UI |
| | Dashboard builder | 🟡 | Dashboard builder exists at `/dashboards/new` with 10 widget types; uses CSS grid (no proper grid library); env-aware preview missing; `/builder/` route now redirects to `/dashboards/new` |
| | App surfaces | 🟡 | All route groups exist (auth, workflows, executions, dashboard, marketplace, billing); `/admin/*` route group missing |
| **Retention** | 13M hot + 7Y cold | 🟡 | Retention pipeline implemented with partition manager, scheduler, archive service, cold query stub; Parquet format uses NDJSON placeholder; S3 upload uses placeholder bucket |
| **Multi-tenancy** | Tenant tiers (shared/dedicated namespace/dedicated cluster) | 🟡 | Schema + Terraform provisioning exist; `tenants.tier` column added; runtime enforcement (K8s selectors, DB routing, Redis, Vault) not wired |
| **Compliance** | GDPR export/delete | ❌ | Not implemented |
| | Audit export | ❌ | Not implemented |

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Implemented and verified |
| 🟡 | Partially implemented |
| ❌ | Missing or not started |

## Recent Fixes Applied

| # | Fix | File(s) | Date |
|---|-----|---------|------|
| 1 | API versioning v1 deprecation flag set to `true` | `services/api-gateway/src/lib/api-versioning.ts` | 2026-07-03 |
| 2 | `tier` column added to `tenants` table | `packages/shared-db/src/schema/tenants.ts` | 2026-07-03 |
| 3 | PostgreSQL FTS SQL injection fixed (parameterized queries) | `services/search-service/src/infrastructure/postgres/search-repository.ts` | 2026-07-03 |
| 4 | SSE multi-instance fanout via Redis pub/sub | `packages/shared-realtime/src/redis-execution-bus.ts` | 2026-07-03 |
| 5 | Dashboard builder route redirects to `/dashboards/new` | `apps/web/src/app/(dashboard)/builder/page.tsx` | 2026-07-03 |
| 6 | Node lease acquisition added to DAGRunner | `packages/workflow-engine/src/dag-runner.ts`, `src/types.ts`, `src/node-lease.ts` | 2026-07-03 |
| 7 | RBAC `Action` type includes `"promote"` | `packages/shared-rbac/src/index.ts` | 2026-07-03 |

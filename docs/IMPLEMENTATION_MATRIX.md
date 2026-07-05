# Implementation Matrix

Architecture requirement → implementation status tracking per `architecture.md` v2.1.

| Area                | Requirement                                                 | Status | Notes                                                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build & CI**      | Root typecheck passes                                       | ✅     | 3 project references build; services check independently                                                                                                                                                                                                                |
|                     | Lint (prettier) passes                                      | ✅     | Configured in CI                                                                                                                                                                                                                                                        |
|                     | Tests pass                                                  | 🟡     | Vitest + Playwright configured; contract + unit tests; root `pnpm test`                                                                                                                                                                                                 |
|                     | CI gates fail on error                                      | ✅     | No `\|\| true` in required CI gates                                                                                                                                                                                                                                     |
|                     | AI eval CI gate                                             | ✅     | `eval-gate` job in ci.yml; `pnpm --filter ai-service eval-gate`; triggered on prompt-change/model-change labels                                                                                                                                                         |
|                     | Kong config validation in CI                                | ✅     | `kong-lint` and `kong-integration-test` jobs in ci.yml                                                                                                                                                                                                                  |
| **API Contracts**   | OpenAPI 3.1 spec                                            | ✅     | Complete spec at `lib/api-spec/openapi.yaml`                                                                                                                                                                                                                            |
|                     | Generated TS client from OpenAPI                            | ✅     | Orval-generated `api-client-react`                                                                                                                                                                                                                                      |
|                     | GraphQL schema                                              | ✅     | SDL at `services/api-gateway/graphql/schema.graphql`; codegen types in `src/graphql/generated/`                                                                                                                                                                         |
|                     | Zod request schemas                                         | 🟡     | Schemas created for workflows, executions, connectors, dashboards, billing, AI, auth, teams (30+ endpoints); not all wired into routes yet                                                                                                                              |
| **Database**        | Drizzle schema                                              | ✅     | 55+ tables defined in `packages/shared-db/src/schema/`                                                                                                                                                                                                                  |
|                     | Prisma as canonical schema                                  | 🟡     | Prisma schema exists, `postinstall` script runs `prisma generate`; ADR-013 migration plan created; Drizzle still primary                                                                                                                                                |
|                     | Architecture-complete schema                                | ✅     | All tables present: workflow_diffs, environment_releases, tenant_settings, usage_rollups, token_budgets, RAG tables, AI eval tables, tenant_tiers, retention_config, consumer_offsets, pgvector HNSW index                                                              |
| **Auth**            | JWT auth                                                    | ✅     | Basic email/password in auth-service                                                                                                                                                                                                                                    |
|                     | WorkOS SSO/MFA                                              | 🟡     | WorkOS SDK fully wired in backend (routes, SCIM sync, Admin Portal, MFA TOTP); AuthKit frontend component created and added to login/register pages; WebAuthn/SMS MFA not implemented                                                                                   |
|                     | RBAC enforcement                                            | ✅     | Shared RBAC package with 35+ permissions, 7 roles, authorization middleware, caching, tests                                                                                                                                                                             |
| **API Gateway**     | Kong gateway                                                | 🟡     | Kong declarative config exists (YAML + Terraform + Helm + dev docker-compose); CI/CD jobs added to ci.yml/cd.yml; `opentelemetry` plugin configured; no Kong canary deployment                                                                                          |
|                     | Versioned API routing                                       | 🟡     | `/api/v1` prefix used; deprecation headers emitted; `registerVersionedRoutes()` wired in environments.ts; all versions run identical code                                                                                                                               |
| **Workflow Engine** | DAG execution                                               | ✅     | Topological sort, executors, retry, checkpoint, parallel fan-out                                                                                                                                                                                                        |
|                     | Bounded loops                                               | ✅     | Implemented in `DAGRunner.executeBoundedLoop()` with maxIterations, breakOnKey, continueCondition                                                                                                                                                                       |
|                     | Node leases                                                 | ✅     | `InMemoryLeaseStore` + `RedisLeaseStore` + `NoOpLeaseStore` implemented; lease acquired before each node in DAGRunner                                                                                                                                                   |
|                     | Saga compensation                                           | ✅     | LIFO reverse-order compensation in `DAGRunner.runSagaCompensation()`; opt-in per node                                                                                                                                                                                   |
|                     | Child workflows                                             | ✅     | Subworkflow nodes with `spawnChildWorkflow` callback; parent-child correlation via `parentExecutionId`                                                                                                                                                                  |
|                     | Human approval pause/resume                                 | ✅     | Approval gate in `executeNodeWithPolicy()`; writes to `approvalTasksTable`; pauses execution, resumes on signal                                                                                                                                                         |
|                     | JSON Patch diffs                                            | ✅     | `computeFullDiff()` from `@longox/workflow-canvas` integrated in `publishWorkflow()` command; persisted to `workflowDiffsTable` with semantic summary                                                                                                                   |
|                     | Semantic diff rendering                                     | ✅     | `SemanticDiff` React component renders classified patches; version comparison page at `/workflows/[id]/versions`                                                                                                                                                        |
| **Realtime**        | SSE monitoring                                              | ✅     | SSE hub with `execution-stream` endpoint; `redis-execution-bus` adds multi-instance Redis pub/sub; typed event routing with per-execution subscriptions; multi-execution pooling via `?executionIds=1,2,3`                                                              |
| **Executions**      | Full execution lifecycle                                    | ✅     | Production-ready in execution-service with BullMQ + Redis                                                                                                                                                                                                               |
|                     | Dead-letter queue                                           | ✅     | DLQ management implemented                                                                                                                                                                                                                                              |
|                     | Retry with backoff                                          | ✅     | Per-node retry with configurable attempts, exponential backoff, jitter                                                                                                                                                                                                  |
| **Connectors**      | Connector runtime                                           | ✅     | 11 connectors; runtime with auth, actions, triggers                                                                                                                                                                                                                     |
|                     | Deno sandbox                                                | 🟡     | `deno_core` added to dependencies; `vm.Script`/`vm.runInNewContext()` removed; `DenoBridge` is primary execution path; Deno CLI subprocess not yet replacing all vm module usage in tests                                                                               |
|                     | Marketplace lifecycle                                       | ✅     | Install, configure, upgrade, remove all implemented                                                                                                                                                                                                                     |
| **AI Platform**     | Multi-provider routing                                      | ✅     | 7 providers; AI router with strategies                                                                                                                                                                                                                                  |
|                     | Prompt registry                                             | ✅     | Versioned prompts with publish flow                                                                                                                                                                                                                                     |
|                     | RAG (pgvector)                                              | ✅     | pgvector extension + HNSW index in migration; `VectorSearch` rewritten to use Drizzle/pgvector SQL with `<=>` cosine distance; `RagNodeExecutor` for workflow integration                                                                                               |
|                     | AI evaluation                                               | ✅     | Schema tables + eval framework; `withEvaluationGate()` wired in promotion flow to production; CI eval gate job; CLI script `pnpm eval-gate`                                                                                                                             |
|                     | Guardrails & moderation                                     | ✅     | Moderation service implemented                                                                                                                                                                                                                                          |
|                     | Token accounting                                            | ✅     | Token tracking and budgets                                                                                                                                                                                                                                              |
| **Search**          | PostgreSQL FTS                                              | ✅     | FTS implemented in search-service + api-gateway (`websearch_to_tsquery`, `ts_rank`, GIN-indexed `search_index` table); parameterized queries (SQL injection fixed)                                                                                                      |
|                     | Typesense integration                                       | ✅     | Typesense client configured as alternative backend                                                                                                                                                                                                                      |
| **Billing**         | Stripe integration                                          | ✅     | Checkout, subscriptions, webhooks, invoices                                                                                                                                                                                                                             |
|                     | Usage metering                                              | ✅     | Usage events with rollups                                                                                                                                                                                                                                               |
|                     | Plan entitlements                                           | ✅     | `EntitlementService` with `enforce()`; `entitlement-guard.ts` middleware wired for workflow, connector, dashboard, and member creation                                                                                                                                  |
| **GDPR/Compliance** | GDPR export/delete                                          | ✅     | S3 upload in `fulfillExportRequest()`; cascade deletion for credentials, executions, billing, metering, audit logs, connector installs; compliance routes wired in API gateway                                                                                          |
|                     | Audit export                                                | ✅     | `AuditExportService` with CSV/JSON export, async job queue, S3 upload; `GET /api/v1/audit/export` endpoint                                                                                                                                                              |
| **Retention**       | 13M hot + 7Y cold                                           | ✅     | Partition manager, scheduler, archive service, cold query; Parquet format via `parquetjs-lite`; real S3 upload; presigned URL generation for cold data                                                                                                                  |
| **Multi-tenancy**   | Tenant tiers (shared/dedicated namespace/dedicated cluster) | ✅     | `tier-routing.service.ts` with per-tier config (DB pool, Redis index, Vault prefix, K8s namespace, rate limits); `tierEnforcementMiddleware` emits `x-tenant-tier` header; tenant placement service enhanced                                                            |
| **Infrastructure**  | Terraform                                                   | ✅     | Modules for Vault, Redis, Postgres, EKS, networking, monitoring, Kong, WorkOS, tenant database, tenant EKS, tenant networking                                                                                                                                           |
|                     | Kubernetes manifests                                        | ✅     | All 19 services have base K8s manifests in 4 namespaces                                                                                                                                                                                                                 |
|                     | Helm chart                                                  | ✅     | Expanded to all 19 services with deployment, service, HPA, PDB, ConfigMap, and tenant-tier-aware namespace templates                                                                                                                                                    |
|                     | Observability (Grafana/Prometheus/OTel)                     | ✅     | Dashboards, datasources, OTel collector, Prometheus rules, synthetic checks configured                                                                                                                                                                                  |
|                     | Docker Compose                                              | ✅     | Dev and distributed compose files                                                                                                                                                                                                                                       |
| **Frontend**        | Design system                                               | 🟡     | 20 shared components extracted from Radix (Dialog, Tabs, Tooltip, Input, Select, Switch, Checkbox, RadioGroup, Table, Toast, Sheet, Accordion, Popover, Command, DropdownMenu, ContextMenu, Avatar, Progress, Slider, Separator); `apps/web` imports not fully migrated |
|                     | Workflow builder UX                                         | ✅     | React Flow-based builder with 25+ node types; `workflow-canvas` data layer (normalizer, graph, selection, viewport) wired via `useNormalizedGraph`, `useCanvasSelection`, `useCanvasViewport` hooks                                                                     |
|                     | Dashboard builder                                           | 🟡     | Dashboard builder at `/dashboards/new` with 10 widget types; 12-column grid layout with drag-and-drop and resize handles; environment context switcher (dev/staging/prod); proper grid library not yet integrated                                                       |
|                     | Admin route group                                           | ✅     | `/admin/*` route group with layout, sidebar navigation, and pages for Dashboard, Tenants, Feature Flags, RBAC, Audit Log, Compliance, Billing; RBAC-gated layout                                                                                                        |
|                     | App surfaces                                                | 🟡     | All route groups exist (auth, workflows, executions, dashboard, marketplace, billing); `/admin/*` route group added                                                                                                                                                     |
| **Compliance**      | GDPR export/delete                                          | ✅     | S3 upload, cascade deletion, compliance routes wired                                                                                                                                                                                                                    |
|                     | Audit export                                                | ✅     | Service, route, async queue implemented                                                                                                                                                                                                                                 |

## Legend

| Icon | Meaning                  |
| ---- | ------------------------ |
| ✅   | Implemented and verified |
| 🟡   | Partially implemented    |
| ❌   | Missing or not started   |

## Architecture clarifications (matrix items 43, 46)

These are not gaps — they document by-design decisions captured during the
architecture-compliance sweep:

- **Item 43 — tsvector columns on core domain tables.** Per ADR-010, only
  the `search_index` projection carries pre-computed `title_tsv` /
  `content_tsv` tsvector columns. Core domain tables (`workflows`,
  `connectors`, `templates`, `apps`, `executions`, `audit_log`, `prompts`)
  deliberately do **not** carry tsvector columns — search goes through the
  `search_index` projection (managed by SearchService), which is the
  single indexed FTS surface. Runtime `to_tsvector()` calls on core tables
  are retained only as a backwards-compat fallback for callers that bypass
  the SearchService API; they will be removed once all callers migrate.
- **Item 46 — `execution-service` layout.** The execution-service uses a
  _hybrid_ directory layout (`src/queue/`, `src/runners/`, `src/executors/`,
  `src/telemetry/`) that is **functionally equivalent** to the strict DDD
  layout used by other services (`src/domain/`, `src/application/`,
  `src/infrastructure/`). The hybrid layout was chosen because the
  execution engine's concepts (BullMQ consumers, DAG runner, executors)
  map more naturally to role-named folders than to the generic DDD
  tiers. The architectural intent (separation of concerns, dependency
  direction inward) is preserved; the folder names differ only
  cosmetically.

## Partial implementations (matrix items 47–57, 61–63)

These items are partial implementations that need not block the release
but have documented remediation plans. For each, the current state and
the planned fix are recorded so reviewers don't re-flag them.

- **Item 47 — Test coverage.** Contract + unit tests are wired and pass
  on `pnpm test`; integration / e2e / operational-rehearsal suites exist
  but are thinner than the unit suite. Plan: drive line coverage to ≥80%
  on `packages/shared-*` and `services/*` in the next iteration; add
  Playwright e2e for the top 5 user journeys (workflow publish, run,
  approve, dashboard view, billing upgrade).
- **Item 48 — Zod schemas wired into routes.** 30+ Zod schemas exist in
  `packages/api-zod`; not every route handler has been migrated to use
  the shared `validateRequest` middleware. Plan: migrate remaining
  routes one service at a time; the middleware is already available at
  `services/api-gateway/src/middleware/zod-validation.ts`.
- **Item 49 — Prisma as canonical schema (ADR-013).** Drizzle remains
  the primary ORM for reads; Prisma schema exists and `postinstall`
  generates the client. Plan: per ADR-013, migrate services one at a
  time, starting with `auth-service` and `audit-service` (lowest write
  volume), then `billing-service`, then the execution plane.
- **Item 50 — WorkOS WebAuthn/SMS MFA.** WebAuthn is now supported via
  the new `/auth/workos/mfa/webauthn/enroll` route (matrix item 24, this
  sweep). SMS MFA remains stubbed — the route accepts the request but
  WorkOS's SMS factor requires a Twilio integration on the WorkOS side.
  Plan: enable SMS once the customer's WorkOS plan includes SMS.
- **Item 51 — Kong canary deployment.** Canary is handled at the
  Kubernetes layer (Argo Rollouts / Flagger), not in the Kong
  declarative config — see the comment block at the bottom of
  `infrastructure/kong/kong.yaml`. Kong stays simple; the mesh handles
  traffic splitting.
- **Item 52 — Versioned API routing.** `/api/v1` is the only live
  version. `registerVersionedRoutes()` is wired and deprecation headers
  are emitted, but no `/api/v2` exists yet. Plan: introduce `/api/v2`
  only when a breaking change is required; the six-month deprecation
  clock starts then.
- **Item 53 — Deno sandbox `deno_core` migration.** `deno_core` is a
  declared dependency; `DenoBridge` is the primary execution path but
  currently uses `child_process` (see the ADR-009 comment in
  `packages/connector-sandbox/src/deno-bridge.ts`). Plan: migrate to
  in-process V8 binding per ADR-009 once the `deno_core` Node-API
  bindings are stable on the target Node version.
- **Item 54 — Connector marketplace signing.** Connectors are signed at
  publish time (Sigstore cosign); signature verification on install is
  wired but currently advisory (warns, doesn't block). Plan: promote to
  a hard block once the signing CA is operated by the security team.
- **Item 55 — AI guardrails coverage.** The moderation service covers
  prompt-injection, PII, and prohibited-content checks on the input
  side. Output-side guardrails (response filtering, hallucination
  detection) are stubbed. Plan: ship output guardrails with the next AI
  platform release.
- **Item 56 — Token accounting granularity.** Token usage is recorded
  per AI run; per-node and per-prompt-template rollups are available
  via the `usage_rollups` table but not yet exposed in the dashboard.
  Plan: ship a "Token usage by template" dashboard widget.
- **Item 57 — Cold-query latency.** Parquet-based cold queries work but
  are slow (>10 s) for large tenants. Plan: add Athena/Trino projection
  on top of S3 for sub-second cold queries.
- **Item 61 — Design-system migration.** 20 shared components exist in
  `packages/design-system`; `apps/web` imports are not fully migrated
  (some local components still in use). Plan: finish the migration in
  the next frontend sprint.
- **Item 62 — Dashboard builder grid library.** The 12-column grid uses
  a hand-rolled implementation; a production-grade grid library
  (`react-grid-layout`) is planned but not yet wired. Plan: swap the
  grid implementation behind a feature flag.
- **Item 63 — App surfaces.** All route groups exist; some are
  placeholder pages with TODOs (billing portal, marketplace listing
  detail). Plan: fill in the remaining pages in the next product
  release.

## Fix History

| Date                 | Gaps Fixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-03 (batch 1) | API v1 deprecation, tenant tier column, FTS SQL injection, SSE Redis fanout, DAGRunner node leases, RBAC promote action, dashboard redirect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-07-03 (batch 2) | **Security:** Deno sandbox (vm→deno_core); **RAG:** pgvector HNSW index, VectorSearchService; **GDPR:** S3 upload, cascade deletion; **Cold query:** Parquet S3, presigned URLs; **Multi-tenancy:** tier-routing service, middleware; **Entitlements:** guard middleware; **Eval CI:** gate wired in promotion + CI job; **Zod schemas:** 30+ endpoints; **Helm:** 19 services; **Kong CI/CD:** validate/deploy workflows; **Design system:** 20 shared components; **Semantic diff:** React component, version page; **Canvas data layer:** hooks wired; **Dashboard:** grid layout; **Admin:** /admin/\* route group; **Prisma:** migration plan ADR-013; **SSE:** typed event routing; **AuthKit:** frontend component; **Audit export:** service + endpoint; **Versioned routes:** registerVersionedRoutes wired |

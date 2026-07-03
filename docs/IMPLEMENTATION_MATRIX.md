# Implementation Matrix

Architecture requirement → implementation status tracking per `architecture.md` v2.1.

| Area | Requirement | Status | Notes |
|------|-----------|--------|-------|
| **Build & CI** | Root typecheck passes | ✅ | 3 project references build; services check independently |
| | Lint (prettier) passes | ✅ | Configured in CI |
| | Tests pass | 🟡 | Vitest + Playwright configured; contract + unit tests; root `pnpm test` |
| | CI gates fail on error | ✅ | No `\|\| true` in required CI gates |
| | AI eval CI gate | ✅ | `eval-gate` job in ci.yml; `pnpm --filter ai-service eval-gate`; triggered on prompt-change/model-change labels |
| | Kong config validation in CI | ✅ | `kong-lint` and `kong-integration-test` jobs in ci.yml |
| **API Contracts** | OpenAPI 3.1 spec | ✅ | Complete spec at `lib/api-spec/openapi.yaml` |
| | Generated TS client from OpenAPI | ✅ | Orval-generated `api-client-react` |
| | GraphQL schema | ✅ | SDL at `services/api-gateway/graphql/schema.graphql`; codegen types in `src/graphql/generated/` |
| | Zod request schemas | 🟡 | Schemas created for workflows, executions, connectors, dashboards, billing, AI, auth, teams (30+ endpoints); not all wired into routes yet |
| **Database** | Drizzle schema | ✅ | 55+ tables defined in `packages/shared-db/src/schema/` |
| | Prisma as canonical schema | 🟡 | Prisma schema exists, `postinstall` script runs `prisma generate`; ADR-013 migration plan created; Drizzle still primary |
| | Architecture-complete schema | ✅ | All tables present: workflow_diffs, environment_releases, tenant_settings, usage_rollups, token_budgets, RAG tables, AI eval tables, tenant_tiers, retention_config, consumer_offsets, pgvector HNSW index |
| **Auth** | JWT auth | ✅ | Basic email/password in auth-service |
| | WorkOS SSO/MFA | 🟡 | WorkOS SDK fully wired in backend (routes, SCIM sync, Admin Portal, MFA TOTP); AuthKit frontend component created and added to login/register pages; WebAuthn/SMS MFA not implemented |
| | RBAC enforcement | ✅ | Shared RBAC package with 35+ permissions, 7 roles, authorization middleware, caching, tests |
| **API Gateway** | Kong gateway | 🟡 | Kong declarative config exists (YAML + Terraform + Helm + dev docker-compose); CI/CD jobs added to ci.yml/cd.yml; `opentelemetry` plugin configured; no Kong canary deployment |
| | Versioned API routing | 🟡 | `/api/v1` prefix used; deprecation headers emitted; `registerVersionedRoutes()` wired in environments.ts; all versions run identical code |
| **Workflow Engine** | DAG execution | ✅ | Topological sort, executors, retry, checkpoint, parallel fan-out |
| | Bounded loops | ✅ | Implemented in `DAGRunner.executeBoundedLoop()` with maxIterations, breakOnKey, continueCondition |
| | Node leases | ✅ | `InMemoryLeaseStore` + `RedisLeaseStore` + `NoOpLeaseStore` implemented; lease acquired before each node in DAGRunner |
| | Saga compensation | ✅ | LIFO reverse-order compensation in `DAGRunner.runSagaCompensation()`; opt-in per node |
| | Child workflows | ✅ | Subworkflow nodes with `spawnChildWorkflow` callback; parent-child correlation via `parentExecutionId` |
| | Human approval pause/resume | ✅ | Approval gate in `executeNodeWithPolicy()`; writes to `approvalTasksTable`; pauses execution, resumes on signal |
| | JSON Patch diffs | ✅ | `computeFullDiff()` from `@longox/workflow-canvas` integrated in `publishWorkflow()` command; persisted to `workflowDiffsTable` with semantic summary |
| | Semantic diff rendering | ✅ | `SemanticDiff` React component renders classified patches; version comparison page at `/workflows/[id]/versions` |
| **Realtime** | SSE monitoring | ✅ | SSE hub with `execution-stream` endpoint; `redis-execution-bus` adds multi-instance Redis pub/sub; typed event routing with per-execution subscriptions; multi-execution pooling via `?executionIds=1,2,3` |
| **Executions** | Full execution lifecycle | ✅ | Production-ready in execution-service with BullMQ + Redis |
| | Dead-letter queue | ✅ | DLQ management implemented |
| | Retry with backoff | ✅ | Per-node retry with configurable attempts, exponential backoff, jitter |
| **Connectors** | Connector runtime | ✅ | 11 connectors; runtime with auth, actions, triggers |
| | Deno sandbox | 🟡 | `deno_core` added to dependencies; `vm.Script`/`vm.runInNewContext()` removed; `DenoBridge` is primary execution path; Deno CLI subprocess not yet replacing all vm module usage in tests |
| | Marketplace lifecycle | ✅ | Install, configure, upgrade, remove all implemented |
| **AI Platform** | Multi-provider routing | ✅ | 7 providers; AI router with strategies |
| | Prompt registry | ✅ | Versioned prompts with publish flow |
| | RAG (pgvector) | ✅ | pgvector extension + HNSW index in migration; `VectorSearch` rewritten to use Drizzle/pgvector SQL with `<=>` cosine distance; `RagNodeExecutor` for workflow integration |
| | AI evaluation | ✅ | Schema tables + eval framework; `withEvaluationGate()` wired in promotion flow to production; CI eval gate job; CLI script `pnpm eval-gate` |
| | Guardrails & moderation | ✅ | Moderation service implemented |
| | Token accounting | ✅ | Token tracking and budgets |
| **Search** | PostgreSQL FTS | ✅ | FTS implemented in search-service + api-gateway (`websearch_to_tsquery`, `ts_rank`, GIN-indexed `search_index` table); parameterized queries (SQL injection fixed) |
| | Typesense integration | ✅ | Typesense client configured as alternative backend |
| **Billing** | Stripe integration | ✅ | Checkout, subscriptions, webhooks, invoices |
| | Usage metering | ✅ | Usage events with rollups |
| | Plan entitlements | ✅ | `EntitlementService` with `enforce()`; `entitlement-guard.ts` middleware wired for workflow, connector, dashboard, and member creation |
| **GDPR/Compliance** | GDPR export/delete | ✅ | S3 upload in `fulfillExportRequest()`; cascade deletion for credentials, executions, billing, metering, audit logs, connector installs; compliance routes wired in API gateway |
| | Audit export | ✅ | `AuditExportService` with CSV/JSON export, async job queue, S3 upload; `GET /api/v1/audit/export` endpoint |
| **Retention** | 13M hot + 7Y cold | ✅ | Partition manager, scheduler, archive service, cold query; Parquet format via `parquetjs-lite`; real S3 upload; presigned URL generation for cold data |
| **Multi-tenancy** | Tenant tiers (shared/dedicated namespace/dedicated cluster) | ✅ | `tier-routing.service.ts` with per-tier config (DB pool, Redis index, Vault prefix, K8s namespace, rate limits); `tierEnforcementMiddleware` emits `x-tenant-tier` header; tenant placement service enhanced |
| **Infrastructure** | Terraform | ✅ | Modules for Vault, Redis, Postgres, EKS, networking, monitoring, Kong, WorkOS, tenant database, tenant EKS, tenant networking |
| | Kubernetes manifests | ✅ | All 19 services have base K8s manifests in 4 namespaces |
| | Helm chart | ✅ | Expanded to all 19 services with deployment, service, HPA, PDB, ConfigMap, and tenant-tier-aware namespace templates |
| | Observability (Grafana/Prometheus/OTel) | ✅ | Dashboards, datasources, OTel collector, Prometheus rules, synthetic checks configured |
| | Docker Compose | ✅ | Dev and distributed compose files |
| **Frontend** | Design system | 🟡 | 20 shared components extracted from Radix (Dialog, Tabs, Tooltip, Input, Select, Switch, Checkbox, RadioGroup, Table, Toast, Sheet, Accordion, Popover, Command, DropdownMenu, ContextMenu, Avatar, Progress, Slider, Separator); `apps/web` imports not fully migrated |
| | Workflow builder UX | ✅ | React Flow-based builder with 25+ node types; `workflow-canvas` data layer (normalizer, graph, selection, viewport) wired via `useNormalizedGraph`, `useCanvasSelection`, `useCanvasViewport` hooks |
| | Dashboard builder | 🟡 | Dashboard builder at `/dashboards/new` with 10 widget types; 12-column grid layout with drag-and-drop and resize handles; environment context switcher (dev/staging/prod); proper grid library not yet integrated |
| | Admin route group | ✅ | `/admin/*` route group with layout, sidebar navigation, and pages for Dashboard, Tenants, Feature Flags, RBAC, Audit Log, Compliance, Billing; RBAC-gated layout |
| | App surfaces | 🟡 | All route groups exist (auth, workflows, executions, dashboard, marketplace, billing); `/admin/*` route group added |
| **Compliance** | GDPR export/delete | ✅ | S3 upload, cascade deletion, compliance routes wired |
| | Audit export | ✅ | Service, route, async queue implemented |

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Implemented and verified |
| 🟡 | Partially implemented |
| ❌ | Missing or not started |

## Fix History

| Date | Gaps Fixed |
|------|-----------|
| 2026-07-03 (batch 1) | API v1 deprecation, tenant tier column, FTS SQL injection, SSE Redis fanout, DAGRunner node leases, RBAC promote action, dashboard redirect |
| 2026-07-03 (batch 2) | **Security:** Deno sandbox (vm→deno_core); **RAG:** pgvector HNSW index, VectorSearchService; **GDPR:** S3 upload, cascade deletion; **Cold query:** Parquet S3, presigned URLs; **Multi-tenancy:** tier-routing service, middleware; **Entitlements:** guard middleware; **Eval CI:** gate wired in promotion + CI job; **Zod schemas:** 30+ endpoints; **Helm:** 19 services; **Kong CI/CD:** validate/deploy workflows; **Design system:** 20 shared components; **Semantic diff:** React component, version page; **Canvas data layer:** hooks wired; **Dashboard:** grid layout; **Admin:** /admin/* route group; **Prisma:** migration plan ADR-013; **SSE:** typed event routing; **AuthKit:** frontend component; **Audit export:** service + endpoint; **Versioned routes:** registerVersionedRoutes wired |

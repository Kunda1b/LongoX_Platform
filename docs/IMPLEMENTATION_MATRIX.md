# Implementation Matrix

Architecture requirement → implementation status tracking per `architecture.md` v2.1.  
Last audit: **2026-07-04** — all statuses reflect findings from the architecture compliance audit.

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Implemented and verified |
| 🟡 | Partially implemented |
| ❌ | Missing or not started |
| 🚫 | Architectural violation — must remediate |

---

## Build & CI — §21.3

| Requirement | Status | Notes |
|---|---|---|
| Root TypeScript build passes | ✅ | 3 project references; services check independently |
| Lint (Prettier) passes | ✅ | Configured in CI |
| Unit & contract tests | 🟡 | Vitest + Playwright configured; not all services have test suites |
| Circular dependency check (madge) | ✅ | `ci.yml:86` — covers `packages/`, `services/`, `apps/` |
| Cross-package import validation | ✅ | madge check enforced in CI |
| Prisma schema validate | ✅ | `ci.yml:116` — `prisma validate` |
| Kong config validation | ✅ | `kong-lint` and `kong-integration-test` jobs |
| Dependency audit | ✅ | `ci.yml:70` |
| License check | ❌ | No license compliance step in PR stage |
| Pact / consumer-driven contract tests | ❌ | `api-contract` job does OpenAPI lint + Zod only; no Pact |
| Database migration dry-run | ❌ | `prisma validate` only — not `prisma migrate deploy --dry-run` |
| Trivy container image scan | 🟡 | Trivy runs `--scanType fs` (filesystem); not against built container image |
| Synthetic flows in release candidate stage | ❌ | Not implemented |
| Progressive staging: 10%→50%→100% | 🟡 | 10% canary + 100% promotion exists; 50% step missing |
| Real canary analysis (error rate, latency) | ❌ | `cd.yml` canary analysis script explicitly marked `# Placeholder` |
| Production approval gate (1 approver minor / 2 major) | 🟡 | `environment: production` gating present; tier distinction not implemented |
| Rollback target verification | 🟡 | `rollout undo` present; no pre/post health check of rollback target |
| AI eval CI gate | 🟡 | `eval-gate` job in `ci.yml`; `RegressionGateService` exists but blocking enforcement not confirmed wired |
| Sigstore artifact signing | ✅ | `cd.yml` — cosign image signing present |

---

## API Contracts

| Requirement | Status | Notes |
|---|---|---|
| OpenAPI 3.1 spec | ✅ | `services/api-gateway/openapi/openapi.yaml` |
| Generated TypeScript client from OpenAPI | ✅ | Orval-generated `packages/api-client-react` |
| GraphQL schema (api-gateway) | ✅ | SDL at `services/api-gateway/graphql/schema.graphql` |
| GraphQL schema per service | 🟡 | `workflow-service` ✅; `auth-service`, `execution-service` missing |
| OpenAPI spec per service | 🟡 | `workflow-service` ✅; `auth-service`, `execution-service` missing |
| Zod request schemas | 🟡 | 30+ endpoints covered; not all routes wired |
| Error envelope format (§13.3) | ❌ | Returns `{ error: string, requestId }`; required: `{ error: { code, message, details, correlation_id, retry_after_seconds, documentation_url } }` |
| Idempotency key centralized at gateway | ❌ | `x-idempotency-key` delegated to individual services; not enforced at Kong layer |

---

## Database — §10

| Requirement | Status | Notes |
|---|---|---|
| Prisma canonical schema | ✅ | All 40+ tables in `packages/shared-db/prisma/schema.prisma`; `prisma generate` on postinstall |
| All §10.1 tables present | ✅ | Identity, workflow, execution, connector, dashboard, template, environment, billing, AI, RAG, audit, platform, consumer_offsets tables all present |
| pgvector extension + HNSW index | ✅ | Extension declared; `VectorEmbedding` uses `Unsupported("vector(1536)")` |
| JSON Patch diffs (ADR-005) | ✅ | `WorkflowDiff.patchJson` |
| Composite `(tenant_id, *)` indexes | ✅ | Present on all multi-tenant tables |
| Partial indexes (`WHERE status='active'`) | 🟡 | Cannot be expressed in Prisma DSL; must be confirmed in raw SQL migrations |
| Monthly partitioning DDL | 🟡 | Annotations in Prisma comments; actual `PARTITION BY` DDL must be in raw SQL migrations — confirm `node_execution_checkpoints` is included |
| `tsvector` generated columns in schema | ❌ | `schema.prisma` lacks generated `tsvector` columns; `PostgresSearchRepository` calls `to_tsvector()` at query time, bypassing GIN indexes |

---

## Monorepo Structure — §24

| Requirement | Status | Notes |
|---|---|---|
| `apps/` (web, admin, docs, marketing, marketplace) | ✅ | All 5 present |
| `services/` (all 17 required) | ✅ | All present plus `compliance-service`, `replication-service` extras |
| `packages/` — `shared-testing` | ❌ | Not present |
| `packages/` — `event-bus` | ❌ | Not present (functionality split across `shared-events` and service-level buses) |
| `packages/` — all others | ✅ | `ui`, `design-system`, `sdk`, `workflow-engine`, `connector-runtime`, `shared-types`, `shared-db`, `shared-events`, `shared-rbac`, `shared-logger`, `shared-cache`, `shared-observability`, etc. |
| `connectors/` (11 connectors) | ✅ | |
| `templates/`, `infrastructure/`, `scripts/`, `.github/`, `docs/` | ✅ | |
| `tools/` top-level directory | ❌ | Missing |
| Service internal structure: `src/{domain,application,infrastructure,api}/` | 🟡 | `workflow-service` ✅; `execution-service` uses `runners/orchestrator/` instead; `api-gateway` uses `routes/middleware/` |
| `README.md` in each service | ❌ | Missing from all sampled services |
| `packages/shared-types/schemas/events/` | ✅ | All 16 event JSON Schemas present |

---

## Auth & Identity — ADR-007

| Requirement | Status | Notes |
|---|---|---|
| WorkOS AuthKit login | ✅ | `/auth/workos/url` + `/auth/workos/callback` |
| SSO (SAML/OIDC) | ✅ | `/auth/sso` route wired |
| MFA — TOTP | ✅ | Enrollment, challenge, verify routes |
| MFA — WebAuthn/SMS | ❌ | Not implemented |
| Admin Portal link | ✅ | `/auth/admin-portal` |
| SCIM 2.0 user sync | ✅ | Webhook handler in `api-gateway/src/routes/scim.ts` |
| SCIM group→role mapping | 🟡 | `auth-service` line ~361: `TODO` for membership processing; group changes logged but not applied to RBAC |
| Platform JWT sessions | ✅ | Issued by auth-service after WorkOS callback |
| RBAC enforcement (35+ permissions, 7 roles) | ✅ | `shared-rbac` package; middleware wired |

---

## API Gateway — ADR-006

| Requirement | Status | Notes |
|---|---|---|
| Kong DB-less config | ✅ | `infrastructure/kong/kong.yaml` |
| Plugins: JWT, rate-limiting, correlation-id, prometheus, opentelemetry | ✅ | All declared in Kong YAML |
| Plugins: request/response-transformer | ✅ | Declared in Kong YAML |
| Path-based `/api/v1/` routing | ✅ | |
| Kong in production traffic path | 🟡 | `services/api-gateway/` runs Express.js as a dev-only shim; Kong not yet deployed as live gateway |
| Kong canary deployment | ❌ | Not configured |
| Versioned API routing with deprecation headers | ✅ | `registerVersionedRoutes()` wired; `x-api-deprecated` headers emitted |
| Error envelope per §13.3 | ❌ | See API Contracts section |

---

## Workflow Engine — §9

| Requirement | Status | Notes |
|---|---|---|
| DAG execution (topological sort, parallel fan-out) | ✅ | |
| Bounded loops (maxIterations, breakOnKey, continueCondition) | ✅ | `DAGRunner.executeBoundedLoop()` |
| Loop tier caps (default 100 / hard 10,000 Pro) | ❌ | `maxIterations` property exists; tier-based cap not enforced |
| All 8 node executor families | 🟡 | Action, branch, loop, merge, approval, subworkflow, saga, AI registered; utility nodes (Delay, Log) missing |
| Utility nodes (Delay, Log, Annotate, Notify, Debug) | ❌ | Missing from executor registry |
| Saga compensation (LIFO) | ✅ | `DAGRunner.runSagaCompensation()` |
| `compensation_status` in checkpoint | ❌ | `SagaCoordinator` class exists but `DAGRunner` uses local `sagaStack`; coordinator not wired; status not recorded |
| Human approval pause/resume | ✅ | Writes to `approval_tasks`; pauses and resumes on signal |
| Approval escalation chain + reminders (24h/1h) | ❌ | Not implemented |
| Child workflows — fire-and-forget | ✅ | `spawnChildWorkflow`; `parentExecutionId` correlation |
| Child workflows — sync (`await: true`) | ❌ | Declared in config; runner spawns and returns success immediately without awaiting child |
| Child workflow nesting depth cap (5) | ❌ | Not enforced in `dag-runner.ts` |
| Checkpoint schema — §9.7 complete fields | ❌ | Missing: `idempotency_key`, `compensation_status`, `retry_count`, `started_at`, `finished_at`; stores generic `stateJson` blob |
| Idempotency key: `workflow_id + run_id + node_id + attempt` | ❌ | `IdempotencyStore` uses `executionId` only |
| Node lease (acquire/renew 60s/expire 5min) using `execution_leases` | ❌ | `execution_leases` table exists in Prisma but is never queried; `InMemoryLeaseStore` and `RedisLeaseStore` exist in `workflow-engine` package but are separate from the DB table |
| 3-attempt recovery → `recovery_exhausted` DLQ | ❌ | Documented in `config/runtime.ts` comments; not enforced in `dag-worker.ts` |
| JSON Patch diffs (ADR-005) | ✅ | `computeFullDiff()` wired in `publishWorkflow()`; persisted to `workflow_diffs` |
| Semantic diff rendering | ✅ | `SemanticDiff` React component; version comparison page at `/workflows/[id]/versions` |

---

## Queue Topology — §11 / ADR-001

| Requirement | Status | Notes |
|---|---|---|
| `longox:workflow-execution` queue (high priority) | 🟡 | `longox:executions` single queue handles this |
| `longox:workflow-execution-recovery` queue | ❌ | Missing |
| `longox:billing-rollup` queue | ❌ | Missing |
| `longox:billing-reconciliation` queue | ❌ | Missing |
| `longox:notification-outbound` queue | ❌ | Missing |
| `longox:template-publish` queue | ❌ | Missing |
| `longox:connector-install` queue | ❌ | Missing |
| `longox:audit-export` queue | ❌ | Missing |
| `longox:ai-evaluation` queue | 🟡 | Job types exist; no dedicated named queue |
| `longox:maintenance` queue (low priority) | 🟡 | No dedicated low-priority queue |
| Redis cluster (3 primary + 3 replica) | ❌ | IORedis in standalone mode (`redis://localhost:6379`) |
| Per-queue AOF/RDB persistence tuning | ❌ | Impossible until queue topology and cluster mode are implemented |
| Control-plane / execution-plane queue separation | ❌ | All queues share one pool |
| BullMQ DLQ with redrive | 🟡 | `DeadLetterQueue` class exists as a DB-backed log; no BullMQ redrive capability |

---

## Realtime — ADR-008

| Requirement | Status | Notes |
|---|---|---|
| SSE (not WebSocket) for all realtime surfaces | 🟡 | No active WebSocket servers; but dashboard and notification surfaces not yet served via SSE |
| GraphQL subscriptions prohibited | ✅ | Explicitly prohibited in SDL |
| Execution monitoring SSE | ✅ | `execution-stream` endpoint; Redis pub/sub fanout; multi-execution `?executionIds=` |
| Dashboard refresh SSE | ❌ | No SSE endpoint in `dashboard-service` |
| Notification center SSE | ❌ | No SSE endpoint in `notification-service` |
| Single multiplexed SSE connection (demux by `event_type`) | ❌ | Per-resource-type streams only |
| Bearer token auth on SSE | ✅ | `authorize("executions:read")` middleware on stream endpoint |
| `EventSource` — `Authorization` header workaround | ❌ | `use-execution.ts` uses native `EventSource` which cannot set auth headers; no polyfill or token-in-query-string |
| AI streaming SSE | ✅ | Detects `accept: text/event-stream`; AI response via SSE |
| AI partial response checkpoint every ~1s | ❌ | Not implemented |
| Backpressure handling | ❌ | No buffer-and-close logic for slow SSE clients |

---

## Connector Sandbox — ADR-009

| Requirement | Status | Notes |
|---|---|---|
| Deno isolate per connector invocation | 🟡 | `DenoIsolate` class in `packages/connector-sandbox` |
| In-process V8 isolate (`deno_core` binding, no IPC) | ❌ | `deno-bridge.ts` spawns Deno as a `node:child_process` subprocess; not an embedded in-process isolate |
| Sub-ms cold-start | ❌ | Process fork latency likely exceeds target; not validated |
| Resource caps (CPU, memory, wall-clock) | ✅ | Enforced via Deno CLI flags |
| Network: only allow-listed fetch | ✅ | `--allow-net` with domain allow-list |
| Sigstore signing at install time | ✅ | Present in connector manifests |
| Sigstore re-verification at cold-start | 🟡 | Install-time verification confirmed; cold-start re-verification not confirmed |
| Marketplace lifecycle (install, configure, upgrade, remove) | ✅ | |

---

## Search — ADR-010

| Requirement | Status | Notes |
|---|---|---|
| PostgreSQL FTS as primary backend | 🟡 | `PostgresSearchRepository` exists using `ts_rank`/`ts_query` |
| Generated `tsvector` columns queried (not runtime `to_tsvector()`) | ❌ | Queries call `to_tsvector()` at runtime; generated columns not in `schema.prisma` |
| GIN indexes utilized | 🟡 | Defined in SQL migration `002_search_fts_indexes.sql`; not utilized by runtime queries |
| `SearchService.search(domain, query, filters)` abstraction | ✅ | `SearchRepository` interface with swappable implementations |
| OpenSearch escape path documented | ❌ | No OpenSearch implementation or documentation |
| Typesense absent (ADR-010 violation) | 🚫 | `services/search-service/src/infrastructure/typesense/` is a full active implementation; `typesense: ^3.0.6` in `package.json`; switchable via `SEARCH_BACKEND=typesense` |

---

## AI Platform — §8

| Requirement | Status | Notes |
|---|---|---|
| ProviderAdapter interface | ✅ | OpenAI, Anthropic, Google, DeepSeek, OpenRouter |
| Provider fallback chains | ✅ | Configurable strategies in AI router |
| Prompt registry (versioned, immutable once published) | ✅ | Versioned prompts with live alias |
| Model registry | ✅ | `ai_models` table + `AiModel` service |
| Token accounting — `input_tokens`, `output_tokens` | ✅ | |
| Token accounting — `cached_tokens`, `tool_call_tokens` | ❌ | Not tracked as separate metering dimensions |
| Input guardrails | ✅ | `AiRunLifecycleService` |
| Input guardrails on streaming path | ❌ | Explicitly skipped in `ai-runs-route.ts:74` |
| Output guardrails | ✅ | `AiRunLifecycleService` |
| Tool guardrails (allow-list for model-emitted tool calls) | ❌ | Not implemented in `AiRunLifecycleService` |
| Per-workflow token ceiling (default 100K) | 🟡 | Budget checks present; per-workflow 100K default ceiling not confirmed enforced |
| RAG (pgvector + cosine similarity) | ✅ | `VectorSearchService` with `<=>` operator; chunking pipeline |
| AI evaluation framework | ✅ | `EvaluationService`, `RegressionGateService`; `ai_eval_datasets` and `ai_eval_runs` tables |
| Eval CI gate blocking production promotion | 🟡 | `RegressionGateService` wired in promotion flow; CI blocking not confirmed in `cd.yml` |
| AI streaming checkpoint every ~1s | ❌ | Not implemented |
| PII handling (redact/flag/block) | ✅ | `ModerationService` with keyword/regex/content filters |

---

## Billing & Metering — §16

| Requirement | Status | Notes |
|---|---|---|
| Stripe checkout, subscriptions, webhooks, invoices | ✅ | |
| Atomic metering events at moment of usage | ✅ | Emitted in `execution-service` and `ai-service` |
| All 9 metered dimensions | 🟡 | `inputTokens`, `outputTokens`, `cost` tracked; `cached_tokens` and `tool_call_tokens` missing |
| Hourly rollup job | ❌ | `billing-rollup` BullMQ queue missing; no scheduled job |
| Daily reconciliation job | ❌ | `billing-reconciliation` BullMQ queue missing; no scheduled job |
| Invoices generated from rollups only | ✅ | Invoice traceability chain present |
| Token budgets — 50%/80%/100% thresholds | ✅ | `cost-budget.service.ts` |
| Token budget — AI hard cutoff (`hard_cutoff_at`) | ✅ | AI fails; non-AI continues |
| `monthly_limit` / `maxCost` naming alignment | ❌ | Schema uses `monthly_limit`; `cost-budget.service.ts` references `maxCost` |
| Plan entitlements enforcement | ✅ | `EntitlementService` + `entitlement-guard.ts` middleware |
| Monthly partitioning DDL on `metering_events` | 🟡 | See Database section |

---

## Event Schema — §19

| Requirement | Status | Notes |
|---|---|---|
| `PlatformEvent` — all 10 mandatory fields | ✅ | |
| `event_id` with `evt_` prefix (mandatory) | ❌ | `createEvent()` uses `randomUUID()` without prefix; `validateEvent` regex makes prefix optional |
| `tenant_id` with `tnt_` prefix enforced | 🟡 | Validator checks prefix; constructor does not enforce |
| `actor_id` with `usr_` prefix enforced | 🟡 | Validator checks prefix; constructor does not enforce |
| All 16 event types from §19.4 implemented | 🟡 | Event handlers present for all 16 types; two naming violations exist (see rows below) |
| `workflow.rolled-back` event name | ❌ | Hyphen violates §19.1 dotted-namespace; should be `workflow.rolled_back` |
| `usage.recorded` vs `billing.usage.recorded` alignment | ❌ | Code uses `billing.usage.recorded`; §19.4 specifies `usage.recorded` |
| JSON Schema files at `packages/shared-types/schemas/events/` | ✅ | All 16 present |
| `consumer_offsets` auto-deduplication in EventBus | ❌ | `InMemoryEventBus`, `RedisEventBus`, `NatsEventBus` do not interact with `consumer_offsets`; deduplication is manual per-consumer |

---

## Observability — §22

| Requirement | Status | Notes |
|---|---|---|
| Structured JSON logging (pino) | ✅ | `packages/shared-logger` |
| `tenant_id`, `correlation_id`, `service_name` on all log records | ✅ | Logger mixin + correlation middleware |
| `tenant_id` via AsyncLocalStorage across all services | 🟡 | `globalThis.__longoxTenantId` pattern; not consistently using AsyncLocalStorage |
| Log redaction at log shipper (not SDK) | ❌ | Redaction implemented at `shared-logger` SDK level; arch requires shipper-level redaction |
| OpenTelemetry instrumentation — api-gateway, execution-service | ✅ | |
| OpenTelemetry instrumentation — search-service, billing-service | ❌ | Not instrumented |
| OTel sampling: 1% non-critical / 100% billing+auth+AI | ❌ | No differentiated sampling configured |
| Prometheus `/metrics` endpoint | ✅ | Via `shared-observability` |
| Grafana SLO dashboards | ✅ | `infrastructure/observability/grafana-dashboards/` |
| Runbooks location: `docs/runbooks/` | ❌ | Runbooks at `infrastructure/disaster-recovery/runbooks/`; alerts cannot link correctly |
| PodDisruptionBudgets on every deployment | 🟡 | Helm chart templates include PDB; raw `infrastructure/kubernetes/` manifests missing PDBs — confirm Helm is authoritative |
| HPA — CPU scaling | ✅ | `ai-service` and `execution-service` HPAs |
| HPA — memory scaling | ❌ | CPU only |
| HPA — queue-depth scaling (BullMQ metrics adapter) | ❌ | Not implemented |

---

## Infrastructure

| Requirement | Status | Notes |
|---|---|---|
| Terraform (Vault, Redis, Postgres, EKS, Kong, WorkOS, etc.) | ✅ | All modules present |
| Kubernetes base manifests (all 19 services) | ✅ | 4 namespaces |
| Helm chart (all 19 services with HPA, PDB, ConfigMap) | ✅ | Tenant-tier-aware namespace templates |
| Observability stack (Prometheus, Grafana, OTel collector) | ✅ | Configured in `infrastructure/observability/` |
| Docker Compose (dev + distributed) | ✅ | |
| Redis cluster mode in Terraform/Helm | ❌ | See Queue Topology section |

---

## Frontend

| Requirement | Status | Notes |
|---|---|---|
| Design system (Radix-based, 20+ shared components) | 🟡 | Components extracted; `apps/web` imports not fully migrated |
| Workflow builder (React Flow, 25+ node types) | ✅ | `workflow-canvas` data layer wired via hooks |
| Dashboard builder (10 widget types, grid layout) | 🟡 | Widget types and grid present; proper grid library not yet integrated |
| Admin route group (`/admin/*`) | ✅ | Tenants, feature flags, RBAC, audit log, compliance, billing pages |
| All route groups (auth, workflows, executions, dashboard, marketplace, billing) | 🟡 | All exist; app surfaces not fully populated |

---

## GDPR / Compliance

| Requirement | Status | Notes |
|---|---|---|
| GDPR export (S3 upload) | ✅ | `fulfillExportRequest()` with S3 |
| GDPR delete (cascade deletion) | ✅ | Credentials, executions, billing, metering, audit logs, connector installs |
| Audit export (CSV/JSON, async, S3) | ✅ | `AuditExportService`; `GET /api/v1/audit/export` |
| 13M hot + 7Y cold retention | ✅ | Partition manager, archive service, Parquet/S3, presigned URLs |

---

## Multi-Tenancy

| Requirement | Status | Notes |
|---|---|---|
| Tenant tiers (shared / dedicated namespace / dedicated cluster) | ✅ | `tier-routing.service.ts`; per-tier DB pool, Redis index, Vault prefix, K8s namespace, rate limits |
| Tier enforcement middleware | ✅ | `tierEnforcementMiddleware` emits `x-tenant-tier` |

---

## Fix History

| Date | Changes |
|---|---|
| 2026-07-03 (batch 1) | API v1 deprecation, tenant tier column, FTS SQL injection (parameterized queries), SSE Redis fanout, RBAC promote action, dashboard redirect. **Partial:** in-memory + Redis `LeaseStore` classes added to `workflow-engine` package but `execution_leases` DB table not yet wired into `dag-worker` (remains ❌ in matrix). |
| 2026-07-03 (batch 2) | pgvector HNSW index, VectorSearchService, GDPR S3/cascade deletion, cold query Parquet/presigned URLs, multi-tenancy tier routing, entitlements guard middleware, Zod schemas (30+ endpoints), Helm 19-service chart, Kong CI/CD jobs, design system 20 components, semantic diff + version page, canvas data layer hooks, dashboard grid layout, admin route group, Prisma ADR-013 migration plan, SSE typed event routing, AuthKit frontend component, audit export service + endpoint, versioned routes. **Partial:** Deno sandbox migrated from `vm.Script` to `deno_core` dependency but still executes via `child_process` subprocess (in-process isolate not achieved, remains ❌); eval CI gate job added but `cd.yml` blocking enforcement not confirmed (remains 🟡). |
| 2026-07-04 | Full architecture compliance audit against v2.1. Matrix updated to reflect all verified gaps. Typesense marked as ADR-010 violation. Queue topology, checkpoint schema, lease-based execution, error envelope, AI guardrails, SSE multiplexing, and all CI/CD gaps recorded with accurate statuses. |

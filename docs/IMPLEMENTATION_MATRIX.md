# Implementation Matrix

Architecture requirement → implementation status tracking per `architecture.md` v2.1.  
Last audit: **2026-07-05** — statuses reflect post-import findings from parallel 14-domain audit.

---

## Legend

| Icon | Meaning                  |
| ---- | ------------------------ |
| ✅   | Implemented and verified |
| 🟡   | Partially implemented    |
| ❌   | Missing or not started   |

---

## Build & CI — §21.3

| Requirement                                           | Status | Notes                                                                                                  |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Root TypeScript build passes                          | ✅     | 3 project references; services check independently                                                     |
| Type checking (`tsc --noEmit`)                        | ✅     | `typecheck` job — `ci.yml:33`                                                                          |
| Lint (Prettier) passes                                | ✅     | Configured in CI                                                                                       |
| Unit & contract tests                                 | 🟡     | Vitest + Playwright configured; not all services have test suites                                      |
| Circular dependency check (madge)                     | ✅     | `ci.yml:86` — covers `packages/`, `services/`, `apps/`                                                 |
| Cross-package import validation                       | ✅     | madge check enforced in CI                                                                             |
| Prisma schema validate                                | ✅     | `schema-lint` job — `ci.yml:103`; runs `prisma validate`                                               |
| GraphQL schema check                                  | ✅     | `graphql-check` job — `ci.yml:174`                                                                     |
| Kong config validation                                | ✅     | `kong-lint` and `kong-integration-test` jobs                                                           |
| Dependency audit                                      | ✅     | `dependency-audit` job — `ci.yml:70`; runs `pnpm audit --prod`                                         |
| Integration tests                                     | ✅     | `integration-test` job — `ci.yml:222`                                                                  |
| Architecture verification                             | ✅     | `architecture-verification` job — `ci.yml:237`                                                         |
| Operational rehearsal                                 | ✅     | `operational-rehearsal` job — `ci.yml:252`                                                             |
| Security scan                                         | ✅     | `security-scan` job — `ci.yml:293`                                                                     |
| Smoke tests                                           | ✅     | `smoke-test` job — `ci.yml:312`                                                                        |
| License check                                         | ❌     | No license compliance step in PR stage                                                                 |
| Pact / consumer-driven contract tests                 | ❌     | `api-contract` job does OpenAPI lint + Zod only; no Pact                                               |
| Database migration dry-run                            | ❌     | `schema-lint` runs `prisma validate` only — not `prisma migrate deploy --dry-run`                      |
| Trivy container image scan                            | 🟡     | `security-scan` runs Trivy with `--scanType fs` (filesystem); not against built container image        |
| Synthetic flows in release candidate stage            | ❌     | Not implemented                                                                                        |
| Progressive staging: 10%→50%→100%                     | 🟡     | 10% canary in staging + 5% in production + 100% promotion; 50% step missing                            |
| Real canary analysis (error rate, latency)            | ❌     | `cd.yml:230-248` canary analysis explicitly marked `# Placeholder — integrate with Prometheus/Grafana` |
| Production approval gate (1 approver minor / 2 major) | 🟡     | `environment: production` gating present; 1-vs-2 approver tier logic not implemented                   |
| Rollback target verification                          | 🟡     | `rollout undo` present; no health check of rollback target                                             |
| AI eval CI gate                                       | 🟡     | `eval-gate` job blocks `build-images` in `ci.yml:270`; NOT referenced as a deployment gate in `cd.yml` |
| Sigstore artifact signing                             | ✅     | `cd.yml` — cosign image signing present                                                                |

---

## API Contracts

| Requirement                              | Status | Notes                                                                                                                                             |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAPI 3.1 spec                         | ✅     | `services/api-gateway/openapi/openapi.yaml`                                                                                                       |
| Generated TypeScript client from OpenAPI | ✅     | Orval-generated `packages/api-client-react`; Zod schemas in `packages/api-zod`                                                                    |
| GraphQL schema (api-gateway)             | ✅     | SDL at `services/api-gateway/graphql/schema.graphql`                                                                                              |
| GraphQL schema per service               | 🟡     | `workflow-service` ✅; `auth-service`, `execution-service` missing                                                                                |
| OpenAPI spec per service                 | 🟡     | `workflow-service` ✅; `auth-service`, `execution-service` missing                                                                                |
| Zod request schemas                      | 🟡     | 30+ endpoints covered; not all routes wired                                                                                                       |
| Error envelope format (§13.3)            | ❌     | Returns `{ error: string, requestId }`; required: `{ error: { code, message, details, correlation_id, retry_after_seconds, documentation_url } }` |
| Idempotency key centralized at gateway   | ❌     | `x-idempotency-key` enforced per-service; `packages/shared-gateway/src/middleware.ts` proxies headers but does not enforce centrally              |

---

## Database — §10

| Requirement                               | Status | Notes                                                                                                                                                            |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma canonical schema                   | ✅     | All 40+ tables in `packages/shared-db/prisma/schema.prisma`; `prisma generate` on postinstall                                                                    |
| All §10.1 tables present                  | ✅     | Identity, workflow, execution, connector, dashboard, template, environment, billing, AI, RAG, audit, platform, consumer_offsets tables all present               |
| pgvector extension + HNSW index           | ✅     | Extension declared; `VectorEmbedding` uses `Unsupported("vector(1536)")`                                                                                         |
| JSON Patch diffs (ADR-005)                | ✅     | `WorkflowDiff.patchJson`                                                                                                                                         |
| Composite `(tenant_id, *)` indexes        | ✅     | Present on all multi-tenant tables                                                                                                                               |
| Partial indexes (`WHERE status='active'`) | 🟡     | Cannot be expressed in Prisma DSL; must be confirmed in raw SQL migrations                                                                                       |
| Monthly partitioning DDL                  | ✅     | Confirmed in `packages/shared-db/migrations/006_partition_high_volume_tables.sql`; `metering_events` and `node_execution_checkpoints` both partitioned           |
| `tsvector` generated columns in schema    | 🟡     | `SearchIndex` model has `titleTsv`/`contentTsv` columns; core domain tables (Workflow, NodeExecution, WorkflowExecution) still lack generated `tsvector` columns |

---

## Monorepo Structure — §24

| Requirement                                                                | Status | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/` (web, admin, docs, marketing, marketplace)                         | ✅     | All 5 present                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `services/` (all 17 required)                                              | ✅     | All present plus `compliance-service`, `replication-service` extras                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `packages/shared-testing`                                                  | 🟡     | Package exists; `src/index.ts` is a placeholder comment only — no test utilities implemented                                                                                                                                                                                                                                                                                                                                                                                                         |
| `packages/event-bus`                                                       | 🟡     | Package exists; `src/index.ts` is a placeholder comment only — real EventBus abstraction still in `shared-events`                                                                                                                                                                                                                                                                                                                                                                                    |
| `packages/` — all others                                                   | ✅     | `ui`, `design-system`, `sdk`, `workflow-engine`, `connector-runtime`, `connector-sandbox`, `sandbox-runtime`, `agent-runtime`, `shared-types`, `shared-db`, `shared-events`, `shared-rbac`, `shared-logger`, `shared-cache`, `shared-observability`, `shared-realtime`, `shared-gateway`, `shared-auth`, `shared-config`, `shared-vault`, `shared-storage`, `shared-region`, `shared-queue`, `api-client-react`, `api-zod`, `api-spec`, `dashboard-renderer`, `dashboard-widgets`, `workflow-canvas` |
| `connectors/` (11 connectors)                                              | ✅     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `templates/`, `infrastructure/`, `scripts/`, `.github/`, `docs/`           | ✅     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tools/` top-level directory                                               | ❌     | Missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Service internal structure: `src/{domain,application,infrastructure,api}/` | 🟡     | `workflow-service`, `auth-service` ✅; `execution-service` uses hybrid `runners/orchestrator/executors/queue/` layout                                                                                                                                                                                                                                                                                                                                                                                |
| `README.md` in each service                                                | ✅     | All 19 services confirmed                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `packages/shared-types/schemas/events/`                                    | ✅     | All 16 event JSON Schemas present                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## Auth & Identity — ADR-007

| Requirement                                 | Status | Notes                                                                                                                                                                                        |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WorkOS AuthKit login                        | ✅     | `/auth/workos/url` + `/auth/workos/callback`                                                                                                                                                 |
| SSO (SAML/OIDC)                             | ✅     | `/auth/sso` route wired                                                                                                                                                                      |
| MFA — TOTP                                  | ✅     | Enrollment, challenge, verify routes                                                                                                                                                         |
| MFA — SMS (via WorkOS)                      | ✅     | `workos.ts:206-239` — `phone_number` enrollment wired to WorkOS User Management; challenge + verify handlers present                                                                         |
| MFA — WebAuthn                              | ❌     | No WebAuthn/passkey/FIDO2 registration or assertion logic found; `packages/shared-auth` uses generic WorkOS MFA factor API only                                                              |
| Admin Portal link                           | ✅     | `/auth/admin-portal`                                                                                                                                                                         |
| SCIM 2.0 user sync                          | ✅     | Webhook handler in `api-gateway/src/routes/scim.ts`                                                                                                                                          |
| SCIM group→role mapping                     | ✅     | `GROUP_NAME_TO_ROLE` lookup table + `resolveRbacRoleIdForGroup()` + `applyGroupRoleToMembership()`; `dsync.group.user_added` event handler updates `Membership.roleId` — `workos.ts:367-645` |
| Platform JWT sessions                       | ✅     | Issued by auth-service after WorkOS callback                                                                                                                                                 |
| RBAC enforcement (35+ permissions, 7 roles) | ✅     | `shared-rbac` package; middleware wired                                                                                                                                                      |

---

## API Gateway — ADR-006

| Requirement                                                            | Status | Notes                                                                                                                      |
| ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Kong DB-less config                                                    | ✅     | `infrastructure/kong/kong.yaml`                                                                                            |
| Plugins: JWT, rate-limiting, correlation-id, prometheus, opentelemetry | ✅     | All declared in Kong YAML                                                                                                  |
| Plugins: request/response-transformer                                  | ✅     | Declared in Kong YAML                                                                                                      |
| Path-based `/api/v1/` routing                                          | ✅     | Regex routes in `kong.yaml:125-405`                                                                                        |
| Kong in production traffic path                                        | 🟡     | `services/api-gateway/` Express.js app is still the active entry point; Kong config ready but not deployed as live gateway |
| Kong canary deployment                                                 | ❌     | Not configured; upstream uses simple round-robin with a single target                                                      |
| Versioned API routing with deprecation headers                         | ✅     | `registerVersionedRoutes()` wired; `x-api-deprecated`/`Deprecation`/`Sunset` headers emitted via `api-versioning.ts`       |
| Error envelope per §13.3                                               | ❌     | See API Contracts section                                                                                                  |

---

## Workflow Engine — §9

| Requirement                                                         | Status | Notes                                                                                                                                                                           |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DAG execution (topological sort, parallel fan-out)                  | ✅     |                                                                                                                                                                                 |
| Bounded loops (maxIterations, breakOnKey, continueCondition)        | ✅     | `DAGRunner.executeBoundedLoop()`                                                                                                                                                |
| Loop tier caps (default 100 / hard 10,000 Pro)                      | ✅     | `maxLoopIterations` defaults to 100; hard-cap enforced in `dag-runner.ts:650-695`                                                                                               |
| All 8 node executor families                                        | 🟡     | Action, branch, loop, merge, approval, subworkflow, saga, AI registered; utility sub-nodes (Delay, Log, Annotate, Notify, Debug) missing from registry                          |
| Utility nodes (Delay, Log, Annotate, Notify, Debug)                 | ❌     | Not registered in `services/execution-service/src/executors/registry.ts`                                                                                                        |
| Saga compensation (LIFO)                                            | ✅     | `SagaCoordinator` wired via `sagaStack` in `DAGRunner`; `runSagaCompensation()` called in `finally` block                                                                       |
| `compensation_status` in checkpoint DB schema                       | ❌     | Runtime records it in `dag-worker.ts:311,389`; `NodeExecutionCheckpoint` in `schema.prisma` still lacks the column                                                              |
| Human approval pause/resume                                         | ✅     | Writes to `approval_tasks`; pauses and resumes on signal                                                                                                                        |
| Approval escalation chain + reminders (24h/1h)                      | ✅     | `startApprovalTimeoutSweeper()` in `packages/workflow-engine/src/approval.ts`; 24h (lines 182-194) and 1h (lines 196-208) reminders; escalation at lines 210-237                |
| Child workflows — fire-and-forget                                   | ✅     | `spawnChildWorkflow`; `parentExecutionId` correlation                                                                                                                           |
| Child workflows — sync (`await: true`)                              | ✅     | `awaitChildWorkflowCompletion()` wired in `dag-worker.ts:759-763`                                                                                                               |
| Child workflow nesting depth cap (5)                                | ✅     | Enforced in `dag-runner.ts:387-411`; defaults to 5                                                                                                                              |
| Checkpoint schema — §9.7 complete fields                            | ❌     | `NodeExecutionCheckpoint` in `schema.prisma` still missing: `idempotency_key`, `compensation_status`, `retry_count`, `started_at`, `finished_at` — only `stateJson` blob stored |
| Idempotency key: `workflow_id + run_id + node_id + attempt`         | ❌     | `IdempotencyStore` uses `executionId` only; composite format not implemented                                                                                                    |
| Node lease (acquire/renew 60s/expire 5min) using `execution_leases` | ❌     | `execution_leases` table exists; `InMemoryLeaseStore`/`RedisLeaseStore` exist in `workflow-engine` package; not wired in `dag-worker.ts`                                        |
| 3-attempt recovery → `recovery_exhausted` DLQ                       | ✅     | `dag-worker.ts:652-700`; explicit `recovery_exhausted` terminal status; DLQ routing and `execution.recovery_exhausted` event emitted                                            |
| JSON Patch diffs (ADR-005)                                          | ✅     | `computeFullDiff()` wired in `publishWorkflow()`; persisted to `workflow_diffs`                                                                                                 |
| Semantic diff rendering                                             | ✅     | `SemanticDiff` React component; version comparison page at `/workflows/[id]/versions`                                                                                           |

---

## Queue Topology — §11 / ADR-001

| Requirement                                      | Status | Notes                                                                                                                                                                            |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflow-execution` queue                       | ✅     | `packages/shared-queue/src/index.ts`; Redis DB 0; every-write AOF                                                                                                                |
| `workflow-execution-recovery` queue              | ✅     | Redis DB 1; every-write AOF                                                                                                                                                      |
| `billing-rollup` queue                           | ✅     | Redis DB 4; every-second AOF                                                                                                                                                     |
| `billing-reconciliation` queue                   | ✅     | Redis DB 5; every-second AOF                                                                                                                                                     |
| `notification-outbound` queue                    | ✅     | Redis DB 6; every-second AOF                                                                                                                                                     |
| `template-publish` queue                         | ✅     | Redis DB 8; RDB-only                                                                                                                                                             |
| `connector-install` queue                        | ✅     | Redis DB 7; every-second AOF                                                                                                                                                     |
| `audit-export` queue                             | ✅     | Redis DB 9; RDB-only                                                                                                                                                             |
| `ai-run` / `longox:ai-evaluation` queue          | 🟡     | `ai-run` queue exists; §11 specifies `longox:ai-evaluation` — naming mismatch                                                                                                    |
| `longox:search-indexing` queue                   | ❌     | Not found; no search indexing queue in topology                                                                                                                                  |
| `longox:maintenance` queue (low priority)        | ❌     | Not found                                                                                                                                                                        |
| Queue name `longox:` namespace prefix            | 🟡     | §11 specifies `longox:` prefix; all new queues omit it; only legacy shim uses `longox:executions`                                                                                |
| Redis cluster (3 primary + 3 replica)            | 🟡     | Terraform: `cluster_mode_enabled=true`, 3 shards × 1 replica — correct topology; Helm `global.yaml` has no explicit `cluster.enabled` flag, relies on external connection string |
| Per-queue AOF/RDB persistence tuning             | ✅     | `AofMode` enum per queue: every-write / every-second / rdb-only                                                                                                                  |
| Control-plane / execution-plane queue separation | 🟡     | Isolated by Redis logical DB index (0–9); not physically separate cluster pools                                                                                                  |
| BullMQ DLQ with `/dlq/:id/retry` redrive         | 🟡     | `DeadLetterQueue` class and redrive exist; endpoint is `/executions/:id/retry` (not `/dlq/:id/retry`) — path mismatch with spec                                                  |
| Legacy `longox:executions` shim retired          | ❌     | `LEGACY_QUEUE_NAME = "longox:executions"` preserved in `bullmq-queue.ts` for backwards compatibility                                                                             |

---

## Realtime — ADR-008

| Requirement                                               | Status | Notes                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSE (not WebSocket) for all realtime surfaces             | ✅     | Unified SSE endpoint + per-service streams; no WebSocket servers found                                                                                                                                                       |
| GraphQL subscriptions prohibited                          | ✅     | Explicitly prohibited in SDL                                                                                                                                                                                                 |
| Execution monitoring SSE                                  | ✅     | `execution-stream` endpoint; Redis pub/sub fanout; multi-execution `?executionIds=`                                                                                                                                          |
| Dashboard refresh SSE                                     | ✅     | `dashboard-service/src/api/dashboard-stream-route.ts` — SSE endpoint implemented                                                                                                                                             |
| Notification center SSE                                   | ✅     | `notification-service/src/api/rest/notification-stream.ts` — SSE endpoint implemented                                                                                                                                        |
| Single multiplexed SSE connection (demux by `event_type`) | ✅     | `GET /api/v1/realtime` in `api-gateway/src/routes/execution-stream.ts:413-647`; demuxes execution, dashboard, notification surfaces by `event_type`; subscribes via `?event_types=&executionIds=&dashboardIds=&recipientId=` |
| `packages/shared-realtime` — RealtimeHub                  | ✅     | `RealtimeHub` class manages `SseClient` registrations and broadcasts; `redis-execution-bus.ts` provides cross-instance Redis pub/sub fan-out                                                                                 |
| Bearer token auth on SSE                                  | ✅     | `authorize("executions:read")` middleware on stream endpoint                                                                                                                                                                 |
| `EventSource` — `Authorization` header workaround         | 🟡     | Server-side uses standard `text/event-stream`; client-side `fetch+ReadableStream` polyfill presence not confirmed in audit                                                                                                   |
| AI streaming SSE                                          | ✅     | Detects `accept: text/event-stream`; AI response delivered via SSE                                                                                                                                                           |
| AI partial response checkpoint every ~1s                  | ❌     | Not implemented in `AiExecutor`; returns single result on completion                                                                                                                                                         |
| Backpressure handling                                     | ❌     | No buffer-and-close logic for slow clients; `res.write()` return value unchecked                                                                                                                                             |

---

## Connector Sandbox — ADR-009

| Requirement                                                 | Status | Notes                                                                                                                 |
| ----------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Deno isolate per connector invocation                       | 🟡     | `DenoIsolate` class in `packages/connector-sandbox`                                                                   |
| In-process V8 isolate (`deno_core` binding, no IPC)         | ❌     | `deno-bridge.ts:57` uses `node:child_process.execFile` to launch Deno subprocess — not an embedded in-process isolate |
| Sub-ms cold-start                                           | ❌     | Process fork latency exceeds target; not benchmarked or validated                                                     |
| Resource caps (CPU, memory, wall-clock)                     | ✅     | Enforced via Deno CLI flags                                                                                           |
| Network: only allow-listed fetch                            | ✅     | `--allow-net` with domain allow-list                                                                                  |
| Sigstore signing at install time                            | ✅     | Present in connector manifests; verified in `install-connector.command.ts`                                            |
| Sigstore re-verification at cold-start                      | 🟡     | Install-time verification confirmed; cold-start re-verification not wired in `connector-sandbox` or `sandbox-runtime` |
| Marketplace lifecycle (install, configure, upgrade, remove) | ✅     |                                                                                                                       |

---

## Search — ADR-010

| Requirement                                                        | Status | Notes                                                                                                                                                                                                                       |
| ------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL FTS as primary backend                                  | 🟡     | `PostgresSearchRepository` exists using `ts_rank`/`ts_query`                                                                                                                                                                |
| Generated `tsvector` columns queried (not runtime `to_tsvector()`) | ❌     | All entity queries (workflows, apps, templates, connectors, executions, audit logs, AI prompts) still call `to_tsvector()` at runtime; `SearchIndex.titleTsv`/`contentTsv` columns exist but are not used by the repository |
| GIN indexes utilized                                               | 🟡     | Defined in SQL migration `002_search_fts_indexes.sql`; not utilized because runtime queries bypass pre-computed columns                                                                                                     |
| `SearchService.search(domain, query, filters)` abstraction         | ✅     | `SearchRepository` interface with swappable implementations                                                                                                                                                                 |
| OpenSearch escape path                                             | ❌     | Not implemented as runtime fallback; comment in `infrastructure/index.ts` only                                                                                                                                              |
| Typesense absent (ADR-010 compliance)                              | ✅     | `services/search-service/src/infrastructure/typesense/` directory removed; Typesense package absent                                                                                                                         |

---

## AI Platform — §8

| Requirement                                               | Status | Notes                                                                                                                                                 |
| --------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProviderAdapter interface                                 | ✅     | OpenAI, Anthropic, Google, DeepSeek, OpenRouter                                                                                                       |
| Provider fallback chains                                  | ✅     | Configurable strategies in AI router                                                                                                                  |
| Prompt registry (versioned, immutable once published)     | ✅     | Versioned prompts with live alias                                                                                                                     |
| Model registry                                            | ✅     | `ai_models` table + `AiModel` service                                                                                                                 |
| Token accounting — `input_tokens`, `output_tokens`        | ✅     |                                                                                                                                                       |
| Token accounting — `cached_tokens`, `tool_call_tokens`    | 🟡     | Tracked in `ai-service/src/application/services/token-accounting.service.ts`; not consumed as separate dimensions in `metering-service` domain entity |
| Input guardrails                                          | ✅     | `AiRunLifecycleService`                                                                                                                               |
| Input guardrails on streaming path                        | ✅     | `api/ai-runs-route.ts:102-162` — `moderationService.moderateInput()` executes before SSE stream opens; returns 403 if blocked                         |
| Output guardrails                                         | ✅     | `AiRunLifecycleService`                                                                                                                               |
| Tool guardrails (allow-list for model-emitted tool calls) | ✅     | `ai-run-lifecycle.service.ts:267-292` — checks `allowedTools` against model tool calls; blocks on violation                                           |
| Per-workflow token ceiling (default 100K)                 | ❌     | `cost-budget.service.ts` handles financial budgets (USD) only; no per-workflow token count ceiling enforced in request lifecycle                      |
| RAG (pgvector + cosine similarity)                        | ✅     | `VectorSearchService` with `<=>` operator; chunking pipeline                                                                                          |
| AI evaluation framework                                   | ✅     | `EvaluationService`, `RegressionGateService`; `ai_eval_datasets` and `ai_eval_runs` tables                                                            |
| Eval CI gate blocking production promotion                | 🟡     | `eval-gate` blocks `build-images` in `ci.yml:270`; NOT referenced in `cd.yml` as a deployment gate                                                    |
| AI streaming checkpoint every ~1s                         | ❌     | Not implemented; `AiExecutor` returns a single result after completion                                                                                |
| PII handling (redact/flag/block)                          | ✅     | `ModerationService` with keyword/regex/content filters                                                                                                |

---

## Billing & Metering — §16

| Requirement                                        | Status | Notes                                                                                                                                                                                                                    |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stripe checkout, subscriptions, webhooks, invoices | ✅     |                                                                                                                                                                                                                          |
| Atomic metering events at moment of usage          | ✅     | Emitted in `execution-service` and `ai-service`                                                                                                                                                                          |
| All 9 metered dimensions                           | 🟡     | `inputTokens`, `outputTokens`, `cost` tracked; `cached_tokens` and `tool_call_tokens` not consumed as separate dimensions in `metering-service` domain (`metering-event.ts` only defines `ai.token` and `ai.completion`) |
| Hourly rollup job                                  | ✅     | `billing-rollup` queue + `rollup-job.ts`; `BillingRollupJobData` defined                                                                                                                                                 |
| Daily reconciliation job                           | ✅     | `billing-reconciliation` queue + `reconciliation-job.ts`; `ReconciliationService.runDailyReconciliation()` wired                                                                                                         |
| Invoices generated from rollups only               | ✅     | Invoice traceability chain present                                                                                                                                                                                       |
| Token budgets — 50%/80%/100% thresholds            | ✅     | Budget alerts in `billing-service`                                                                                                                                                                                       |
| Token budget — AI hard cutoff (`hard_cutoff_at`)   | ✅     | AI fails; non-AI continues                                                                                                                                                                                               |
| `monthly_limit` naming alignment                   | 🟡     | `cost-budget.service.ts` removed; `billing.entity.ts` uses `budgetLimit`; schema column is `monthly_limit` — naming inconsistent across layers                                                                           |
| Plan entitlements enforcement                      | ✅     | `EntitlementService` + `entitlement-guard.ts` middleware                                                                                                                                                                 |
| Monthly partitioning DDL on `metering_events`      | ✅     | Confirmed in `packages/shared-db/migrations/006_partition_high_volume_tables.sql`                                                                                                                                        |

---

## Event Schema — §19

| Requirement                                                  | Status | Notes                                                                                                                                           |
| ------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `PlatformEvent` — all 10 mandatory fields                    | ✅     |                                                                                                                                                 |
| `event_id` with `evt_` prefix (mandatory)                    | ✅     | `createEvent()` line 129: `` const id = `evt_${randomUUID()}` `` — prefix now mandatory                                                         |
| `validateEvent` — `evt_` prefix strictly enforced            | 🟡     | Regex at line 196 enforces `evt_` prefix; error message at line 207 incorrectly says "optionally prefixed" — cosmetic inconsistency only        |
| `tenant_id` with `tnt_` prefix enforced                      | 🟡     | `validateEvent()` enforces via regex; `createEvent()` constructor does not enforce                                                              |
| `actor_id` with `usr_` prefix enforced                       | 🟡     | `validateEvent()` enforces; `createEvent()` constructor does not enforce                                                                        |
| All 16 event types from §19.4 implemented                    | 🟡     | Event handlers present for all 16 types; `billing.usage.recorded` naming violation remains (see row below)                                      |
| `workflow.rolled_back` event name (underscore)               | ✅     | Underscore confirmed in `PlatformEventType`                                                                                                     |
| `usage.recorded` vs `billing.usage.recorded`                 | ❌     | `packages/shared-gateway/src/projections/reporting-projection.ts:49` uses `billing.usage.recorded`; §19.4 specifies `usage.recorded`            |
| JSON Schema files at `packages/shared-types/schemas/events/` | ✅     | All 16 present                                                                                                                                  |
| `consumer_offsets` auto-deduplication in EventBus            | ❌     | `packages/event-bus/src/index.ts` is a placeholder; `InMemoryEventBus`, `RedisEventBus`, `NatsEventBus` do not interact with `consumer_offsets` |

---

## Observability — §22

| Requirement                                                      | Status | Notes                                                                                                                                                                                |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Structured JSON logging (pino)                                   | ✅     | `packages/shared-logger`                                                                                                                                                             |
| `tenant_id`, `correlation_id`, `service_name` on all log records | ✅     | Logger mixin + correlation middleware                                                                                                                                                |
| `tenant_id` via AsyncLocalStorage across all services            | 🟡     | `globalThis.__longoxTenantId` fallback still present in `shared-logger`; not consistently using AsyncLocalStorage                                                                    |
| Log redaction at log shipper (not SDK)                           | ❌     | Redaction implemented at `shared-logger` SDK level; architecture requires shipper-level redaction                                                                                    |
| OpenTelemetry instrumentation — api-gateway, execution-service   | ✅     |                                                                                                                                                                                      |
| OpenTelemetry instrumentation — billing-service                  | ✅     | `services/billing-service/src/telemetry/metrics.ts`                                                                                                                                  |
| OpenTelemetry instrumentation — search-service                   | 🟡     | Metrics via `@opentelemetry/api` in `search-service/src/telemetry/metrics.ts`; no distributed tracing (no tracer/span initialization in `standalone.ts`)                             |
| OTel sampling: 1% non-critical / 100% billing+auth+AI            | ❌     | No differentiated sampling configured                                                                                                                                                |
| Prometheus `/metrics` endpoint                                   | ✅     | Via `shared-observability`                                                                                                                                                           |
| Grafana SLO dashboards                                           | ✅     | `infrastructure/observability/grafana-dashboards/`                                                                                                                                   |
| Runbooks location: `docs/runbooks/`                              | ✅     | `docs/runbooks/` contains 6 runbook files (backup-restore-drill, database-failover, full-platform-recovery, kubernetes-cluster-failure, region-failover, security-incident-response) |
| PodDisruptionBudgets on every deployment                         | 🟡     | Helm chart templates include PDB; raw `infrastructure/kubernetes/` manifests not confirmed                                                                                           |
| HPA — CPU scaling                                                | ✅     | `ai-service` and `execution-service` HPAs                                                                                                                                            |
| HPA — memory scaling                                             | ❌     | CPU only; no memory-based HPA configured                                                                                                                                             |
| HPA — queue-depth scaling (BullMQ metrics adapter)               | ✅     | `infrastructure/helm/execution-service/values.yaml:67-85` — External metric `bullmq_queue_waiting` with `averageValue: 10`                                                           |

---

## Infrastructure

| Requirement                                                 | Status | Notes                                                                                                                           |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Terraform (Vault, Redis, Postgres, EKS, Kong, WorkOS, etc.) | ✅     | All modules present                                                                                                             |
| Kubernetes base manifests (all 19 services)                 | ✅     | 4 namespaces                                                                                                                    |
| Helm chart (all 19 services with HPA, PDB, ConfigMap)       | ✅     | Tenant-tier-aware namespace templates                                                                                           |
| Observability stack (Prometheus, Grafana, OTel collector)   | ✅     | Configured in `infrastructure/observability/`                                                                                   |
| Docker Compose (dev + distributed)                          | ✅     |                                                                                                                                 |
| Redis cluster mode in Terraform                             | ✅     | `modules/redis/main.tf` — `cluster_mode_enabled=true`, `num_node_groups=3`, `replicas_per_node_group=1` = 3 primary + 3 replica |
| Redis cluster mode in Helm                                  | 🟡     | `global.yaml` has no explicit `cluster.enabled` toggle; relies on connection string from Terraform/Secrets Manager              |

---

## Frontend

| Requirement                                                                     | Status | Notes                                                                 |
| ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| Design system (Radix-based, 20+ shared components)                              | 🟡     | Components extracted; `apps/web` imports not fully migrated           |
| Workflow builder (React Flow, 25+ node types)                                   | ✅     | `workflow-canvas` data layer wired via hooks                          |
| Dashboard builder (10 widget types, grid layout)                                | 🟡     | Widget types and grid present; proper grid library not yet integrated |
| Admin route group (`/admin/*`)                                                  | ✅     | Tenants, feature flags, RBAC, audit log, compliance, billing pages    |
| All route groups (auth, workflows, executions, dashboard, marketplace, billing) | 🟡     | All exist; app surfaces not fully populated                           |

---

## GDPR / Compliance

| Requirement                        | Status | Notes                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------------------------------- |
| GDPR export (S3 upload)            | ✅     | `GDPRService.exportUserData()` with S3; migrated to Prisma                 |
| GDPR delete (cascade deletion)     | ✅     | Credentials, executions, billing, metering, audit logs, connector installs |
| Audit export (CSV/JSON, async, S3) | ✅     | `AuditExportService`; `GET /api/v1/audit/export`                           |
| 13M hot + 7Y cold retention        | ✅     | Partition manager, archive service, Parquet/S3, presigned URLs             |

---

## Multi-Tenancy

| Requirement                                                     | Status | Notes                                                                                              |
| --------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| Tenant tiers (shared / dedicated namespace / dedicated cluster) | ✅     | `tier-routing.service.ts`; per-tier DB pool, Redis index, Vault prefix, K8s namespace, rate limits |
| Tier enforcement middleware                                     | ✅     | `tierEnforcementMiddleware` emits `x-tenant-tier`                                                  |

---

## Open Gaps Summary

Remaining items after 2026-07-05 import. Matrix tables above are the authoritative per-row status. The lists below de-duplicate cross-section gaps (AI 1s checkpoint in Workflow Engine §9 and Realtime ADR-008; Redis cluster Helm in Queue Topology §11 and Infrastructure) and exclude 3 Frontend 🟡 rows (design system migration, dashboard grid library, app surface population) as product-completeness items outside architecture compliance scope. Net unique architecture compliance gaps: **32 ❌ + 31 🟡 = 63**.

### ❌ — Not Implemented (32 items)

| #   | Gap                                                                                                                                                                                                                                                     | Section      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | `NodeExecutionCheckpoint` in `schema.prisma` missing §9.7 columns (`idempotency_key`, `compensation_status`, `retry_count`, `started_at`, `finished_at`); runtime code writes `compensation_status` in `dag-worker.ts` but the DB column does not exist | §9.7         |
| 2   | Utility nodes (Delay, Log, Annotate, Notify, Debug) not registered in executor registry                                                                                                                                                                 | §9.10        |
| 3   | Idempotency key format (`workflow_id+run_id+node_id+attempt`): `IdempotencyStore` uses `executionId` only                                                                                                                                               | §9           |
| 4   | Node lease (`execution_leases` table) not wired into `dag-worker.ts`                                                                                                                                                                                    | §9           |
| 5   | Per-workflow 100K token ceiling not enforced in AI request lifecycle                                                                                                                                                                                    | §8.10        |
| 6   | AI streaming checkpoint every ~1s not implemented                                                                                                                                                                                                       | §8 / ADR-008 |
| 7   | `longox:search-indexing` queue missing from topology                                                                                                                                                                                                    | §11          |
| 8   | `longox:maintenance` low-priority queue missing                                                                                                                                                                                                         | §11          |
| 9   | Legacy `longox:executions` shim not retired from `bullmq-queue.ts`                                                                                                                                                                                      | §11          |
| 10  | Connector sandbox: in-process `deno_core` V8 binding (currently `child_process` subprocess)                                                                                                                                                             | ADR-009      |
| 11  | Connector sandbox: sub-ms cold-start not validated                                                                                                                                                                                                      | ADR-009      |
| 12  | `PostgresSearchRepository` calls `to_tsvector()` at runtime; pre-computed `SearchIndex` columns not queried; GIN indexes bypassed                                                                                                                       | ADR-010      |
| 13  | OpenSearch escape path not implemented as runtime fallback                                                                                                                                                                                              | ADR-010      |
| 14  | `consumer_offsets` auto-deduplication not wired into any `EventBus` implementation                                                                                                                                                                      | §19.3        |
| 15  | `reporting-projection.ts:49` uses `billing.usage.recorded`; §19.4 specifies `usage.recorded`                                                                                                                                                            | §19.4        |
| 16  | Error envelope format §13.3 not implemented (`{ error: string }` returned instead of full envelope)                                                                                                                                                     | §13.3        |
| 17  | Idempotency key not enforced centrally at gateway                                                                                                                                                                                                       | §12          |
| 18  | Kong canary deployment not configured                                                                                                                                                                                                                   | ADR-006      |
| 19  | `auth-service` missing `schema.graphql`                                                                                                                                                                                                                 | §24.2        |
| 20  | `execution-service` missing `schema.graphql`                                                                                                                                                                                                            | §24.2        |
| 21  | `auth-service` missing `openapi.yaml`                                                                                                                                                                                                                   | §24.2        |
| 22  | `execution-service` missing `openapi.yaml`                                                                                                                                                                                                              | §24.2        |
| 23  | `tools/` top-level directory missing                                                                                                                                                                                                                    | §24.1        |
| 24  | MFA — WebAuthn/passkey not implemented                                                                                                                                                                                                                  | ADR-007      |
| 25  | License check in CI PR stage                                                                                                                                                                                                                            | §21.3        |
| 26  | Pact consumer-driven contract tests                                                                                                                                                                                                                     | §21.3        |
| 27  | Database migration dry-run (`prisma migrate deploy --dry-run`)                                                                                                                                                                                          | §21.3        |
| 28  | Synthetic flows in release candidate stage                                                                                                                                                                                                              | §21.3        |
| 29  | Real canary analysis (error rate + latency) — current script is `# Placeholder`                                                                                                                                                                         | §21.3        |
| 30  | Log redaction at shipper level (currently at `shared-logger` SDK)                                                                                                                                                                                       | §22          |
| 31  | OTel differentiated sampling (1% non-critical / 100% billing+auth+AI)                                                                                                                                                                                   | §22          |
| 32  | HPA memory-based scaling not configured                                                                                                                                                                                                                 | §22          |

### 🟡 — Partially Implemented (31 items)

| #   | Gap                                                                                                                                                     | Section       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 33  | Unit & contract tests — not all services have test suites                                                                                               | §21.3         |
| 34  | Trivy runs `--scanType fs`; container image scan needed                                                                                                 | §21.3         |
| 35  | Progressive staging: 50% canary step missing (10% → 100% jump)                                                                                          | §21.3         |
| 36  | Production approval gate: `environment: production` gating present; 1-vs-2 approver tier logic absent                                                   | §21.3         |
| 37  | Rollback target verification: `rollout undo` present; no health check of rollback target                                                                | §21.3         |
| 38  | AI eval gate: blocks `build-images` in `ci.yml`; NOT wired as blocking deployment gate in `cd.yml`                                                      | §21.3 / §8.8  |
| 39  | GraphQL schema per service: `workflow-service` ✅; `auth-service`, `execution-service` missing                                                          | §24.2         |
| 40  | OpenAPI spec per service: `workflow-service` ✅; `auth-service`, `execution-service` missing                                                            | §24.2         |
| 41  | Zod request schemas: 30+ endpoints covered; not all routes wired                                                                                        | API Contracts |
| 42  | Partial indexes (`WHERE status='active'`): not expressible in Prisma DSL; raw SQL migrations unconfirmed                                                | §10           |
| 43  | `tsvector` columns in core domain tables (Workflow, NodeExecution): missing; only `SearchIndex` has them                                                | ADR-010       |
| 44  | `packages/shared-testing`: package exists but `src/index.ts` is a placeholder comment only                                                              | §24.1         |
| 45  | `packages/event-bus`: package exists but `src/index.ts` is a placeholder comment only                                                                   | §24.1         |
| 46  | `execution-service` internal structure: uses hybrid `runners/orchestrator/executors/queue/` — not strict `domain/application/infrastructure/api/`       | §24.2         |
| 47  | Kong Express shim still active entry point; Kong config ready but not in production traffic path                                                        | ADR-006       |
| 48  | All 8 node executor families: 8 families registered; utility sub-nodes (Delay, Log, etc.) absent                                                        | §9            |
| 49  | `ai-run` queue naming: queue exists but §11 specifies `longox:ai-evaluation`; `longox:` namespace prefix absent from all new queues                     | §11           |
| 50  | Redis cluster: Terraform correctly configured (3+3); Helm `global.yaml` lacks explicit `cluster.enabled` flag                                           | §11.2         |
| 51  | Control-plane / execution-plane queue separation: logically separated by Redis DB index; not physically separate cluster pools                          | §11           |
| 52  | DLQ redrive endpoint: `/executions/:id/retry` exists but §11 specifies `/dlq/:id/retry`                                                                 | §11           |
| 53  | `EventSource` auth workaround: server-side standard SSE confirmed; client-side `fetch+ReadableStream` polyfill not confirmed in audit                   | ADR-008       |
| 54  | Sigstore re-verification at cold-start: install-time ✅; sandbox boot re-verification not wired                                                         | ADR-009       |
| 55  | GIN indexes: defined in `002_search_fts_indexes.sql`; bypassed because queries still call runtime `to_tsvector()`                                       | ADR-010       |
| 56  | `cached_tokens`/`tool_call_tokens`: tracked in `ai-service`; not consumed as separate dimensions in `metering-service` domain                           | §16.1         |
| 57  | `monthly_limit` naming: `cost-budget.service.ts` removed; `billing.entity.ts` uses `budgetLimit`; schema column is `monthly_limit` — still inconsistent | §16           |
| 58  | `validateEvent` error message says "optionally prefixed with evt\_" despite regex enforcing it — cosmetic inconsistency                                 | §19.1         |
| 59  | `tenant_id` / `actor_id` prefixes: `validateEvent()` enforces; `createEvent()` constructor does not                                                     | §19.1         |
| 60  | All 16 event types: handlers present; `billing.usage.recorded` naming violation (see item 15) means §19.4 not fully satisfied                           | §19.4         |
| 61  | `AsyncLocalStorage` for `tenant_id`: `shared-logger` still falls back to `globalThis.__longoxTenantId`                                                  | §22           |
| 62  | OTel search-service: metrics instrumentation present; distributed tracing (tracer/spans) not initialized                                                | §22           |
| 63  | PodDisruptionBudgets: Helm chart templates include PDB; raw `infrastructure/kubernetes/` manifests not confirmed                                        | §22           |

---

## Fix History

| Date                 | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-03 (batch 1) | API v1 deprecation, tenant tier column, FTS SQL injection (parameterized queries), SSE Redis fanout, RBAC promote action, dashboard redirect. **Partial:** in-memory + Redis `LeaseStore` classes added to `workflow-engine` package but `execution_leases` DB table not yet wired into `dag-worker` (remains ❌ in matrix).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-03 (batch 2) | pgvector HNSW index, VectorSearchService, GDPR S3/cascade deletion, cold query Parquet/presigned URLs, multi-tenancy tier routing, entitlements guard middleware, Zod schemas (30+ endpoints), Helm 19-service chart, Kong CI/CD jobs, design system 20 components, semantic diff + version page, canvas data layer hooks, dashboard grid layout, admin route group, Prisma ADR-013 migration plan, SSE typed event routing, AuthKit frontend component, audit export service + endpoint, versioned routes. **Partial:** Deno sandbox still executes via `child_process` subprocess (remains ❌); eval CI gate job added but `cd.yml` blocking enforcement not confirmed (remains 🟡).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-04           | Full architecture compliance audit against v2.1. Matrix written. Typesense marked as ADR-010 violation. All CI/CD, checkpoint schema, lease-based execution, error envelope, AI guardrails, SSE multiplexing gaps recorded with accurate statuses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-07-05           | **Import audit — 14 parallel domain explorers.** Newly ✅: SagaCoordinator wired into DAGRunner (`finally`-block `runSagaCompensation`); approval escalation chain + 24h/1h reminders; child workflow `await:true` polling; child nesting depth cap (5) enforced; loop tier caps enforced; 3-attempt `recovery_exhausted` terminal state + DLQ routing; billing rollup + reconciliation jobs + queues; monthly partitioning DDL confirmed in migration SQL; per-queue AOF/RDB tuning; queue-depth HPA (BullMQ external metric); single multiplexed SSE `/api/v1/realtime` endpoint; `packages/shared-realtime` RealtimeHub; dashboard + notification SSE endpoints; `event_id` `evt_` prefix enforced in `createEvent()`; `workflow.rolled_back` underscore; input guardrails on streaming path; tool guardrails allow-list; Typesense removed (ADR-010 compliant); Redis cluster Terraform (3+3); runbooks at `docs/runbooks/`; MFA SMS via WorkOS; SCIM group→role mapping; README.md in all 19 services. Newly 🟡 (from ❌): `shared-testing`/`event-bus` packages exist as placeholders; Redis cluster Helm (no explicit toggle); OTel search-service (metrics only, no tracing). Newly ❌ (from 🟡): per-workflow 100K token ceiling confirmed not enforced in request lifecycle. **Remaining: 32 ❌ + 31 🟡 = 63 unique architecture compliance gaps.** |

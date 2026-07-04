# Architecture Compliance Audit
**Against:** architecture.md v2.1 + ADR-006 through ADR-013  
**Date:** 2026-07-04  
**Verdict:** Implementation must conform to architecture.md v2.1. Gaps below are implementation deficiencies.

---

## Summary Scorecard

| Domain | Status | Critical Gaps |
|---|---|---|
| API Gateway (ADR-006) | 🟡 Partial | Express shim in prod path; error envelope wrong |
| Identity / Auth (ADR-007) | 🟡 Partial | SCIM group→role mapping incomplete |
| Database Schema (§10) | ✅ Compliant | All tables present; pgvector active |
| Monorepo Structure (§24) | 🟡 Partial | Missing `tools/`, `shared-testing`, `event-bus`; READMEs absent |
| Queue Topology (§11 / ADR-001) | 🔴 Critical | 6 of 10 queues missing; no Redis cluster; lease logic absent |
| Workflow Engine (§9) | 🔴 Critical | Checkpoint schema mismatch; idempotency key wrong; nesting depth not enforced |
| SSE Realtime (ADR-008) | 🟡 Partial | Dashboard/notification SSE missing; multiplexing incomplete; AI checkpoint missing |
| Connector Sandbox (ADR-009) | 🟡 Partial | Deno via subprocess (not in-process isolate); Sigstore verify not wired |
| Search (ADR-010) | 🔴 Critical | Typesense still active — direct ADR violation; tsvector not in Prisma |
| CI/CD Pipeline (§21.3) | 🟡 Partial | No Pact tests; no migration dry-run; canary placeholder; no license check |
| Event Schema (§19) | 🟡 Partial | `evt_` prefix not enforced; consumer_offsets not auto-used; hyphen in event type |
| Billing / Metering (§16) | 🟡 Partial | Cached/tool-call tokens not metered; reconciliation job absent |
| AI Platform (§8) | 🟡 Partial | Tool guardrails missing; input guardrails skipped on streaming; eval CI gate not wired |
| Observability (§22) | 🟡 Partial | No PDBs; HPA CPU-only; OTel sampling not differentiated; runbooks wrong path |

---

## 1. API Gateway — ADR-006

**Requirement:** Kong Gateway (OSS/Enterprise), DB-less mode, plugins: JWT / rate-limiting / correlation-id / prometheus / opentelemetry / request+response-transformer. Standard error envelope. Global idempotency handling.

**What exists:**
- `infrastructure/kong/kong.yaml` ✅ — DB-less, all required plugins present
- `services/api-gateway/` — Express.js shim documented as "DEV-ONLY stand-in"
- OpenAPI spec at `services/api-gateway/openapi/openapi.yaml` ✅
- GraphQL schema at `services/api-gateway/graphql/schema.graphql` ✅
- Path-based `/api/v1/` routing ✅
- JWT + rate-limit + correlation-id in both Kong config and Express middleware ✅

**Gaps:**
1. **Error envelope (§13.3):** Express error handler returns `{ error: string, requestId: string }`. Required: `{ error: { code, message, details, correlation_id, retry_after_seconds, documentation_url } }`.
2. **Idempotency:** `x-idempotency-key` is handled per-service, not centrally at the gateway. Arch requires gateway-level enforcement.
3. **Kong production readiness:** Express shim must not be the production traffic path; Kong must be the live gateway before launch.

---

## 2. Identity / Auth — ADR-007

**Requirement:** WorkOS (AuthKit, SAML/OIDC SSO, SCIM 2.0, Admin Portal). Platform issues its own JWT sessions. MFA via TOTP/WebAuthn.

**What exists:**
- WorkOS SDK used via `@longox/shared-auth/workos` ✅
- AuthKit login (`/auth/workos/url`, `/auth/workos/callback`) ✅
- SSO (SAML/OIDC) via `/auth/sso` ✅
- MFA (TOTP enrollment/challenge/verify) ✅
- Admin Portal link generation ✅
- SCIM webhook handler in `services/api-gateway/src/routes/scim.ts` ✅ (partial)

**Gaps:**
1. **SCIM group→role mapping:** `auth-service/src/api/rest/workos.ts` line 361 has a `TODO` for membership processing. The gateway SCIM handler logs group changes instead of mapping them to RBAC roles. SCIM 2.0 directory sync is partially wired.
2. **RBAC table schema mismatch:** `as any` type escapes in auth service indicate schema drift — investigate column alignment between code and Prisma.

---

## 3. Database Schema — §10

**Requirement:** Full table catalog from Section 10.1 + consumer_offsets (§19.3). Monthly partitioning on 6 high-volume tables. Composite + partial indexes. pgvector for RAG.

**What exists:**
- All 40+ required tables present in `packages/shared-db/prisma/schema.prisma` ✅
- `consumer_offsets` table present ✅
- `WorkflowDiff.patchJson` implements JSON Patch (ADR-005) ✅
- pgvector extension declared; `VectorEmbedding` uses `Unsupported("vector(1536)")` ✅
- Partitioning annotations present on `workflow_executions`, `metering_events`, `ai_usage`, `audit_logs`, `platform_events` ✅
- Composite `(tenant_id, *)` indexes on multi-tenant tables ✅

**Gaps:**
1. **`node_execution_checkpoints` partitioning annotation:** Missing explicit monthly partition comment (other execution tables have it).
2. **Partial indexes:** `WHERE status='active'` partial indexes cannot be expressed in Prisma DSL — they must be added as raw SQL in migrations. Confirm migrations contain them.

> **Overall: closest-to-compliant domain. Minor gaps only.**

---

## 4. Monorepo Structure — §24

**Requirement:** Specific `apps/`, `services/`, `packages/`, `connectors/`, `templates/`, `infrastructure/`, `tools/` layout. Each service must have `src/{domain,application,infrastructure,api}/`, `openapi.yaml`, `schema.graphql`, `Dockerfile`, `README.md`.

**What exists:**
- All 5 required `apps/` ✅
- All 17 required `services/` ✅ (plus 2 extra: `compliance-service`, `replication-service`)
- 16 of 18 required `packages/` ✅
- `connectors/` (11), `templates/`, `infrastructure/`, `scripts/`, `.github/`, `docs/` ✅
- `packages/shared-types/schemas/events/` ✅

**Gaps:**
1. **Missing packages:** `shared-testing`, `event-bus` not present.
2. **Missing top-level:** `tools/` directory absent.
3. **Service internal structure:** `execution-service` uses non-standard layout (`runners/`, `orchestrator/` instead of `domain/application/infrastructure/api/`). `api-gateway` uses `routes/middleware/` instead.
4. **`openapi.yaml` per service:** `auth-service` and `execution-service` lack service-level `openapi.yaml`.
5. **`schema.graphql` per service:** `auth-service` and `execution-service` lack service-level GraphQL SDL.
6. **`README.md`:** Missing in all sampled service directories (`auth-service`, `workflow-service`, `execution-service`, `api-gateway`).

---

## 5. Queue Topology — §11 / ADR-001 🔴 CRITICAL

**Requirement:** 10 named queues with specific priority tiers and AOF persistence settings. Redis cluster (3 primary + 3 replica). Separate control-plane and execution-plane queues. Lease-based execution (5-min lease, 60s renewal). Dead-letter queue with redrive. Idempotency key: `workflow_id + run_id + node_id + attempt`.

**What exists:**
- BullMQ in use ✅
- `execution_leases` table exists in Prisma ✅ (but not used)
- `DeadLetterQueue` class exists in `execution-service` ✅ (but DB-backed log, not BullMQ DLQ)

**Gaps:**
1. **Queue proliferation (critical):** Single queue `longox:executions` used for all job types. **6 of 10 required queues are missing:** `workflow-execution-recovery`, `billing-rollup`, `billing-reconciliation`, `notification-outbound`, `template-publish`, `connector-install`, `audit-export`. Remaining 4 are job-type variants in the single queue, not separate queues.
2. **Redis cluster (critical):** IORedis configured in standalone mode (`redis://localhost:6379`). No 3-primary + 3-replica cluster. Per-queue AOF persistence configuration impossible in current setup.
3. **Lease-based execution (critical):** `execution_leases` table is defined but never queried in `dag-worker.ts` or `workflow-worker.ts`. No 5-min lease acquisition, no 60s renewal loop.
4. **Idempotency key:** `workflow_id + run_id + node_id + attempt` composite key not implemented. `IdempotencyStore` interface exists but uses `executionId` only.
5. **Control/execution plane queue separation:** No separation — all queues share one pool.
6. **DLQ with redrive:** Current DLQ is a database log; no BullMQ dead-letter queue with replay capability.

---

## 6. Workflow Engine — §9 🔴 CRITICAL

**Requirement:** DAG + bounded loops (default 100, cap 10,000), all 8 node families, saga compensation, human approval with escalation, child workflows (max depth 5), full checkpoint schema (§9.7), 3-attempt recovery → `recovery_exhausted` DLQ.

**What exists:**
- DAG execution with topological sort ✅
- Saga compensation (`runSagaCompensation` LIFO) ✅
- Approval gate (pause/resume) ✅
- Child workflow config + `spawnChildWorkflow` ✅
- Recovery marker + worker lease logic in `bullmq-queue.ts` ✅ (partial)
- Bounded loop unrolling ✅

**Gaps:**
1. **Checkpoint schema mismatch (critical — §9.7):** `CheckpointData` is missing: `idempotency_key`, `compensation_status`, `retry_count`, `started_at`, `finished_at`. Currently stores a generic `stateJson` blob. Arch requires the exact flat schema.
2. **Idempotency key (critical — §9.1):** `workflow_id + run_id + node_id + attempt` composite key absent. `IdempotencyStore` implementations don't use it.
3. **Child workflow nesting depth (§9.6):** Max depth 5 not enforced in `dag-runner.ts` or `types.ts`.
4. **Child workflow sync mode (§9.6):** `await: true` fire-and-wait is declared in config but the runner spawns and immediately returns success; it does not await the child's completion.
5. **Loop iteration caps (§9.2):** Default 100 and Pro-tier hard cap 10,000 not enforced. No tier-based validation.
6. **Escalation chain (§9.5):** Approval timeout defaults to 7 days ✅, but escalation chain and configurable reminders (24h / 1h before timeout) not implemented.
7. **3-attempt `recovery_exhausted` (§9.8):** Documented in `config/runtime.ts` comments but not enforced in `dag-worker.ts`.
8. **Utility nodes (§9.10):** Delay, Log nodes missing from executor registry.
9. **`compensation_status` in checkpoint:** `SagaCoordinator` class exists but `DAGRunner` uses a local `sagaStack` instead; coordinator is not used.

---

## 7. SSE Realtime — ADR-008

**Requirement:** SSE (not WebSocket) for all realtime surfaces: execution monitoring, dashboard refresh, notification center. Single multiplexed connection per client demultiplexed by `event_type`. Bearer token in `Authorization` header. AI partial responses persisted every ~1s as checkpoint. Backpressure handling.

**What exists:**
- `execution-stream.ts` uses `text/event-stream`, `X-Accel-Buffering: no` ✅
- Execution monitoring over SSE (`sseExecutionBus` → Redis → client) ✅
- AI streaming via SSE (detect `accept: text/event-stream`) ✅
- Bearer token auth on SSE via `authorize("executions:read")` middleware ✅
- No active WebSocket servers ✅
- GraphQL subscriptions explicitly prohibited in `schema.graphql` ✅

**Gaps:**
1. **Dashboard SSE:** No SSE endpoint in `dashboard-service`. Dashboard refresh is not realtime.
2. **Notification center SSE:** No SSE endpoint in `notification-service`.
3. **Single multiplexed connection:** Execution stream is per-resource-type, not a unified multi-domain stream demultiplexed by `event_type`.
4. **Frontend `EventSource` auth:** `apps/web/src/hooks/use-execution.ts` uses native `EventSource` API which cannot set `Authorization` header. Documented workaround (token in query string + frequent rotation, or fetch-based polyfill) not implemented.
5. **AI checkpoint persistence:** No 1-second interval checkpoint of partial AI responses in `ai-service`.
6. **Backpressure:** No explicit buffer-and-close logic for slow clients on SSE connections.

---

## 8. Connector Sandbox — ADR-009

**Requirement:** Deno isolates (V8 isolate + Deno runtime), in-process (no IPC), sub-ms cold-start, resource caps (CPU/memory/wall-clock), network only via allow-listed fetch, no native modules. Sigstore manifest signing verified at install time AND on every cold-start.

**What exists:**
- `packages/connector-sandbox` with `DenoIsolate` class ✅
- Resource caps via Deno CLI flags (`--v8-flags`, `--allow-net` with domain list) ✅
- Connector SDK using fetch-compatible APIs ✅
- Sigstore signing present in connector manifests ✅

**Gaps:**
1. **Subprocess vs in-process (critical — ADR-009):** `deno-bridge.ts` spawns Deno as a `child_process` subprocess, not as an embedded V8 isolate via `deno_core` binding. This adds IPC overhead and likely exceeds sub-ms cold-start target due to process fork latency.
2. **Cold-start validation:** Sub-millisecond cold-start not validated against §5.2 targets.
3. **Sigstore verification at cold-start:** Install-time signature verification present, but cold-start re-verification (every isolate boot) not confirmed in `connector-sandbox` code.
4. **Filesystem allow-list:** Explicit filesystem allow-list enforcement not confirmed (Deno subprocess inherits from `--allow-read` flag logic).

---

## 9. Search — ADR-010 🔴 CRITICAL (Direct Violation)

**Requirement:** PostgreSQL FTS (`tsvector` + GIN indexes). Typesense/Meilisearch/Algolia explicitly rejected. `SearchService.search(domain, query, filters)` abstraction for future swap to OpenSearch.

**What exists:**
- `SearchRepository` interface abstraction ✅
- `PostgresSearchRepository` using `ts_rank` / `ts_query` ✅
- SQL migration `002_search_fts_indexes.sql` adding `fts tsvector` columns ✅

**Gaps:**
1. **Typesense active (critical — ADR-010 violation):** `services/search-service/src/infrastructure/typesense/` is a full implementation. `search-service/package.json` includes `typesense: ^3.0.6`. Switches to Typesense when `SEARCH_BACKEND=typesense`. This is an explicit architectural violation — Typesense was rejected in ADR-010.
2. **`tsvector` not in Prisma schema:** `schema.prisma` lacks generated `tsvector` columns. `PostgresSearchRepository` calls `to_tsvector()` at query time on every search, defeating the performance benefit of GIN indexes.
3. **OpenSearch escape path:** Not documented in code. The implemented "escape" is Typesense (rejected).
4. **GIN index utilization:** GIN indexes are defined in SQL migration but are not used because Prisma queries calculate vectors at runtime.

**Required remediation:** Remove Typesense infrastructure and dependency. Add `Unsupported("tsvector")` generated columns to `schema.prisma`. Update `PostgresSearchRepository` to query the pre-computed columns.

---

## 10. CI/CD Pipeline — §21.3

**Requirement:** PR (unit tests, static analysis, schema validation, dependency audit, license check). Main (build, Trivy on image, migration dry-run, Pact contract tests). Release candidate (Sigstore signing, staging deploy, smoke tests, synthetic flows). Staging (10%→50%→100% progressive, real canary analysis). Production (1 approver minor / 2 major, rollback target verified).

**What exists:**
- Unit tests ✅
- TypeScript + lint checks ✅
- Dependency audit ✅
- Prisma schema validate ✅ (after pending user change)
- Kong config lint ✅
- Madge circular dependency check ✅ (ci.yml:86)
- Trivy filesystem scan ✅
- Sigstore image signing in `cd.yml` ✅
- Smoke tests ✅
- 10% canary deploy in `cd.yml` ✅

**Gaps:**
1. **License check:** No license compliance check in PR stage.
2. **Pact / Consumer-Driven Contract tests:** `api-contract` job does OpenAPI linting + Zod validation only — no Pact testing.
3. **Migration dry-run:** `prisma validate` is not `prisma migrate deploy --dry-run`. No actual migration simulation.
4. **Trivy on image (not FS):** Trivy runs `--scanType fs` not against the built container image.
5. **Synthetic flows:** No synthetic monitoring flows in release candidate stage.
6. **Progressive staging (50% step):** `cd.yml` jumps directly from 10% canary to 100%; 50% increment missing.
7. **Real canary analysis:** Canary analysis script is explicitly marked `# Placeholder` — no real error rate / latency validation.
8. **Production approval tiers:** `environment: production` gating exists but no "1 approver minor / 2 approver major" logic.
9. **Rollback target verification:** Only `rollout undo` present; no pre/post health check of rollback target.
10. **Migration rollback documentation:** No CI gate enforcing documented rollback strategy per release.

---

## 11. Event Schema — §19

**Requirement:** All 10 mandatory fields on every event. `evt_` prefix on `event_id`. Consumer idempotency via `consumer_offsets`. Exact event catalog from §19.4. JSON Schemas at `packages/shared-types/schemas/events/`. No hyphens in `event_type` (dotted namespace only).

**What exists:**
- `PlatformEvent` interface with all 10 fields ✅
- `validateEvent` function ✅
- `consumer_offsets` table in Prisma ✅
- Full event catalog implemented (all 16 event types from §19.4) ✅
- JSON Schema files at `packages/shared-types/schemas/events/` ✅
- `schema_url` generation in `schemaUrlFor` ✅

**Gaps:**
1. **`evt_` prefix not enforced:** `createEvent` uses `randomUUID()` without `evt_` prefix. `validateEvent` regex makes prefix optional.
2. **Consumer auto-deduplication:** `EventBus` implementations (`InMemoryEventBus`, `RedisEventBus`, `NatsEventBus`) do not interact with `consumer_offsets`. Consumers must manually implement deduplication — high risk of violation.
3. **Hyphen in event type:** `workflow.rolled-back` uses a hyphen, violating §19.1 dotted-namespace pattern. Should be `workflow.rolled_back` or `environment.rolled_back`.
4. **`usage.recorded` vs `billing.usage.recorded`:** `PlatformEventType` union uses `billing.usage.recorded` but §19.4 specifies `usage.recorded`.

---

## 12. Billing / Metering — §16

**Requirement:** Atomic metering events at moment of usage. All 9 metered dimensions. Hourly rollup + daily reconciliation jobs. Invoices from rollups only. Token budgets with 50%/80%/100% thresholds. Hard cutoff (AI fails, non-AI continues).

**What exists:**
- `metering_events`, `usage_rollups`, `token_budgets`, `billing_accounts`, `invoices`, `invoice_lines` in Prisma ✅
- `TokenBudget` with `monthly_limit`, `alert_50`, `alert_80`, `hard_cutoff_at` ✅
- Metering event emission in `execution-service` and `ai-service` ✅
- Invoice traceability chain ✅
- AI hard cutoff logic present in `ai-service` ✅

**Gaps:**
1. **Missing metered dimensions:** Cached tokens and tool-call tokens not recorded in AI usage events. Only `inputTokens`, `outputTokens`, `cost` tracked. §8.4 requires all four token types.
2. **Column name mismatch:** `cost-budget.service.ts` references `maxCost` but Prisma schema uses `monthly_limit` — likely a code/schema drift.
3. **Rollup job:** No hourly `billing-rollup` BullMQ queue job (queue itself is missing — see §5 above).
4. **Reconciliation job:** No `billing-reconciliation` queue or job implementation.
5. **Monthly partitioning:** Prisma schema has annotation comments but actual `PARTITION BY` DDL must be confirmed in raw SQL migrations.

---

## 13. AI Platform — §8

**Requirement:** ProviderAdapter interface; providers: OpenAI, Anthropic, Google, DeepSeek, OpenRouter. Prompt registry (versioned, immutable). Model registry. Token accounting (all 4 token types). Three-point guardrails (input/output/tool). RAG with pgvector HNSW. SSE streaming with 1s checkpoints. Eval framework CI-gated. PII handling (redact/flag/block). Per-tenant + per-workflow token budgets.

**What exists:**
- `ProviderAdapter` interface with OpenAI, Anthropic, Google, DeepSeek, OpenRouter ✅
- Fallback chains configurable ✅
- Prompt versioning (immutable once published, live alias) ✅
- Model registry (`ai_models` table, `AiModel` service) ✅
- `ModerationService` with PII/keyword/regex/content filters ✅
- Input + output guardrails in `AiRunLifecycleService` ✅
- `VectorSearchService` with pgvector + cosine similarity (`<=>`) ✅
- Chunking, embedding, RAG retrieval pipeline ✅
- `EvaluationService` + `RegressionGateService` ✅
- Per-tenant token budget checks ✅

**Gaps:**
1. **Tool guardrails (§8.5):** Allow-list enforcement for model-emitted tool calls not implemented in `AiRunLifecycleService`.
2. **Input guardrails skipped on streaming (§8.5):** `ai-runs-route.ts:74` explicitly skips input guardrails on the streaming path — direct violation.
3. **AI SSE checkpoint (§8.7):** Partial responses not persisted every ~1 second; no checkpoint-and-resume on streaming.
4. **Eval CI gate (§8.8):** `RegressionGateService` exists but its enforcement as a blocking CI gate (blocking `prisma migrate` or promotion) is not wired into `.github/workflows/`.
5. **Cached + tool-call token accounting (§8.4):** Only `prompt_tokens` and `completion_tokens` tracked; `cached_tokens` and `tool_call_tokens` missing.
6. **Per-workflow token ceiling (§8.10):** Default 100K per-run ceiling specified in arch; not confirmed enforced in `AiRunLifecycleService`.

---

## 14. Observability — §22

**Requirement:** Structured JSON logs (redaction at log shipper). Prometheus 13-month retention + Thanos/Mimir. OpenTelemetry (1% non-critical, 100% billing/auth/AI). `tenant_id` + `correlation_id` + `service_name` on all signals. PDBs on every deployment. Queue-depth HPA (BullMQ adapter). SLO dashboards + runbooks linked from alerts.

**What exists:**
- `shared-logger` with pino structured JSON + redact list ✅
- OpenTelemetry instrumentation in `api-gateway` and `execution-service` ✅
- Prometheus `/metrics` endpoint via `shared-observability` ✅
- `tenant_id` + `correlation_id` injected via logger mixin ✅
- Correlation ID middleware in `api-gateway` ✅
- Grafana SLO dashboards at `infrastructure/observability/grafana-dashboards/` ✅
- Runbooks at `infrastructure/disaster-recovery/runbooks/` ✅

**Gaps:**
1. **PodDisruptionBudgets (critical — §21.2):** No PDB manifests found in `infrastructure/kubernetes/`. Required on every deployment.
2. **HPA queue-depth scaling (§21.2):** HPAs exist for `ai-service` and `execution-service` but scale on CPU only. Queue-depth HPA (BullMQ metrics adapter) not implemented.
3. **OTel sampling differentiation (§22):** No 1% vs 100% sampling logic for billing/auth/AI paths.
4. **Log redaction location (§22):** Redaction implemented at SDK/logger level, not at log shipper. Arch requires shipper-level redaction.
5. **Missing OTel in services:** `search-service`, `billing-service` and others lack instrumentation.
6. **`tenant_id` propagation:** Relies on `globalThis.__longoxTenantId` which is not consistently set via AsyncLocalStorage across all services.
7. **Runbook location:** Arch specifies `docs/runbooks/` (§22.1); runbooks are at `infrastructure/disaster-recovery/runbooks/`. Alerts cannot link correctly.

---

## Priority Remediation Order

### P0 — Direct ADR Violations (must fix before any production use)
| # | Gap | ADR/Section |
|---|---|---|
| 1 | Remove Typesense; add `tsvector` to Prisma; update search queries | ADR-010 |
| 2 | Implement 10 named BullMQ queues with correct priorities | ADR-001 / §11 |
| 3 | Fix checkpoint schema (`idempotency_key`, `compensation_status`, `retry_count`, `started_at`, `finished_at`) | §9.7 |
| 4 | Implement lease-based execution (acquire, renew every 60s, expire 5min) | §9.1 |
| 5 | Fix idempotency key to `workflow_id + run_id + node_id + attempt` | §9.1 |
| 6 | Fix error envelope to match §13.3 (`code`, `message`, `details`, `correlation_id`, `retry_after_seconds`, `documentation_url`) | §13.3 |
| 7 | Re-enable input guardrails on AI streaming path | §8.5 |

### P1 — Significant Functional Gaps
| # | Gap | Section |
|---|---|---|
| 8 | Add `billing-rollup` and `billing-reconciliation` queues + jobs | §11 / §16.2 |
| 9 | Add `notification-outbound`, `connector-install`, `audit-export`, `template-publish` queues | §11 |
| 10 | Redis cluster mode (3 primary + 3 replica) | §11.2 |
| 11 | Enforce child workflow nesting depth 5 | §9.6 |
| 12 | Implement child workflow `await: true` sync semantics | §9.6 |
| 13 | Enforce loop iteration caps (100 default, 10,000 Pro hard cap) | §9.2 |
| 14 | Implement 3-attempt `recovery_exhausted` → DLQ | §9.8 |
| 15 | Add `PodDisruptionBudget` manifests for every deployment | §21.2 |
| 16 | Add queue-depth HPA via BullMQ metrics adapter | §21.2 |
| 17 | Add Dashboard SSE endpoint + frontend integration | ADR-008 |
| 18 | Add Notification center SSE endpoint | ADR-008 |
| 19 | Unify SSE into single multiplexed connection (demux by `event_type`) | ADR-008 |
| 20 | Fix `EventSource` auth: use fetch-based polyfill or token-in-query-string | ADR-008 |
| 21 | Complete SCIM group→role mapping in auth-service | ADR-007 |
| 22 | Add cached + tool-call token metering | §8.4 / §16.1 |
| 23 | Implement tool guardrails (allow-list enforcement on model tool calls) | §8.5 |
| 24 | Implement AI streaming checkpoint every ~1 second | §8.7 |

### P2 — Compliance / Quality Gaps
| # | Gap | Section |
|---|---|---|
| 25 | Wire eval `RegressionGateService` into CI as blocking gate | §8.8 |
| 26 | Enforce `evt_` prefix in `createEvent`; make prefix mandatory in validator | §19.1 |
| 27 | Auto-dedup in EventBus via `consumer_offsets` | §19.3 |
| 28 | Fix `workflow.rolled-back` → `environment.rolled_back` (no hyphens) | §19.1 |
| 29 | Align `usage.recorded` vs `billing.usage.recorded` event type | §19.4 |
| 30 | Fix `billing-service` `maxCost` → `monthly_limit` column name alignment | §16 |
| 31 | Add Pact consumer-driven contract tests to CI | §21.3 |
| 32 | Add license check to PR CI stage | §21.3 |
| 33 | Replace Trivy FS scan with container image scan | §21.3 |
| 34 | Add migration dry-run (`prisma migrate deploy --dry-run`) to CI | §21.3 |
| 35 | Add 50% canary step to staging progressive rollout | §21.3 |
| 36 | Implement real canary analysis (error rate + latency) — remove placeholder | §21.3 |
| 37 | Add 1-approver/2-approver production gate by change type | §21.3 |
| 38 | Move Deno sandbox to in-process `deno_core` binding (eliminate subprocess) | ADR-009 |
| 39 | Wire Sigstore cold-start re-verification in connector sandbox | ADR-009 |
| 40 | Add OTel sampling: 1% default, 100% for billing/auth/AI paths | §22 |
| 41 | Add missing OTel instrumentation to `search-service`, `billing-service` | §22 |
| 42 | Move `AsyncLocalStorage` pattern for `tenant_id` propagation across all services | §22 |
| 43 | Add `schema.graphql` + `openapi.yaml` to `auth-service` and `execution-service` | §24.2 |
| 44 | Add `README.md` to all service directories | §24.2 |
| 45 | Align `execution-service` internal structure to `domain/application/infrastructure/api` | §24.2 |
| 46 | Add `tools/`, `shared-testing`, `event-bus` to monorepo | §24.1 |
| 47 | Confirm `node_execution_checkpoints` partitioning in raw SQL migrations | §10.2 |
| 48 | Move runbooks to `docs/runbooks/` (not `infrastructure/`) | §22.1 |
| 49 | Add approval escalation chain + reminders to approval gate | §9.5 |
| 50 | Idempotency key centralized at gateway (not per-service) | §12 |

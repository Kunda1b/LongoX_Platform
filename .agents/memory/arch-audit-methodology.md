---
name: Architecture audit methodology
description: How to run and record architecture compliance audits for LongoX against architecture.md v2.1
---

## Pattern

Dispatch 14 parallel `subagent({ config: { $kind: 'explore' } })` calls, one per domain:

1. Build & CI (§21.3) — ci.yml, cd.yml
2. Monorepo Structure (§24) — ls packages/ services/ apps/ tools/
3. Workflow Engine (§9) — schema.prisma NodeExecutionCheckpoint, dag-runner.ts, dag-worker.ts
4. Queue Topology (§11) — packages/shared-queue/src/index.ts, Terraform/Helm Redis config
5. API Gateway (ADR-006) — kong.yaml, api-gateway/src/middleware/
6. Auth & Identity (ADR-007) — auth-service/src/, packages/shared-auth/
7. Search (ADR-010) — search-service/src/infrastructure/, schema.prisma SearchIndex
8. Connector Sandbox (ADR-009) — packages/connector-sandbox/, packages/sandbox-runtime/
9. AI Platform (§8) — ai-service/src/, ai-run-lifecycle.service.ts, token-accounting.service.ts
10. Event Schema (§19) — packages/shared-events/src/index.ts, packages/event-bus/
11. Observability (§22) — search-service/telemetry/, billing-service/telemetry/, shared-logger/, docs/runbooks/
12. Billing & Metering (§16) — billing-service/src/, metering-service/src/, packages/shared-queue/
13. SSE / Realtime (ADR-008) — packages/shared-realtime/, api-gateway/src/routes/execution-stream.ts
14. GDPR / Infrastructure — compliance-service/, infrastructure/terraform/modules/redis/, packages/shared-gateway/

## Output format

Results feed directly into `docs/IMPLEMENTATION_MATRIX.md` — the authoritative live source of truth.

## Counting rules (critical)

- Open Gaps Summary ❌ table must have exactly N numbered rows where N matches the heading "N items".
- Open Gaps Summary 🟡 table same rule.
- Do NOT use footnote-level deduplications to reconcile mismatches — merge duplicate rows into one row instead.
- Frontend 🟡 rows (design system migration, dashboard grid library, app surface population) are product-completeness items and excluded from compliance gap counts.
- Cross-section duplicates (same gap in multiple matrix sections) count once in the summary.

## What resolved in each import round

- docs/IMPLEMENTATION_MATRIX.md Fix History section records each batch.
- 2026-07-05 import: ~25 items moved to ✅; remaining 32 ❌ + 31 🟡 = 63 unique compliance gaps.

**Why:** Future audits need the same structure and counting discipline to produce a trustworthy matrix. The footnote-dedupe anti-pattern caused a code review failure on 2026-07-05.

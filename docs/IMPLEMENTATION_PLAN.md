# LongoX Architecture Implementation Plan

## Summary

This implementation plan translates `architecture.md` v2.1 and the current codebase audit into an executable project roadmap. The current platform has a substantial monorepo, service, schema, frontend, connector, AI, billing, and infrastructure foundation, but it is not yet production-complete or architecture-compliant.

The architecture document is the source of truth. Accepted ADR decisions are mandatory implementation targets: Kong for the API gateway, WorkOS for identity, SSE for realtime updates, Deno isolates for connector sandboxing, PostgreSQL FTS for search, JSON Patch for workflow diffs, and 13M hot + 7Y cold retention for run history.

Execution should begin with repository stabilization so all later work lands on a buildable, testable baseline. After that, implementation should follow the architecture roadmap: core platform, distribution and monetization, AI and promotion, enterprise scale, and global resilience.

## Key Implementation Changes

### 0. Stabilize The Repository First

- Fix root typechecking by adding the missing `packages/api-zod/tsconfig.json`, validating workspace package references, and making `pnpm run typecheck` complete successfully.
- Remove stale `autoflow` and `flowbuilder` references from CI/CD, package checks, infrastructure, Helm, deployment metadata, and documentation where they conflict with LongoX.
- Add baseline test infrastructure for unit tests, integration tests, API contract tests, and Playwright smoke tests.
- Make CI fail on typecheck, lint, contract generation, tests, and build.
- Remove non-critical `|| true` checks from required CI gates.
- Add a tracked implementation matrix that maps architecture requirements to status: implemented, partial, missing, and verified.

### 1. Source-Control The Architecture Contracts

- Convert the REST API reference from Section 13 of `architecture.md` into a complete OpenAPI 3.1 spec at the API gateway boundary.
- Generate and commit TypeScript API clients and shared request/response types from OpenAPI.
- Convert the GraphQL SDL excerpt from Section 14 into a real gateway GraphQL schema with generated TypeScript resolver and client types.
- Convert the PostgreSQL schema catalog from Section 10 into the canonical database schema required by the architecture.
- Add missing architecture tables and fields, including `workflow_diffs`, `environment_releases`, `tenant_settings`, `usage_rollups`, `token_budgets`, RAG tables, and AI evaluation tables.
- Use Prisma as the long-term canonical schema and migration layer because Section 29.2 explicitly calls for it.
- Keep Drizzle only as a temporary compatibility layer until services are migrated or the architecture is formally amended.

### 2. Core Platform: Auth, Gateway, Workflow, Execution

- Provision Kong Gateway in dev using DB-less GitOps configuration.
- Route auth, workflow, execution, AI, billing, search, connector, dashboard, template, marketplace, audit, metering, and replication APIs through Kong.
- Add Kong plugins for JWT/session validation, rate limiting, correlation IDs, request logging, Prometheus metrics, and versioned `/api/v1` routing.
- Replace custom production identity flows with WorkOS AuthKit for login, MFA, SSO, Admin Portal, and SCIM directory sync.
- Keep local password login only for development and test fixtures.
- Complete RBAC enforcement across API routes, workflow actions, dashboard preview, connector install, billing, audit, and tenant administration.
- Upgrade the workflow engine to architecture-compliant DAG execution with bounded loops, node leases, idempotency keys, retries, checkpoint/resume, saga compensation, child workflows, and human approval pause/resume.
- Persist workflow version diffs as JSON Patch in `workflow_diffs`.
- Add semantic diff rendering for node moved, node renamed, node config changed, and edge rewired.
- Implement SSE execution monitoring through the gateway using multiplexed streams for execution, node, approval, retry, and DLQ events.

### 3. Frontend Product Completion

- Complete the Next.js app surfaces defined in Section 7: workflow list/detail/editor, execution monitor, connector marketplace, billing console, audit/compliance, AI console, environment promotion, dashboard builder, and tenant settings.
- Bootstrap the design system with architecture tokens and primitives: Button, Input, Dialog, Tabs, Tooltip, AppShell, data table, forms, empty states, and charts.
- Replace stub UI and dashboard packages with real components connected to generated API clients.
- Complete the workflow builder UX for validation, publish, version history, semantic diff, promotion, execution status, approval tasks, retry, and DLQ workflows.
- Complete dashboard builder preview, permissions, datasource binding, widget catalog, query execution, and safe draft publishing.

### 4. Connectors, Marketplace, Templates

- Replace the current unsafe sandbox implementation with Deno isolates per ADR-009.
- Enforce op-table capabilities, CPU limits, memory limits, execution timeouts, network allowlists, secrets isolation, and audit logging inside the sandbox.
- Port connector SDK APIs to Deno-compatible `fetch`, Web Streams, Web Crypto, and typed manifests.
- Complete connector lifecycle support: install, configure credentials, test connection, execute action, poll trigger, receive webhook trigger, upgrade, rollback, and uninstall.
- Add connector trust tiers, signed artifacts, manifest validation, permission scopes, and marketplace review/publish flows.
- Complete template registry install flows for workflow, dashboard, connector bundle, and AI starter templates.
- Add dependency resolution and version pinning for template installs.

### 5. AI, RAG, Search, And Promotion

- Implement the AI run lifecycle from Section 8: guardrails, provider routing, token accounting, prompt versioning, evaluation gates, cost budgets, moderation, PII handling, and audit events.
- Add pgvector-backed RAG with knowledge bases, documents, chunking, embeddings, vector search, citations, and metered RAG queries.
- Add AI evaluation datasets and evaluation runs.
- Block prompt promotion when evaluation regression thresholds fail.
- Replace Typesense and `ilike` fallback search behavior with PostgreSQL FTS per ADR-010.
- Add generated `tsvector` columns, GIN indexes, ranking, filters, tenant scoping, and permission-aware search result shaping.
- Complete environment promotion with `environment_releases`, approval policy, artifact checksums, diff review, rollback, and audit trails.

### 6. Billing, Metering, Compliance, Retention

- Make metering append-only and idempotent across workflow executions, node runs, AI tokens, RAG queries, connector calls, dashboard queries, and marketplace installs.
- Add daily and monthly usage rollups.
- Add invoice-line traceability from raw usage events to invoice rows.
- Complete Stripe subscription, checkout, portal, webhook reconciliation, invoice status sync, plan entitlement enforcement, overage handling, and enterprise commitments.
- Implement run-history retention per ADR-012: default 13M hot + 7Y cold, Enterprise 24M/36M hot options, tenant setting, partition management, archive export to Parquet, and cold-query path.
- Harden compliance flows for GDPR export/delete, audit export, evidence retention, security incident audit trails, and data residency controls.

### 7. Enterprise Infrastructure And Operations

- Complete Terraform modules for dev, staging, and production: networking, Kubernetes, Postgres, Redis, object storage, Vault/secrets, observability, Kong, WorkOS configuration, and backup storage.
- Complete Helm and Kubernetes deployment for all services, including `replication-service`, workers, schedulers, migrations, health probes, autoscaling, network policies, and secrets.
- Implement tenant tiers from Section 6: shared, dedicated namespace, and dedicated cluster.
- Add tenant placement policy and tenant migration workflow.
- Implement observability dashboards and alerts for architecture SLOs: gateway, auth, workflow publish, execution latency, AI latency, billing, search, queues, errors, and saturation.
- Implement backup/restore rehearsals, release rollback, DR runbooks, active-passive failover drills, and regional execution pool readiness.

## Public APIs / Interfaces / Types

- REST API becomes OpenAPI 3.1 generated and versioned under `/api/v1`.
- GraphQL schema becomes real and generated from the gateway schema file.
- Database schema becomes architecture-complete with Prisma migrations as the canonical migration target.
- Workflow graph contracts must include version checksum, JSON Patch diff storage, node retry policy, compensation handler, approval node metadata, child workflow references, and environment promotion metadata.
- Event envelopes must follow Section 19 mandatory fields and versioning rules for workflow, execution, connector, AI, billing, audit, search, and platform events.
- Connector manifests must include permissions, trust tier, runtime capabilities, auth model, action/trigger schemas, version, artifact signature, and sandbox policy.
- AI run APIs must expose guardrail result, token usage, cost, model/provider, prompt version, RAG citations, trace ID, and SSE stream ID.

## Test Plan

- Add architecture verification tests from Appendix D as required acceptance coverage.
- Add unit tests for workflow graph validation, DAG scheduling, retry/idempotency, JSON Patch diff generation, RBAC checks, metering aggregation, search ranking, guardrail decisions, and connector manifest validation.
- Add integration tests for auth login/MFA, workflow publish/run/retry, human approval pause/resume, saga compensation, connector install/action/trigger, AI run/RAG/evaluation gate, billing rollup/invoice traceability, and tenant isolation.
- Add contract tests for OpenAPI generation, API client compatibility, GraphQL schema generation, standard error envelope, and event schema validation.
- Add E2E tests for frontend workflow builder publish/run/monitor, environment promotion diff/approve/rollback, marketplace install, billing console, audit search, and dashboard preview.
- Add security tests for sandbox escape attempts, tenant data isolation, RBAC denial paths, secrets access boundaries, webhook signature validation, and SCIM membership sync.
- Add operational rehearsals for backup restore, release rollback, queue recovery, worker crash recovery, failover drill, retention archive, and cold query.

## Rollout Order

1. Milestone A: repo builds, CI gates are real, contracts are generated, and the dev environment boots.
2. Milestone B: Kong, WorkOS, auth, workflow, and execution work end-to-end in dev.
3. Milestone C: workflow engine, SSE monitoring, diff storage, and frontend builder meet Appendix D workflow checks.
4. Milestone D: connectors, marketplace, templates, Deno sandbox, billing, and metering support the first paid customer path.
5. Milestone E: AI, RAG, search, and promotion are architecture-complete with evaluation gates and cost controls.
6. Milestone F: compliance, retention, tenant tiers, observability, DR, and production infrastructure satisfy enterprise launch criteria.

## Assumptions

- `architecture.md` v2.1 is the source of truth when it conflicts with the current implementation.
- Accepted ADRs are mandatory: Kong, WorkOS, SSE, Deno isolates, PostgreSQL FTS, JSON Patch diffs, and 13M hot + 7Y cold retention.
- Prisma is the target canonical schema and migration layer because Section 29.2 explicitly calls for it.
- Implementation should be incremental and compatibility-preserving where possible, but architecture conformance wins over preserving partial shortcuts.
- No production launch should occur until root typecheck, required tests, OpenAPI generation, GraphQL generation, migrations, and CI/CD gates are green.
- `docs/IMPLEMENTATION_PHASES.md` remains historical planning context until it is explicitly replaced or deprecated.

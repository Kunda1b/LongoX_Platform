# Implementation Phases

Phased execution plan aligned with `architecture.md` Engineering Roadmap (v1.0).

## Status legend

- `[x]` Complete for this phase
- `[~]` In progress
- `[ ]` Not started

---

## Phase 1 — Core platform

**Goal:** Auth, RBAC, workflows, builder, execution, basic observability.

### 1.1 Monorepo & API contracts

- [~] Consolidate `api-spec` / `api-zod` under `packages/` (canonical per architecture)
- [ ] Resolve `@autoflow/web` package name collision (`apps/web` vs `artifacts/flowcraft`)
- [ ] Document Drizzle as ORM (architecture references Prisma — implementation uses Drizzle)

### 1.2 Frontend (`apps/web`)

- [~] Configure `@autoflow/api-client-react` with auth token + API base URL
- [~] Auth guard on dashboard routes
- [~] Replace mock pages with API-backed feature modules:
  - Dashboard overview
  - Workflows list + detail
  - Executions list + detail
  - Workflow builder (React Flow + `workflow-canvas`)
- [ ] Wire remaining routes (connectors, billing, settings, admin surfaces)
- [ ] Implement `features/*` domain modules (not placeholder exports)
- [ ] Add `apps/web` tests directory

### 1.3 Backend runtime

- [ ] Extract production routes from `artifacts/api-server` into `services/*`
- [ ] Wire `services/api-gateway` as reverse proxy to bounded contexts
- [ ] Replace in-memory `JobQueue` with Redis + BullMQ
- [ ] Shared request lifecycle: auth → tenant → RBAC → validate → execute → events → telemetry
- [ ] GraphQL entry on workflow-service (architecture) or document gateway-only GraphQL

### 1.4 Shared packages

- [ ] `shared-rbac` — DB-backed policy checks
- [ ] `shared-testing` — test fixtures and helpers
- [ ] `shared-observability` — trace propagation + structured logging in API gateway
- [ ] `event-bus` alias or package split from `shared-events`

### 1.5 Exit criteria

- User can log in, list/create/edit workflows in `apps/web`, run workflows, monitor executions
- API contracts generated from single OpenAPI source
- CI typecheck + lint green

---

## Phase 2 — Distribution and monetization

**Goal:** Marketplace, templates, billing, metering, connector SDK.

- [ ] Flesh connector packages (`actions/`, `triggers/` implementations)
- [ ] Connector install/review flow end-to-end
- [ ] Template registry publish/install
- [ ] Billing aggregation + invoice generation
- [ ] Metering event pipeline
- [ ] Populate `apps/marketplace` or fold into `apps/web` with architecture alignment
- [ ] Connector SDK documentation and versioning

---

## Phase 3 — AI and promotion

**Goal:** AI runtime, prompt governance, environment promotion.

- [ ] Deploy `ai-service` with provider routing and token accounting
- [ ] Prompt versioning and approval gates
- [ ] Environment promotion (`environment_releases` table + promotion API)
- [ ] `agent-runtime` LLM integration
- [ ] AI playground wired in `apps/web`

---

## Phase 4 — Enterprise scale

**Goal:** Multi-region, DR, dedicated isolation, compliance.

- [ ] Multi-region deployment overlays (staging/prod)
- [ ] `shared-region` routing in API gateway
- [ ] Audit service: append-only writes, export, retention
- [ ] Search service: denormalized index pipeline
- [ ] `apps/admin` internal operations portal
- [ ] Vault-backed secrets (`shared-vault`) in production path

---

## Phase 5 — Global readiness

**Goal:** Active-active multi-region, global failover SLAs.

- [ ] Regional failover runbooks
- [ ] Cross-region read replicas
- [ ] DR drills and RTO/RPO validation

---

## Current focus

**Phase 1.1–1.2** — API contract consolidation and wiring `apps/web` to the live API with real workflow builder UI.

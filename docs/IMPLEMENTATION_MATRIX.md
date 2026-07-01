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
| **Database** | Drizzle schema | ✅ | 50 tables defined in `packages/shared-db/src/schema/` |
| | Prisma as canonical schema | ❌ | Not implemented; project still on Drizzle per ADR pending |
| | Architecture-complete schema | ✅ | 10 new tables added: workflow_diffs, environment_releases, tenant_settings, usage_rollups, token_budgets, RAG tables (knowledge_bases, documents, chunks), AI eval tables (datasets, runs) |
| **Auth** | JWT auth | ✅ | Basic email/password in auth-service |
| | WorkOS SSO/MFA | ❌ | Not implemented per ADR-007 |
| | RBAC enforcement | ✅ | Shared RBAC package with 70+ permissions, 7 roles, authorization middleware |
| **API Gateway** | Kong gateway | ❌ | Not provisioned per ADR-006; Express-based gateway in use |
| | Versioned API routing | 🟡 | `/api/v1` prefix used but no Kong configuration |
| **Workflow Engine** | DAG execution | ✅ | Topological sort, executors, retry, checkpoint |
| | Bounded loops | ❌ | Not implemented |
| | Node leases | ❌ | Not implemented |
| | Saga compensation | ❌ | Not implemented |
| | Child workflows | ❌ | Not implemented |
| | Human approval pause/resume | 🟡 | Approval node type exists in execution-service; pause/resume not fully tested |
| | JSON Patch diffs | ❌ | Not implemented per ADR-005/011 |
| | Semantic diff rendering | ❌ | Not implemented |
| **Realtime** | SSE monitoring | 🟡 | Basic SSE hub exists in shared-realtime; no multi-instance pub/sub |
| **Executions** | Full execution lifecycle | ✅ | Production-ready in execution-service with BullMQ + Redis |
| | Dead-letter queue | ✅ | DLQ management implemented |
| | Retry with backoff | ✅ | Per-node retry with configurable attempts |
| **Connectors** | Connector runtime | ✅ | 11 connectors; runtime with auth, actions, triggers |
| | Deno sandbox | ❌ | Uses insecure `new Function()` per ADR-009 pending |
| | Marketplace lifecycle | ✅ | Install, configure, upgrade, remove all implemented |
| **AI Platform** | Multi-provider routing | ✅ | 7 providers; AI router with strategies |
| | Prompt registry | ✅ | Versioned prompts with publish flow |
| | RAG (pgvector) | ❌ | Vector search service exists but no pgvector schema |
| | AI evaluation | 🟡 | Evaluation framework exists but missing eval datasets and run tables |
| | Guardrails & moderation | ✅ | Moderation service implemented |
| | Token accounting | ✅ | Token tracking and budgets |
| **Search** | PostgreSQL FTS | 🟡 | Search service uses ilike; tsvector/GIN not implemented for ADR-010 |
| | Typesense integration | ✅ | Typesense client configured |
| **Billing** | Stripe integration | ✅ | Checkout, subscriptions, webhooks, invoices |
| | Usage metering | ✅ | Usage events with rollups |
| | Plan entitlements | 🟡 | Plans defined but enforcement not fully tested |
| **Infrastructure** | Terraform | ✅ | Modules for Vault, Redis, Postgres, EKS, networking, monitoring |
| | Kubernetes manifests | ✅ | All 18 services have base K8s manifests |
| | Helm chart | 🟡 | Renamed to longox; needs expansion beyond api-gateway + worker |
| | Observability (Grafana/Prometheus/OTel) | ✅ | Dashboards, datasources, OTel collector configured |
| | Docker Compose | ✅ | Dev and distributed compose files |
| **Frontend** | Design system | 🟡 | 3 components (Button, Card, Badge); 10+ missing (Dialog, Tabs, Tooltip, Input, etc.) |
| | Workflow builder UX | 🟡 | Workflow-canvas package exists; not fully connected |
| | Dashboard builder | ❌ | Not implemented |
| | App surfaces | 🟡 | app/web exists but many pages are stubs |
| **Retention** | 13M hot + 7Y cold | ❌ | Not implemented per ADR-012 |
| **Multi-tenancy** | Tenant tiers (shared/dedicated namespace/dedicated cluster) | ❌ | Tenant model exists but no tier enforcement |
| **Compliance** | GDPR export/delete | ❌ | Not implemented |
| | Audit export | ❌ | Not implemented |

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Implemented and verified |
| 🟡 | Partially implemented |
| ❌ | Missing or not started |

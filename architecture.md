# Full-Stack Architecture Design Document

**Workflow Automation Engine + Low-Code Internal Tools Platform**
Version 1.0 — Blueprint for Implementation, Investor Review, and Technical Due Diligence

---

## Document Control

| Field | Value |
|---|---|
| Document title | Full-Stack Architecture Design Document |
| Version | 1.0 |
| Primary scope | Workflow automation engine, low-code app builder, AI platform, marketplace, billing, and enterprise operations |
| Intended use | Implementation planning, design review, investor diligence, technical review, and onboarding |
| Status | Draft for engineering execution |
| Owner | Platform Architecture Team |
| Reviewers | Frontend, Backend, DevOps, Security, Data, Product |
| Next revision trigger | Architecture decisions, API changes, or platform scope expansion |

Revision policy: changes that affect runtime behavior, schemas, public APIs, deployment topology, security model, or billing semantics require a new reviewed revision.

---

## Executive Summary

This document defines the target architecture for a multi-tenant SaaS platform that combines workflow automation, low-code internal tooling, AI-assisted automation, connector distribution, billing, and enterprise deployment controls.

The platform is organized around a clear separation between:
- **Control plane** — manages metadata, permissions, billing, and design-time artifacts
- **Execution plane** — runs workflows, processes webhooks, evaluates AI nodes, and executes connector actions

**Design principles:**
- Control plane APIs must be deterministic and auditable
- Execution must be idempotent, retry-safe, and observable
- Tenancy, billing, and authorization are first-class platform concerns, not add-ons
- Frontend and backend contracts must be versioned and validated at build time whenever possible

---

## Product Vision & Strategic Goals

| Strategic Goal | Meaning | Primary Metric |
|---|---|---|
| Reduce time to automation | Enable business teams to ship workflows and dashboards quickly | Median time from idea to first production execution |
| Support enterprise adoption | Meet security, tenancy, billing, and audit requirements | Enterprise conversion rate and security review pass rate |
| Create platform leverage | Reuse workflows, templates, connectors, and UI components across tenants | Template reuse ratio and connector install rate |
| Enable AI-native automation | Make AI nodes and assistant flows a core primitive | AI node adoption and token efficiency |
| Scale globally | Design for regional expansion and data residency | Uptime, latency, and regional deployment readiness |

---

## Platform Scope

**In scope:**
- Workflow orchestration, dashboard creation, connector marketplace, AI nodes
- Usage billing, RBAC, environment promotion, templates, observability
- Multi-region deployment patterns, self-serve and enterprise workflows
- Sandboxing, approval gates, and audit trails

**Out of scope for v1.0:**
- General-purpose application code hosting, arbitrary user-defined compute without sandboxing
- Full BI warehouse functionality
- Cross-cloud active-active multi-master write semantics
- Custom on-prem runtime binaries outside the supported deployment model

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend Apps (Next.js): Portal • Builder • Admin • Marketplace     │
├─────────────────────────────────────────────────────────────────────┤
│ Control Plane: Auth • RBAC • Metadata • Billing • Templates         │
├─────────────────────────────────────────────────────────────────────┤
│ Execution Plane: Scheduler • Workers • AI Runtime • Webhooks        │
├─────────────────────────────────────────────────────────────────────┤
│ Data/Infra Plane: PostgreSQL • Redis/BullMQ • Vault • Object Store  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## C4 Architecture

### C4 Level 1 — System Context

```
Users ──> Web App ──> Platform APIs ──> External Systems
                   │          │
                   │          ├──> Identity Provider
                   │          ├──> Payment Processor
                   │          ├──> LLM Providers
                   │          └──> Storage/Monitoring Services
```

### C4 Level 2 — Container Model

| Container | Responsibilities | Technology |
|---|---|---|
| Web App | Portal, builder, dashboards, marketplace UI, admin console | React, TypeScript, Vite |
| API Gateway | Routing, auth enforcement, throttling, request shaping | Express 5, Node.js |
| Auth Service | Login, session issuance, MFA, SSO orchestration | Auth provider integration |
| Workflow Service | Workflow metadata, versions, publishing, validation | API service |
| Execution Service | Workflow runtime, trigger processing, state transitions | Worker service + BullMQ |
| Connector Service | Connector catalog, versions, installs, secrets binding | API service |
| Billing Service | Usage aggregation, invoicing, entitlements | API + job processor |
| Template Service | Template publish/install/search workflows | API service |
| AI Orchestrator | Prompt execution, provider abstraction, token tracking | Worker/API hybrid |
| Data Layer | Persistent storage and cache | PostgreSQL, Redis, object storage |

### C4 Level 3 — Component Model

Each service decomposes into domain components with strict interfaces:
- **Workflow service**: versioning, validation, persistence, graph normalization, publish orchestration
- **Execution service**: trigger ingestion, scheduling, run state, checkpointing, retries, event emission

### C4 Level 4 — Code Boundaries

Enforced at the monorepo package level. Shared type contracts, SDKs, and UI primitives live in packages that are dependency-safe and version-aware. Services own their business logic and database migrations.

---

## Control Plane vs Execution Plane

| Aspect | Control Plane | Execution Plane |
|---|---|---|
| Primary concern | Consistency, governance, configuration | Latency, throughput, resilience |
| State model | Authoritative metadata and version history | Run-time state and checkpoints |
| Failure tolerance | Strong auditability and recoverability | Retries, idempotency, dead-lettering |
| Scaling pattern | Stateless API scaling with relational persistence | Worker pools and queue-based horizontal scaling |
| User-facing impact | What can be built and who can do it | Whether the build actually runs |

---

## Frontend Architecture

### Route Map

| App / Route Group | Purpose | Key concerns |
|---|---|---|
| /login, /signup, /invite | Authentication and onboarding | SSO, MFA, validation, session bootstrap |
| /workflows/* | Workflow authoring and lifecycle | Canvas performance, versioning, publish actions |
| /executions/* | Run monitoring and drill-down | Live updates, logs, checkpoints |
| /builder/* | Dashboard creation and preview | Grid layout, bindings, responsive rendering |
| /marketplace/* | Connector and template discovery | Search, install, trust signals |
| /billing/* | Usage and subscriptions | Entitlements, invoices, plans |
| /admin/* | Platform administration | Tenant support, policies, feature flags |

### Component Hierarchy

```
AppShell
├─ GlobalNav
├─ TenantSwitcher
├─ EnvironmentSwitcher
├─ CommandPalette
├─ NotificationCenter
├─ WorkspaceLayout
│  ├─ Sidebar
│  ├─ Topbar
│  └─ ContentRegion
├─ WorkflowModule
│  ├─ WorkflowList
│  ├─ WorkflowEditor
│  │  ├─ Canvas (CanvasViewport)
│  │  ├─ NodePalette
│  │  ├─ InspectorPanel / PropertyPanel
│  │  ├─ ValidationRail
│  │  └─ VersionHistory
│  └─ RunMonitor
├─ DashboardModule
│  ├─ DashboardList
│  ├─ DashboardStudio
│  │  ├─ GridCanvas (12-column)
│  │  ├─ WidgetLibrary
│  │  ├─ BindingPanel
│  │  ├─ PreviewPane
│  │  └─ ThemePanel
│  └─ DashboardPreview
└─ MarketplaceModule
   ├─ CatalogSearch
   ├─ ItemDetails
   ├─ InstallWizard
   └─ TrustPanel
```

### State & Rendering Strategy

- React Query for server state; Zustand for local editor and ephemeral interaction state
- Editor uses normalized entities for nodes, edges, groups, annotations
- Runtime preview consumes a frozen serializable definition (not the editable draft)
- Forms use schema validation and typed field metadata
- Accessibility is a release gate: keyboard navigation, focus management, contrast compliance

### Design System Layers

| Layer | Examples | Decision |
|---|---|---|
| Tokens | Color, spacing, typography, radius, shadow | Central source of truth with semantic aliases |
| Primitives | Button, Input, Dialog, Tabs, Tooltip | Composable components built for reuse |
| Composition | Panels, drawers, accordions, tables | Business-safe patterns with predictable structure |
| Data visualization | Chart cards, KPI blocks, sparklines | Consistent chart wrapper and label language |
| Builder visuals | Canvas grid, node cards, resizers | High-density interaction patterns |

---

## Workflow Builder Architecture

- **Node model**: stable client identifier, server identifier, type, config schema, input/output handles, runtime mapping
- **Edge model**: directional, typed, validated against node input/output contracts
- **Canvas interactions**: pan, zoom, snap, drag, marquee select, keyboard shortcuts, minimap
- **Versioning**: drafts are separate from published versions; publish creates an immutable version record
- **Validation**: schema checks, cycle detection, required parameter checks, environment policy enforcement

### Canvas Subsystems

| Subsystem | Responsibilities | Implementation notes |
|---|---|---|
| Viewport manager | Pan, zoom, fit, grid snapping, mini-map | Pure UI state; never persisted as workflow data |
| Selection engine | Single/group/lasso select, keyboard shortcuts | Transient and undoable |
| Node renderer | Type-specific node cards, ports, badges, overlays | Renders from schema data |
| Edge renderer | Bezier/orthogonal paths, routing, arrowheads | Supports live rerouting during drag |
| Inspector panel | Property forms, validation messages, secrets binding | Schema-driven forms |
| Validation engine | Cycle detection, required input, capability checks | Blocking vs warning issues |
| Graph normalizer | Canonical ordering, stable IDs, export serialization | Deterministic publish artifacts |
| Versioning layer | Draft save, publish snapshot, rollback reference | Immutable version records |
| Diff viewer | Graph changes, node moves, property edits | Review and approval |
| Runtime annotations | Last run status, execution counts, warning badges | Read-only overlay from execution data |

### Publishing Flow

```
Draft update -> validate -> save draft -> request publish
-> create immutable version -> record checksum -> emit audit event
-> optionally request environment promotion -> approval gate -> release record
-> live alias points to published version -> rollback switches alias back
```

### Node Taxonomy

| Node family | Examples | Execution model |
|---|---|---|
| Trigger | Webhook, schedule, poll, manual, event bridge | Starts a run and hydrates initial context |
| Transform | Map, format, merge, split, extract | Pure data shaping without side effects |
| Action | HTTP, connector action, database write, file upload | Side effects with retry and idempotency rules |
| Logic | If, switch, branch, loop, expression | Determines the next execution path |
| Human | Approval, review, task assignment, wait step | Pauses run and resumes on external event |
| AI | Prompt, classify, summarize, generate, embed | Provider abstraction and token billing |
| Utility | Delay, log, annotate, notify, debug | Operational support and observability |
| Boundary | Subworkflow, reusable component, exception handler | Modular graph reuse and isolation |

---

## Dashboard Builder Architecture

- 12-column responsive grid with data bindings, reusable widgets, permissions-aware visibility rules
- Widgets are schema-driven so their configuration can be stored, validated, and migrated
- Data sources are explicit: every widget binds to an API query, workflow output, dataset, or manual input
- Access control applies to both dashboard visibility and widget-level data access

### Widget Catalog

| Widget | Purpose | Notes |
|---|---|---|
| KPI card | Single metric, trend, delta, status | High-value summary data |
| Time series chart | Trend over time with comparators | Axis formatting and data density |
| Data table | Sorted and filtered records | Pagination, export, virtualization |
| Kanban board | State grouped cards | Drag/drop with workflow state mapping |
| Form panel | Input, submit, validate | Schema and permission aware |
| Map widget | Locations, clusters, heatmaps | Privacy and projection concerns |
| File widget | Uploads, attachments, previews | Storage and antivirus controls |
| AI insight card | Generated summary, explanation, next action | Provenance, token cost, reviewability |
| Audit feed | Recent platform or workflow events | Immutability and redaction |
| Task queue | Pending assignments and actions | Refresh and real-time updates |

---

## Connector Marketplace Architecture

| Marketplace object | Description | Lifecycle |
|---|---|---|
| Connector listing | Public metadata about an integration package | Draft → reviewed → published → deprecated |
| Connector version | Immutable implementation and manifest | Built → signed → released → revoked |
| Installation | Tenant-scoped deployment of a connector | Installed → configured → active → retired |
| Bundle | Grouped connectors or solution pack | Created → promoted → installed |
| Review record | Security and quality checks | Pending → approved → rejected |

### Connector SDK Specification

```json
{
  "name": "crm.contact.sync",
  "version": "1.0.0",
  "auth": ["oauth2", "api_key"],
  "actions": ["upsertContact", "findContact"],
  "triggers": ["contactUpdated"],
  "permissions": ["contacts.read", "contacts.write"]
}
```

- Manifest declares capabilities and permissions
- Action handlers are pure where possible and idempotent by contract
- Credential access occurs through tenant-scoped secret references, not inline secrets
- Connectors must expose structured errors and retry hints

---

## AI Platform Architecture

| AI component | Role | Controls |
|---|---|---|
| Model registry | Track provider, model name, context window, cost, and risk | Used by editors and runtime selection |
| Prompt registry | Versioned prompt assets and parameters | Supports review and promotion |
| Provider gateway | Uniform interface to external LLM vendors | Hides provider-specific differences |
| Token meter | Prompt and completion token tracking | Billing and analytics source |
| Guardrails | Content policy, tool allow-lists, redaction | Protects data and actions |
| AI analytics | Spend, latency, failure rate, model mix | Operational and financial insight |
| Fallback logic | Provider failover, model fallback, retry behavior | Availability and resilience |

### AI Run Flow

```
Prompt version -> context assembly -> policy check -> provider call
-> response parse -> token accounting -> checkpoint -> analytics event
```

---

## Workflow Engine Internals

### Execution Lifecycle

```
Trigger event -> Normalize payload -> Resolve workflow version
-> Load run context -> Execute node -> Persist checkpoint
-> Emit platform event -> Enqueue next node -> Complete or fail
```

- **Scheduler**: converts delayed, recurring, or event-triggered work into queue jobs
- **Worker**: fetches jobs, loads run state, evaluates the next node, and persists checkpoints
- **Checkpointing**: saves node-level progress to allow recovery after crash or timeout
- **Idempotency**: each step has a deterministic execution key and deduplication rule
- **Dead-letter handling**: failed runs can be inspected, replayed, or archived

---

## PostgreSQL Schema Catalog

| Table | Purpose | Key columns |
|---|---|---|
| tenants | Tenant root record | id, name, status, plan_id, region_policy |
| users | Authenticated users | id, tenant_id, email, status, last_login_at |
| memberships | User-to-tenant membership | user_id, tenant_id, role_id, invited_by |
| rbac_roles | Roles and role templates | id, tenant_id, name, scope |
| rbac_permissions | Permission catalog | id, code, description |
| role_permissions | Role grants | role_id, permission_id |
| workflows | Workflow identity and lifecycle | id, tenant_id, name, status, current_version_id |
| workflow_versions | Immutable workflow snapshots | id, workflow_id, version_number, graph_json, checksum |
| workflow_executions | Run-level state | id, workflow_version_id, status, trigger_type, started_at |
| node_execution_checkpoints | Checkpoint storage | execution_id, node_id, state_json, retry_count |
| connectors | Connector catalog entries | id, tenant_id or global scope, slug, trust_level |
| connector_versions | Connector release history | id, connector_id, semver, manifest_json |
| tenant_credentials | Bound secrets references | id, tenant_id, connector_id, secret_ref |
| dashboards | Dashboard metadata | id, tenant_id, title, layout_version, status |
| dashboard_versions | Immutable dashboard snapshots | id, dashboard_id, version_number, config_json |
| data_sources | Approved data sources | id, tenant_id, kind, config_json |
| templates | Template registry records | id, category, visibility, source_type |
| template_versions | Versioned templates | id, template_id, manifest_json, published_at |
| environments | Dev/staging/prod records | id, tenant_id, name, promotion_policy |
| environment_releases | Promotion history | id, environment_id, artifact_type, source_version_id |
| approval_tasks | Manual gate decisions | id, workflow_id, requester_id, approver_id |
| metering_events | Atomic usage events | id, tenant_id, event_type, quantity, occurred_at |
| ai_usage | AI-specific usage records | id, tenant_id, model_id, prompt_tokens, completion_tokens |
| billing_accounts | Billing profile records | id, tenant_id, provider_ref, status |
| invoices | Invoice headers | id, billing_account_id, period_start, period_end |
| invoice_lines | Invoice items | invoice_id, metric_code, quantity, unit_price |
| audit_logs | Security and admin audit records | id, actor_id, action, target_type, target_id |
| platform_events | Internal event ledger | id, event_type, aggregate_id, payload_json |
| webhook_deliveries | Webhook lifecycle | id, endpoint_id, status, retry_count |
| feature_flags | Runtime feature toggles | id, tenant_id, key, value_json |

---

## Redis & BullMQ Architecture

| Redis use case | Example | Notes |
|---|---|---|
| Job queues | workflow-execution, webhook-delivery, ai-run | Use distinct queues and priorities |
| Distributed locks | workflow publish lock, promotion lock | Prevent duplicate concurrent mutations |
| Rate limits | API key quotas, connector API throttles | Tenant-aware token buckets |
| Caches | schema metadata, permissions, template search | Short TTL and explicit invalidation |
| Session acceleration | JWT/session lookup, MFA state | Never treat cache as source of truth |

---

## REST API Reference (v1)

| Domain | Method | Path | Purpose | Auth |
|---|---|---|---|---|
| Auth | POST | /api/v1/auth/login | Create session | Public |
| Auth | POST | /api/v1/auth/logout | Terminate session | Session |
| Tenants | GET | /api/v1/tenants/me | Get current tenant profile | User |
| Users | GET | /api/v1/users | List tenant users | Admin |
| RBAC | GET | /api/v1/roles | List roles | Admin |
| RBAC | POST | /api/v1/roles | Create role | Admin |
| Workflows | GET | /api/v1/workflows | List workflows | User |
| Workflows | POST | /api/v1/workflows | Create workflow | Editor |
| Workflows | GET | /api/v1/workflows/{id} | Get workflow | User |
| Workflows | PUT | /api/v1/workflows/{id} | Update workflow | Editor |
| Workflows | POST | /api/v1/workflows/{id}/publish | Publish workflow version | Editor |
| Workflows | POST | /api/v1/workflows/{id}/clone | Clone workflow | Editor |
| Executions | GET | /api/v1/executions | List executions | User |
| Executions | GET | /api/v1/executions/{id} | Execution detail | User |
| Executions | POST | /api/v1/executions/{id}/retry | Retry failed run | Operator |
| Triggers | POST | /api/v1/triggers/webhook | Receive webhook | Signed |
| Connectors | GET | /api/v1/connectors | Search connectors | User |
| Connectors | POST | /api/v1/connectors | Create connector | Admin |
| Connectors | POST | /api/v1/connectors/{id}/install | Install connector | Editor |
| Templates | GET | /api/v1/templates | Browse templates | User |
| Templates | POST | /api/v1/templates | Publish template | Admin |
| Dashboards | GET | /api/v1/dashboards | List dashboards | User |
| Dashboards | POST | /api/v1/dashboards | Create dashboard | Editor |
| Dashboards | POST | /api/v1/dashboards/{id}/publish | Publish dashboard | Editor |
| Billing | GET | /api/v1/billing/usage | Usage summary | Billing admin |
| Billing | GET | /api/v1/invoices | List invoices | Billing admin |
| AI | POST | /api/v1/ai/runs | Execute AI request | User |
| AI | GET | /api/v1/ai/models | List models | User |
| Admin | GET | /api/v1/audit | Audit log search | Admin |
| Admin | POST | /api/v1/feature-flags | Set feature flag | Admin |

---

## RBAC Model

| Scope | Example role | Representative permissions |
|---|---|---|
| Platform | Super admin | Tenant support, policy management, global catalog moderation |
| Tenant | Workspace admin | Manage users, workflows, dashboards, billing settings |
| Environment | Release manager | Promote versions, roll back deployments, approve changes |
| Resource | Connector owner | Edit connector metadata, manage versions, publish release |
| Read-only | Viewer | Inspect workflows, dashboards, executions, and reports |

---

## Billing & Metering

- **Metered dimensions**: workflow executions, node executions, API calls, AI tokens, storage, marketplace installs, premium seats
- **Pricing model**: subscription base with usage-based overflow and optional enterprise commitments
- **Aggregation**: daily and monthly rollups with tenant- and environment-level attribution
- **Auditability**: every invoice line traceable back to raw metering events

---

## Environment Promotion System

```
Dev -> Staging -> Production
  |       |            |
  |       |            └─ rollback to prior approved version
  |       └─ integration validation and smoke tests
  └─ local authoring and preview
```

- Promotion is versioned, not mutable in place
- Rollback rebinds to a previously approved version
- Approval gates can require one or more reviewers depending on environment policy

---

## Security Threat Model

| Threat | Potential impact | Primary mitigation |
|---|---|---|
| Tenant breakout | Cross-tenant data exposure | Row-level tenant scoping, service enforcement, audit trails |
| Credential theft | External system compromise | Vault references, rotation, least privilege, masking |
| Queue poisoning | Unauthorized execution | Signed jobs, strict validation, queue segregation |
| Prompt injection | AI step misuse or data leakage | Tool restrictions, content filters, prompt provenance |
| Supply chain compromise | Malicious connector or template | Signing, review gates, provenance checks |
| Privilege escalation | Unauthorized admin actions | MFA, RBAC, break-glass controls, policy logs |
| Replay attack | Duplicate actions or charges | Idempotency keys, nonce validation, dedupe |
| Billing fraud | Artificial usage inflation | Append-only metering, reconciliation, anomaly detection |
| Denial of service | Floods on API or execution endpoints | Rate limits, quotas, backpressure, WAF |

---

## Kubernetes Deployment Architecture

**Namespace pattern:**
- `platform-control` — auth, workflow, connector, template, billing services
- `platform-execution` — execution workers, scheduler, AI orchestrator
- `platform-observability` — logs, metrics, traces
- `platform-enterprise-<tenant>` — dedicated enterprise isolation

**Workload pattern:**
- Deployments for APIs and frontend
- HorizontalPodAutoscalers for bursty services
- Jobs/CronJobs for batch tasks
- StatefulSets only for infrastructure components when self-managed

---

## CI/CD Pipelines

```
PR checks:     unit tests, static analysis, schema validation, dependency audit
Main checks:   build artifacts, container scan, migration dry run, API contract test
Release path:  PR -> tests -> build -> scan -> staging -> smoke -> canary -> production
Recovery path: snapshot -> restore -> verify -> rebind -> replay queued work -> announce recovery
```

---

## Observability Stack

| Signal | Examples | Why it matters |
|---|---|---|
| Logs | API events, worker exceptions, audit events | Forensics and debugging |
| Metrics | Latency, queue depth, error rate, token usage | SLOs and capacity planning |
| Traces | End-to-end request flow across services | Latency attribution and dependency mapping |
| Events | Workflow published, execution completed, template installed | Product analytics and billing |

---

## Multi-Region Strategy

- Region-aware tenant placement and data policy metadata
- Read locality for dashboards, catalogs, and low-risk metadata
- Execution locality for latency-sensitive or residency-constrained workflows
- Primary-region control with read replicas in v1.0; active-active in later phases

---

## Disaster Recovery

| Component | Backup strategy | Recovery target |
|---|---|---|
| PostgreSQL | Automated snapshots plus log shipping | Point-in-time recovery per service tier |
| Redis | Rebuildable cache; minimal persistence only where needed | Fast restart, no cache reliance |
| Object storage | Versioned artifacts and cross-region replication | Artifact restore and replay |
| Secrets/config | Encrypted backups and IaC reconstruction | Rapid redeploy |
| Queues | Drained or replayed from durable state | At-least-once recovery |

---

## Monorepo Structure (Target)

```
apps/
  web/          — main product frontend
  admin/        — platform admin console
  docs/         — developer documentation
services/
  auth-service/
  workflow-service/
  execution-service/
  marketplace-service/
  billing-service/
  ai-service/
packages/
  ui/            — shared design system
  sdk/           — connector and workflow SDK
  workflow-engine/
  shared-types/
  validation/
infrastructure/
  kubernetes/
  terraform/
  observability/
```

---

## Engineering Roadmap

| Phase | Focus | Deliverables |
|---|---|---|
| Phase 1 | Core platform | Auth, RBAC, workflows, builder, execution, basic observability |
| Phase 2 | Distribution and monetization | Marketplace, templates, billing, metering, connector SDK |
| Phase 3 | AI and promotion | AI runtime, prompt governance, environment promotion |
| Phase 4 | Enterprise scale | Multi-region, DR maturity, dedicated isolation, compliance hardening |
| Phase 5 | Resilience and global readiness | Active-active multi-region, global failover SLAs |

---

## Key Sequence Diagrams

### 1. Workflow Publish
```
Author -> Web App -> Workflow Service -> Validation -> PostgreSQL
-> Version snapshot -> Audit log -> Event bus -> Response
```

### 2. Workflow Execution
```
Trigger -> API Gateway -> Execution Service -> Queue
-> Worker -> Connector/AI step -> Checkpoint -> Next step -> Complete
```

### 3. Marketplace Install
```
User -> Marketplace UI -> Connector Service -> Install job -> Secret binding
-> Tenant config -> Policy check -> Installed state
```

### 4. Dashboard Preview
```
User -> Builder UI -> GraphQL API -> Layout resolver -> Data source adapter
-> Rendered preview -> Client
```

---

## Backend Request Lifecycle

| Stage | Input | Output / failure behavior |
|---|---|---|
| Authenticate | Bearer token, session cookie, or SSO assertion | Authenticated principal or 401/403 |
| Resolve tenant | Tenant header, tenant claim, invite token | Tenant context or tenant-scoped denial |
| Authorize | Principal, action code, resource id | Allow/deny with reason code |
| Validate | Payload schema and domain constraints | 422-style validation response |
| Execute | Command object, idempotency key, version token | State transition or conflict response |
| Emit events | Domain event payload, correlation id | Async consumers notified, retry on failure |
| Telemetry | Trace id, metrics labels, request metadata | Logs/traces/metrics persisted |

---

## Implementation Rules

### Backend
- Use optimistic concurrency for workflow draft updates and publish actions
- Use idempotency keys for connector installs, payments, AI runs, and webhook retries
- Return machine-readable error codes for all operational failures
- Log domain identifiers, correlation ids, and actor ids on every mutation

### Frontend
- Large editors must isolate local interaction state from global app state
- Error boundaries should protect the shell without hiding feature-level failures
- Any component that manipulates workflow or dashboard state should operate on normalized entities
- Data fetching must be centralized so cache invalidation and authorization rules remain consistent

### Execution
- Execution must be idempotent at the step level
- Checkpoint data must preserve enough to reconstruct a failed run after a worker crash
- Dead-letter routing must be reliable and inspectable

### Security
- No frontend code path should ever be the sole authority for authorization or tenancy decisions
- Secrets should be masked in logs, redacted in audit exports, and stored outside the relational core
- Defense in depth is mandatory — no single authorization check should be treated as sufficient

---

## Open Decisions (v1.0)

- Whether GraphQL subscriptions or SSE will be the default for execution monitoring
- Whether the first enterprise deployment pattern will be shared cluster isolation or dedicated namespace isolation
- Whether workflow diffs should be stored as JSON patches, graph deltas, or full snapshots only
- Whether connector code execution is hosted in-process, sandboxed workers, or WASM containers for v1.0

These decisions should be resolved during implementation planning and codified in the architecture decision log.

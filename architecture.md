# Full-Stack Architecture Design Document

**Workflow Automation Engine + Low-Code Internal Tools Platform**
Version 1.0 — Architecture Blueprint for Implementation, Investor Review, and Technical Due Diligence
**Audience:** Engineering, Product, Security, DevOps, and External Platform Partners

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

**Revision policy:** changes that affect runtime behavior, schemas, public APIs, deployment topology, security model, or billing semantics require a new reviewed revision. Version 1.0 establishes the baseline contract for engineering execution.

---

## Executive Summary

This document defines the target architecture for a multi-tenant SaaS platform that combines workflow automation, low-code internal tooling, AI-assisted automation, connector distribution, billing, and enterprise deployment controls. The goal is to provide a single reference that can guide engineering implementation, security review, platform planning, and investor diligence.

The platform is intentionally organized around a clear separation between **control plane** services that manage metadata, permissions, billing, and design-time artifacts, and **execution plane** services that run workflows, process webhooks, evaluate AI nodes, and execute connector actions. This separation keeps the product usable at small scale while preserving a path to enterprise-grade isolation and multi-region growth.

The implementation target is a production-grade system with opinionated but extensible patterns: Next.js for the frontend, a service-oriented backend built around APIs and event processing, PostgreSQL for system of record storage, Redis and BullMQ for asynchronous execution, Kubernetes for deployment, and a strongly typed connector and workflow SDK for ecosystem growth.

This blueprint is written for implementation readiness. It favors explicit boundaries, tables, interfaces, operational responsibilities, and failure handling over marketing language. Where the platform supports future expansion, the document identifies the immediate version 1.0 contract as well as the forward-compatible path.

- **Design principle:** control plane APIs must be deterministic and auditable.
- Execution must be idempotent, retry-safe, and observable.
- Tenancy, billing, and authorization are first-class platform concerns, not add-ons.
- Frontend and backend contracts must be versioned and validated at build time whenever possible.

---

## Product Vision & Strategic Goals

The product vision is to become the operating layer for internal automation and customer-facing workflow applications. Users should be able to design workflows, provision dashboards, publish reusable templates, package connectors, and run AI-enhanced automation without assembling a separate stack for each concern.

| Strategic Goal | Meaning | Primary Metric |
|---|---|---|
| Reduce time to automation | Enable business teams and operators to ship workflows and dashboards quickly | Median time from idea to first production execution |
| Support enterprise adoption | Meet security, tenancy, billing, and audit requirements | Enterprise conversion rate and security review pass rate |
| Create platform leverage | Reuse workflows, templates, connectors, and UI components across tenants | Template reuse ratio and connector install rate |
| Enable AI-native automation | Make AI nodes and assistant flows a core primitive | AI node adoption and token efficiency |
| Scale globally | Design for regional expansion and data residency | Uptime, latency, and regional deployment readiness |

The strategic model is to build the platform once and reuse it everywhere: internal operations, customer success, sales engineering, partner integrations, and industry-specific solution packs. The architecture therefore must balance generic primitives with strong product opinionation.

---

## Platform Scope and Non-Goals

**In scope:**
- Workflow orchestration, dashboard creation, connector marketplace, AI nodes
- Usage billing, RBAC, environment promotion, templates, observability
- Multi-region deployment patterns, self-serve and enterprise workflows
- Sandboxing, approval gates, and audit trails

**In scope:** both self-serve and enterprise-operable workflows, including sandboxing, approval gates, and audit trails.

**Out of scope for version 1.0:** general-purpose application code hosting, arbitrary user-defined compute without sandboxing, and full BI warehouse functionality.

**Out of scope for version 1.0:** cross-cloud active-active multi-master write semantics and custom on-prem runtime binaries outside the supported deployment model.

---

## System Architecture Overview

The architecture is divided into four major layers: the user experience layer, the control plane, the execution plane, and the data/infra plane. The user experience layer includes the customer portal, workflow builder, dashboard builder, admin console, and marketplace. The control plane includes identity, RBAC, metadata, templates, billing, and catalog services. The execution plane handles live workflow runs, AI invocation, webhooks, scheduler jobs, and connector execution. The data/infra plane contains PostgreSQL, Redis, object storage, secrets management, queue infrastructure, and observability backends.

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend Apps (Next.js): Portal • Builder • Admin • Marketplace     │
├─────────────────────────────────────────────────────────────────────┤
│ Control Plane: Auth • RBAC • Metadata • Billing • Templates         │
├─────────────────────────────────────────────────────────────────────┤
│ Execution Plane: Scheduler • Workers • AI Runtime • Webhooks        │
├─────────────────────────────────────────────────────────────────────┤
│ Data/Infra Plane: PostgreSQL • Redis/BullMQ • Vault • Object Store   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## C4 Architecture

### C4 Level 1 — System Context

At the system context level, the platform sits between end users, external systems, identity providers, payment providers, and model vendors. The platform acts as the orchestration and governance center, while external systems remain authoritative for their own domain data and events.

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
| Web App | Portal, builder, dashboards, marketplace UI, admin console | Next.js, React, TypeScript |
| API Gateway | Routing, auth enforcement, throttling, request shaping | Node.js or edge proxy |
| Auth Service | Login, session issuance, MFA, SSO orchestration | Auth provider integration |
| Workflow Service | Workflow metadata, versions, publishing, validation | API service |
| Execution Service | Workflow runtime, trigger processing, state transitions | Worker service + BullMQ |
| Connector Service | Connector catalog, versions, installs, secrets binding | API service |
| Billing Service | Usage aggregation, invoicing, entitlements | API + job processor |
| Template Service | Template publish/install/search workflows | API service |
| AI Orchestrator | Prompt execution, provider abstraction, token tracking | Worker/API hybrid |
| Data Layer | Persistent storage and cache | PostgreSQL, Redis, object storage |

### C4 Level 3 — Component Model

Each service is internally decomposed into domain components with strict interfaces. For example, the workflow service is split into versioning, validation, persistence, graph normalization, and publish orchestration. The execution service is split into trigger ingestion, scheduling, run state, checkpointing, retries, and event emission.

### C4 Level 4 — Code Boundaries

The code boundary is enforced at the monorepo package level. Shared type contracts, SDKs, and UI primitives live in packages that are dependency-safe and version-aware. Services own their business logic and database migrations. Frontend apps consume generated API clients and typed schema definitions rather than ad hoc request code.

---

## Control Plane vs Execution Plane

The control plane is responsible for authoring and governance. It includes authentication, authorization, design-time metadata, templates, marketplace listings, billing artifacts, and system configuration. The execution plane is responsible for live operations: running workflows, evaluating triggers, executing connector actions, running AI calls, and recording telemetry.

| Aspect | Control Plane | Execution Plane |
|---|---|---|
| Primary concern | Consistency, governance, configuration | Latency, throughput, resilience |
| State model | Authoritative metadata and version history | Run-time state and checkpoints |
| Failure tolerance | Strong auditability and recoverability | Retries, idempotency, dead-lettering |
| Scaling pattern | Stateless API scaling with relational persistence | Worker pools and queue-based horizontal scaling |
| User-facing impact | What can be built and who can do it | Whether the build actually runs |

---

## Frontend Architecture (Next.js)

The frontend is a modular Next.js application family with shared design tokens, shared data fetching patterns, and domain-specific route groups. The architecture assumes server components where they reduce client complexity, but preserves client-side state management for canvas editing, live previews, collaboration, and high-frequency interactions.

- Route groups map cleanly to product surfaces: auth, workflows, executions, dashboards, marketplace, billing, and admin.
- React Query handles server state; Zustand or equivalent handles local editor state and ephemeral interaction state.
- The UI layer talks to the API through typed clients and generated schema types to avoid drift.
- Realtime updates use websockets or SSE only where user value justifies it, such as execution monitoring and collaborative editing.

### Frontend application map

| App / Route Group | Purpose | Key concerns |
|---|---|---|
| /login, /signup, /invite | Authentication and onboarding | SSO, MFA, validation, session bootstrap |
| /workflows/* | Workflow authoring and lifecycle | Canvas performance, versioning, publish actions |
| /executions/* | Run monitoring and drill-down | Live updates, logs, checkpoints |
| /builder/* | Dashboard creation and preview | Grid layout, bindings, responsive rendering |
| /marketplace/* | Connector and template discovery | Search, install, trust signals |
| /billing/* | Usage and subscriptions | Entitlements, invoices, plans |
| /admin/* | Platform administration | Tenant support, policies, feature flags |

### Detailed React / Next.js component hierarchy

The component hierarchy is organized by page shells, domain modules, canvas primitives, form/rendering primitives, and utility layers. At the top level, a layout shell provides navigation, breadcrumbs, tenant context, environment selectors, and global command search. Each domain feature owns its own state hooks, query adapters, and view models.

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
│  │  ├─ Canvas
│  │  ├─ NodePalette
│  │  ├─ PropertyPanel
│  │  ├─ ValidationPanel
│  │  └─ VersionHistoryDrawer
│  └─ WorkflowRunViewer
├─ DashboardModule
│  ├─ DashboardList
│  ├─ BuilderCanvas
│  ├─ ComponentLibrary
│  ├─ DataBindingPanel
│  └─ PreviewRenderer
└─ MarketplaceModule
   ├─ CatalogGrid
   ├─ ConnectorDetails
   ├─ InstallFlow
   └─ TemplateGallery
```

### Rendering and state management

Rendering strategy is based on keeping expensive graph and canvas calculations isolated from global application state. The editor uses normalized entities for nodes, edges, groups, and annotations. The runtime preview consumes a frozen serializable workflow or dashboard definition rather than the editable draft structure, which avoids coupling preview performance to editor complexity.

Forms use schema validation and typed field metadata. Error handling is centralized through an application-level error boundary, query retry policy, and a unified notification system. Accessibility is considered a release gate: keyboard navigation, focus management, and contrast compliance are not optional polish items.

### Design System Architecture

The design system is the contract between product surfaces. It defines spacing, typography, semantic color tokens, elevation, motion, and interaction patterns. It must support both dense enterprise UIs and visually guided builder experiences without fragmenting into incompatible styling conventions.

| Layer | Examples | Decision |
|---|---|---|
| Tokens | Color, spacing, typography, radius, shadow | Central source of truth with semantic aliases |
| Primitives | Button, Input, Dialog, Tabs, Tooltip | Composable components built for reuse |
| Composition | Panels, drawers, accordions, tables | Business-safe patterns with predictable structure |
| Data visualization | Chart cards, KPI blocks, sparklines | Consistent chart wrapper and label language |
| Builder visuals | Canvas grid, node cards, resizers | High-density interaction patterns |

The design system package should be versioned independently, but consumed as a workspace dependency so that product apps can share the same tokens and component primitives. Builder-specific surfaces may extend the core system, but they should not fork it.

---

## Workflow Builder Architecture

The workflow builder is a canvas-based editor for DAG construction, inspection, validation, and publishing. Its editor state must be optimized for large graphs, collaborative interactions, undo/redo history, and eventual support for version comparisons and environment promotion.

- **Node model:** each node has a stable client identifier, server identifier, type, config schema, input/output handles, and runtime mapping.
- **Edge model:** edges are directional, typed, and validated against node input/output contracts.
- **Canvas interactions:** pan, zoom, snap, drag, marquee select, keyboard shortcuts, and minimap navigation.
- **Versioning:** drafts are separate from published versions; publish creates an immutable workflow version record.
- **Validation:** schema checks, cycle detection, required parameter checks, and environment policy enforcement.

```
Draft Workflow
  ├─ Nodes[]
  ├─ Edges[]
  ├─ Variables[]
  ├─ Policies[]
  └─ Metadata

Published Workflow Version
  ├─ Immutable graph snapshot
  ├─ Runtime bindings
  ├─ Connector and secret references
  └─ Execution policy hash
```

### Workflow builder canvas architecture

The canvas should separate visual state from business state. Visual state includes viewport transforms, selection state, and temporary interactions. Business state includes the actual graph content. This split prevents user interaction from corrupting the underlying workflow model and makes it possible to export, diff, and validate graphs deterministically.

| Subsystem | Responsibilities | Implementation notes |
|---|---|---|
| Viewport manager | Pan, zoom, fit, grid snapping, mini-map | Pure UI state; never persisted as workflow data |
| Selection engine | Single select, group select, lasso select, keyboard shortcuts | Selection state is transient and undoable |
| Node renderer | Type-specific node cards, ports, badges, and overlays | Renders graph entities from schema data |
| Edge renderer | Bezier/orthogonal edge paths, routing, arrowheads | Supports live rerouting during drag |
| Inspector panel | Property forms, validation messages, help text, secrets binding | Uses schema-driven forms |
| Validation engine | Cycle detection, required input validation, capability checks | Blocking vs warning issues |
| Graph normalizer | Canonical ordering, stable IDs, export serialization | Ensures deterministic publish artifacts |
| Versioning layer | Draft save, publish snapshot, rollback reference | Immutable version records |
| Diff viewer | Graph changes, node moves, property edits, connection edits | Used for review and approval |
| Runtime annotations | Last run status, execution counts, warning badges | Read-only overlay from execution data |
| Collaboration hooks | Presence, locking, future live collaboration | Optional in v1.0, extensible later |

The canvas should never directly talk to persistence on every mouse action. Instead, edits are buffered locally, debounced, validated, and then committed through explicit save or publish actions. This keeps the editor responsive and makes conflict handling feasible.

### Workflow node taxonomy and runtime behavior

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

### Publishing and promotion flow

Publishing creates an immutable workflow version after validation passes. Promotion moves a version from one environment to another under policy and approval control. Rollback rebinds the live alias to an earlier immutable version rather than editing a live graph in place.

```
Draft update -> validate -> save draft -> request publish
-> create immutable version -> record checksum -> emit audit event
-> optionally request environment promotion -> approval gate -> release record
-> live alias points to published version -> rollback switches alias back
```

---

## Dashboard Builder Architecture

The dashboard builder is a responsive 12-column layout system with data bindings, reusable widgets, permissions-aware visibility rules, and environment-aware previews. It is not just a page editor; it is a governed presentation layer for internal or customer-facing operational interfaces.

- Widgets are schema-driven so that their configuration can be stored, validated, and migrated over time.
- Data sources are explicit: every widget binds to an API query, workflow output, dataset, or manual input source.
- Responsive behavior is defined per breakpoint and validated before publish.
- Access control applies to both dashboard visibility and widget-level data access.

| Builder area | Responsibility | Special concerns |
|---|---|---|
| Layout canvas | 12-column grid, sections, rows, cards, containers | Responsive by design |
| Widget catalog | Metrics, tables, charts, forms, boards, files, AI cards | Versioned widget schemas |
| Data bindings | API query, workflow output, dataset, static input | Explicit source contracts |
| Theme editor | Spacing, typography, color tokens, density, modes | Design-system compliant |
| Permission rules | Show/hide rules, row filters, field masking | Policy-aware rendering |
| Preview mode | Safe rendering with sandbox data or scoped live data | No publish side effects |
| Publish flow | Version snapshot, validation, approval, deployment | Immutable dashboard release |
| Runtime view | End-user consumption and data refresh | Optimized for read performance |

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

- Widgets should be schema-driven so config can be validated and migrated.
- Data binding must be explicit and permission aware.
- The preview experience should match the production renderer as closely as possible.
- The builder shell should decorate widgets for editing, not replace the widget renderer.

---

## Connector Marketplace Architecture

The marketplace is the supply chain for integrations. It must support connector publishing, semantic versioning, trust levels, installation flows, dependency updates, and tenant-specific credential binding. Connectors can be first-party, partner, or community-maintained, but only signed and policy-compliant artifacts may enter production environments.

| Marketplace object | Description | Lifecycle |
|---|---|---|
| Connector listing | Public metadata about an integration package | Draft -> reviewed -> published -> deprecated |
| Connector version | Immutable implementation and manifest | Built -> signed -> released -> revoked |
| Installation | Tenant-scoped deployment of a connector | Installed -> configured -> active -> retired |
| Bundle | Grouped connectors or solution pack | Created -> promoted -> installed |
| Review record | Security and quality checks | Pending -> approved -> rejected |

### Connector SDK Specification

The SDK defines how connectors declare authentication, inputs, actions, events, output schemas, polling behavior, rate limits, and webhook endpoints. It must make connector development simple without sacrificing type safety or platform policy enforcement.

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

- Manifest declares capabilities and permissions.
- Action handlers are pure where possible and idempotent by contract.
- Credential access occurs through tenant-scoped secret references, not inline secrets.
- Connectors must expose structured errors and retry hints for platform orchestration.

| SDK area | Definition | Expected guarantee |
|---|---|---|
| Manifest | Name, slug, version, auth methods, capabilities, permissions | Primary entry point for the package |
| Action contract | Input schema, output schema, timeout, retry hints | Determines runtime behavior |
| Trigger contract | Webhook/poll/schedule metadata, cursor state | Controls event ingestion |
| Auth adapter | OAuth2, API key, token exchange, refresh logic | Credential handling abstraction |
| Package signing | Artifact hash, signature, provenance metadata | Trust and integrity enforcement |
| Install model | Tenant-scoped install, config binding, secret reference | Safe deployment of connector |
| Review flow | Security review, compatibility test, policy approval | Production release gate |
| Runtime envelope | Logging, correlation ids, rate limits, isolation rules | Operational consistency |

The marketplace should separate community trust from platform trust. First-party connectors may be allowed by default, while third-party packages may require explicit review, trust badges, and organization policy approval before production installation.

---

## AI Platform Architecture

AI is integrated as a first-class execution primitive rather than an external feature. The platform needs a provider abstraction, prompt template registry, model registry, token accounting, guardrails, prompt/version traceability, and execution isolation for AI-assisted steps.

| AI component | Role | Controls |
|---|---|---|
| Model registry | Track provider, model name, context window, cost, and risk | Used by editors and runtime selection |
| Prompt registry | Versioned prompt assets and parameters | Supports review and promotion |
| Provider gateway | Uniform interface to external LLM vendors | Hides provider-specific differences |
| Token meter | Prompt and completion token tracking | Billing and analytics source |
| Guardrails | Content policy, tool allow-lists, redaction | Protects data and actions |
| AI analytics | Spend, latency, failure rate, model mix | Operational and financial insight |
| Fallback logic | Provider failover, model fallback, retry behavior | Availability and resilience |

AI nodes should execute through the same reliability framework as traditional workflow steps. That means retries, timeout policies, correlation IDs, and auditable traces. AI execution must not bypass billing or RBAC constraints.

### AI run flow

```
Prompt version -> context assembly -> policy check -> provider call
-> response parse -> token accounting -> checkpoint -> analytics event
```

---

## Workflow Engine Internals

The engine executes directed acyclic graphs with explicit trigger nodes, action nodes, condition nodes, human approval gates, and AI nodes. Execution state is persisted so that retries, checkpoint recovery, and dead-letter routing remain possible even under partial infrastructure failures.

### Execution Lifecycle

```
Trigger event -> Normalize payload -> Resolve workflow version
-> Load run context -> Execute node -> Persist checkpoint
-> Emit platform event -> Enqueue next node -> Complete or fail
```

- **Scheduler**: converts delayed, recurring, or event-triggered work into queue jobs.
- **Worker**: fetches jobs, loads run state, evaluates the next node, and persists checkpoints.
- **Checkpointing**: saves node-level progress to allow recovery after crash or timeout.
- **Idempotency**: each step has a deterministic execution key and deduplication rule.
- **Dead-letter handling**: failed runs can be inspected, replayed, or archived.

---

## PostgreSQL Schema Catalog

PostgreSQL is the authoritative store for tenants, identity links, workflow definitions, versions, executions, dashboards, connectors, templates, metering, billing records, and audit logs. Tables should be designed for tenant isolation, indexed access paths, event replay, and append-only history where the domain requires it.

| Table | Purpose | Key columns / notes |
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

A production implementation should additionally define indexes for tenant-scoped lookups, composite keys for execution replay, partial indexes for active records, and retention policies for high-volume tables such as executions, events, logs, and metering.

---

## Redis & BullMQ Architecture

Redis is the transient coordination layer for queues, distributed locks, rate limiting, session acceleration, and short-lived caches. BullMQ or an equivalent queue framework provides job scheduling, retries, delayed jobs, and worker concurrency control. The queue design should separate control-plane jobs from execution-plane jobs so that heavy workflow traffic cannot starve product operations.

| Redis use case | Example | Notes |
|---|---|---|
| Job queues | workflow-execution, webhook-delivery, ai-run | Use distinct queues and priorities |
| Distributed locks | workflow publish lock, promotion lock | Prevent duplicate concurrent mutations |
| Rate limits | API key quotas, connector API throttles | Tenant-aware token buckets |
| Caches | schema metadata, permissions, template search | Short TTL and explicit invalidation |
| Session acceleration | JWT/session lookup, MFA state | Never treat cache as source of truth |

---

## API Gateway Design

The gateway standardizes auth, request logging, routing, rate limiting, and schema-aware validation. It should be thin enough to avoid business logic but rich enough to enforce security controls, tenant context extraction, and content negotiation across REST and GraphQL surfaces.

- All requests carry tenant context explicitly or via authenticated session resolution.
- Authorization checks are repeated at the gateway and service level for defense in depth.
- High-volume read endpoints should be cache-aware and support conditional requests where appropriate.
- The gateway must emit structured trace IDs and correlation IDs for every request.

---

## REST API Reference (v1)

The REST API is the operational contract for most external and internal integrations. A production reference must specify method, path, purpose, auth mode, request validation, response schema, and error semantics. The table below is the baseline catalog for version 1.0.

| Domain | Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|---|
| Auth | POST | /api/v1/auth/login | Create session | Public | MFA and SSO supported |
| Auth | POST | /api/v1/auth/logout | Terminate session | Session | Invalidate refresh token |
| Auth | POST | /api/v1/auth/refresh | Refresh session | Session | Rotate access state |
| Auth | POST | /api/v1/auth/mfa/verify | Verify MFA challenge | Session pending MFA | Confirm second factor |
| Auth | POST | /api/v1/auth/sso/start | Start SSO redirect | Public | Redirect URL or state |
| Auth | POST | /api/v1/auth/sso/callback | Finalize SSO | Public callback | Consume provider assertion |
| Tenants | GET | /api/v1/tenants/me | Get current tenant profile | User | Used for bootstrap |
| Tenants | PATCH | /api/v1/tenants/me | Update tenant settings | Tenant admin | Rename or configure tenant |
| Users | GET | /api/v1/users | List tenant users | Admin | Supports paging and search |
| Users | POST | /api/v1/users/invite | Invite user | Admin | Send role-scoped invite |
| Users | PATCH | /api/v1/users/{id} | Update user profile | Admin | Maintain user metadata |
| RBAC | GET | /api/v1/roles | List roles | Admin | Includes role permissions |
| RBAC | POST | /api/v1/roles | Create role | Admin | Scoped role creation |
| RBAC | POST | /api/v1/roles/{id}/permissions | Assign permissions | Admin | Grant atomic permissions |
| RBAC | DELETE | /api/v1/roles/{id} | Delete role | Admin | Not system role |
| Workflows | GET | /api/v1/workflows | List workflows | User | Filter by status and tags |
| Workflows | POST | /api/v1/workflows | Create workflow | Editor | Creates draft |
| Workflows | GET | /api/v1/workflows/{id} | Get workflow | User | Returns latest draft summary |
| Workflows | PATCH | /api/v1/workflows/{id} | Update workflow | Editor | Updates draft only |
| Workflows | POST | /api/v1/workflows/{id}/validate | Validate draft | Editor | Run publish checks |
| Workflows | POST | /api/v1/workflows/{id}/publish | Publish workflow version | Editor | Creates immutable version |
| Workflows | POST | /api/v1/workflows/{id}/activate | Activate version | Release manager | Switch live alias |
| Workflows | POST | /api/v1/workflows/{id}/clone | Clone workflow | Editor | Copy with new identity |
| Workflows | GET | /api/v1/workflows/{id}/versions | Version history | User | Inspect published versions |
| Workflows | GET | /api/v1/workflows/{id}/diff/{versionId} | Version diff | Editor | Compare graph changes |
| Executions | GET | /api/v1/executions | List executions | User | Supports tenant and workflow filters |
| Executions | GET | /api/v1/executions/{id} | Execution detail | User | Includes run state and checkpoints |
| Executions | GET | /api/v1/executions/{id}/logs | Execution logs | User | View run logs |
| Executions | GET | /api/v1/executions/{id}/steps | Step checkpoints | User | Inspect node progress |
| Executions | POST | /api/v1/executions/{id}/retry | Retry failed run | Operator | Idempotent retry |
| Executions | POST | /api/v1/executions/{id}/cancel | Cancel run | Operator | Best-effort cancel |
| Triggers | POST | /api/v1/triggers/schedule | Create schedule trigger | Editor | Cron or interval trigger |
| Triggers | DELETE | /api/v1/triggers/{id} | Remove trigger | Editor | Delete trigger definition |
| Triggers | POST | /api/v1/triggers/webhook | Receive webhook | Signed webhook | Public endpoint with verification |
| Connectors | GET | /api/v1/connectors | Search connectors | User | Marketplace catalog |
| Connectors | GET | /api/v1/connectors/{id} | Connector detail | User | Inspect version and trust |
| Connectors | GET | /api/v1/connectors/{id}/versions | Version history | User | See releases and changelog |
| Connectors | POST | /api/v1/connectors | Create connector | Admin | Internal or partner only |
| Connectors | POST | /api/v1/connectors/{id}/review | Submit review | Admin | Approve or reject package |
| Connectors | POST | /api/v1/connectors/{id}/install | Install connector | Editor | Tenant-bound install |
| Connectors | PATCH | /api/v1/connectors/installs/{id} | Update install | Editor | Adjust credentials or config |
| Connectors | POST | /api/v1/connectors/installs/{id}/revoke | Revoke install | Admin | Disable connector access |
| Templates | GET | /api/v1/templates | Browse templates | User | Supports category filtering |
| Templates | GET | /api/v1/templates/{id} | Template detail | User | Inspect compatibility |
| Templates | POST | /api/v1/templates | Publish template | Admin | Signed artifact required |
| Templates | POST | /api/v1/templates/{id}/install | Install template | Editor | Create tenant asset set |
| Templates | POST | /api/v1/templates/{id}/deprecate | Deprecate template | Admin | Mark template end-of-life |
| Dashboards | GET | /api/v1/dashboards | List dashboards | User | Tenant scoped |
| Dashboards | POST | /api/v1/dashboards | Create dashboard | Editor | Draft creation |
| Dashboards | GET | /api/v1/dashboards/{id} | Dashboard detail | User | Open dashboard editor |
| Dashboards | PATCH | /api/v1/dashboards/{id} | Update dashboard | Editor | Edit metadata or layout |
| Dashboards | POST | /api/v1/dashboards/{id}/preview | Preview dashboard | Editor | Render safe preview |
| Dashboards | POST | /api/v1/dashboards/{id}/publish | Publish dashboard | Editor | Immutable release |
| Dashboards | GET | /api/v1/dashboards/{id}/versions | Dashboard versions | User | History and rollback |
| Billing | GET | /api/v1/billing/usage | Usage summary | Billing admin | High-level metrics |
| Billing | GET | /api/v1/billing/usage/events | Usage event drill-down | Billing admin | Detailed metering events |
| Billing | GET | /api/v1/invoices | List invoices | Billing admin | Paged list |
| Billing | POST | /api/v1/billing/portal | Open provider portal | Billing admin | Manage payment method |
| AI | POST | /api/v1/ai/runs | Execute AI request | User | Metered and traced |
| AI | GET | /api/v1/ai/models | List models | User | Model registry |
| AI | POST | /api/v1/ai/prompts | Create prompt | Admin | Add prompt asset |
| AI | GET | /api/v1/ai/prompts/{id} | Prompt detail | Admin | Inspect prompt version state |
| AI | POST | /api/v1/ai/prompts/{id}/run | Run prompt | User | Execute AI call |
| AI | GET | /api/v1/ai/usage | AI usage summary | Billing admin | Tokens and spend |
| Admin | GET | /api/v1/audit | Audit log search | Admin | Security sensitive |
| Admin | GET | /api/v1/platform/events | Platform event log | Platform admin | Operational introspection |
| Admin | POST | /api/v1/feature-flags | Set feature flag | Admin | Policy gated |
| Admin | DELETE | /api/v1/feature-flags/{key} | Delete flag | Admin | Remove toggle |

Each endpoint must have stable validation rules, consistent error envelopes, and explicit idempotency guidance for any write operation that can be safely retried.

---

## GraphQL Schema

GraphQL should be used for highly composable read models, editor bootstraps, dashboard previews, and dependent UI data fetching. It complements REST rather than replacing it. Mutations should remain narrow and predictable, and subscriptions should only be used when the user experience requires live updates.

| Type / operation | Representative fields | Notes |
|---|---|---|
| Workflow | id, name, status, version, nodes, edges | Editor and detail pages |
| WorkflowVersion | id, versionNumber, graph, checksum | Immutable snapshot |
| Execution | id, status, startedAt, endedAt, stepResults | Monitoring and replay |
| Dashboard | id, title, layout, widgets, permissions | Preview and publish |
| Connector | id, slug, versions, trustLevel | Marketplace browse |
| Template | id, category, versions, installCount | Template gallery |
| Query: me | current tenant, roles, permissions, plan | Bootstrap payload |
| Mutation: publishWorkflow | workflowVersion, validationResult | Returns canonical version |
| Subscription: executionUpdated | execution status changes | Live monitor only |

---

## RBAC Model

Authorization is hierarchical and tenant-scoped. The model should support global platform roles, tenant roles, environment roles, and resource-specific grants. Permissions are expressed as atomic capabilities, while roles are bundles of permissions with explicit scope boundaries.

| Scope | Example role | Representative permissions |
|---|---|---|
| Platform | Super admin | Tenant support, policy management, global catalog moderation |
| Tenant | Workspace admin | Manage users, workflows, dashboards, billing settings |
| Environment | Release manager | Promote versions, roll back deployments, approve changes |
| Resource | Connector owner | Edit connector metadata, manage versions, publish release |
| Read-only | Viewer | Inspect workflows, dashboards, executions, and reports |

The authorization engine should return both an allow/deny decision and a reason code so that the UI can explain why an action is unavailable without leaking unnecessary details.

---

## Billing & Metering

Billing is usage-based with plan entitlements and overage support. Metering must record atomic events at the moment of usage, then aggregate them into invoiceable records asynchronously. The architecture must be resilient to duplicate events and delayed ingestion.

- **Metered dimensions**: workflow executions, node executions, API calls, AI tokens, storage, marketplace installs, and premium seats.
- **Pricing model**: a subscription base with usage-based overflow and optional enterprise commitments.
- **Aggregation**: daily and monthly rollups with tenant- and environment-level attribution.
- **Auditability**: every invoice line should be traceable back to raw metering events.

---

## Template Registry

Templates package reusable workflow blueprints, dashboard blueprints, connector bundles, and solution packs. The registry should support category browsing, compatibility metadata, region restrictions, trust tags, version pinning, and preview rendering.

| Template type | Examples | Distribution model |
|---|---|---|
| Workflow template | Lead routing, onboarding, incident triage | Public, private, or tenant-only |
| Dashboard template | Operations console, executive summary, KPI board | Public or private |
| Solution pack | Industry bundle with workflows + dashboards + connectors | Curated enterprise pack |
| AI starter template | Prompt chains and assistant workflows | Versioned and model-aware |

---

## Environment Promotion System

Environment promotion governs how versions move from development to staging to production. Promotion records must capture source artifact, destination environment, approvals, checksum, author, and rollback metadata. Every promotion should be reproducible and policy-checked.

```
Dev -> Staging -> Production
  |       |            |
  |       |            └─ rollback to prior approved version
  |       └─ integration validation and smoke tests
  └─ local authoring and preview
```

- Promotion is versioned, not mutable in place.
- Rollback rebinds to a previously approved version rather than editing live records.
- Approval gates can require one or more reviewers depending on environment policy.
- Environment parity should be measured and surfaced as part of release readiness.

---

## Security & Threat Model

Security must be layered across identity, transport, storage, execution, and supply chain. The main threats are tenant data leakage, connector abuse, prompt injection, credential exfiltration, privilege escalation, queue poisoning, replay attacks, and unsafe template promotion.

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
| Insider abuse | Unauthorized admin actions | Audit trail, approval gates, separation of duties |

Defense in depth is mandatory. No single authorization check, queue boundary, or client-side control should be treated as sufficient protection.

---

## Kubernetes Deployment Architecture

The platform deploys as a Kubernetes-based set of stateless services, workers, and stateful dependencies. Workloads should be separated by function and scaling profile. Control-plane services can scale independently from execution workers, and AI or enterprise workloads may require dedicated node pools or isolated namespaces.

**Namespace pattern:**
- `platform-control`
- `platform-execution`
- `platform-observability`
- `platform-enterprise-<tenant>`

**Workload pattern:**
- Deployments for APIs and frontend
- HorizontalPodAutoscalers for bursty services
- Jobs/CronJobs for batch tasks
- StatefulSets only for infrastructure components when self-managed

---

## CI/CD Pipelines

CI/CD should promote confidence, not merely ship code. The pipeline should validate types, tests, linting, schema migrations, security scans, package provenance, container image signing, deployment manifests, smoke tests, and progressive delivery gates.

```
PR checks:     unit tests, static analysis, schema validation, dependency audit
Main checks:   build artifacts, container scan, migration dry run, API contract test
Release path:  PR -> tests -> build -> scan -> staging -> smoke -> canary -> production
Recovery path: snapshot -> restore -> verify -> rebind -> replay queued work -> announce recovery
```

---

## Observability Stack

Observability combines logs, metrics, traces, and event audit data. The platform should expose service-level and product-level telemetry so that engineers can answer both operational questions and product analytics questions without rebuilding instrumentation for each use case.

| Signal | Examples | Why it matters |
|---|---|---|
| Logs | API events, worker exceptions, audit events | Forensics and debugging |
| Metrics | Latency, queue depth, error rate, token usage | SLOs and capacity planning |
| Traces | End-to-end request flow across services | Latency attribution and dependency mapping |
| Events | Workflow published, execution completed, template installed | Product analytics and billing |

---

## Multi-Region Strategy

The multi-region strategy is phased. Version 1.0 should support regional deployment topologies, regional data residency boundaries, and service routing policies. Active-active write semantics are not assumed initially; instead, the design should support primary-region control with read replicas, failover plans, and eventual regional autonomy where needed.

- Region-aware tenant placement and data policy metadata.
- Read locality for dashboards, catalogs, and low-risk metadata.
- Execution locality for latency-sensitive or residency-constrained workflows.
- Failover runbooks and DNS or traffic-manager driven cutover.

| Capability | Target state | Implementation note |
|---|---|---|
| Control plane metadata | Single authoritative region with read replicas | Tenant and environment routing |
| Execution locality | Regional worker pools and queue partitions | Latency-sensitive workflows |
| Data residency | Policy metadata on tenant and resource records | Prevents unlawful placement |
| Failover | DNS or traffic-manager based failover runbook | Recover service in alternate region |
| Backup replication | Cross-region artifact copies and database backup mirrors | Supports restore and migration |
| Tenant pinning | Enterprise tenants can be locked to a region | Contractual compliance |
| Operational reporting | Region-aware dashboards and health checks | Visibility into locality and failover |

---

## Disaster Recovery

Disaster recovery requirements should be defined in terms of RPO and RTO by service class. Metadata services, execution services, and analytics services may have different recovery expectations. The backup strategy must cover database snapshots, WAL/log shipping, object storage versioning, config backups, and infrastructure state export.

| Component | Backup strategy | Recovery target |
|---|---|---|
| PostgreSQL | Automated snapshots plus log shipping | Defined per tier, with point-in-time recovery |
| Redis | Rebuildable cache; minimal persistence only where needed | Fast restart, no cache reliance |
| Object storage | Versioned artifacts and cross-region replication | Artifact restore and replay |
| Secrets/config | Encrypted backups and IaC reconstruction | Rapid redeploy |
| Queues | Drained or replayed from durable state | At-least-once recovery |

| DR scenario | Playbook | Recovery objective |
|---|---|---|
| Database restore | Automated point-in-time restore rehearsal | Validate snapshots and WAL |
| Artifact restore | Rehydrate templates, connectors, dashboards, prompts | Ensure published assets survive |
| Queue replay | Re-enqueue durable jobs or reconstruct from event logs | Prevent lost work |
| Secrets rotation | Revocation and re-issuance procedure | Contain compromise quickly |
| Regional failover | Controlled switchover or failover drill | Meet availability commitments |
| Incident response | Clear roles, comms, and decision checkpoints | Reduce recovery time |

---

## Monorepo Structure

The monorepo is organized around clear product surfaces, bounded contexts, and reusable platform packages. Apps own user interfaces, services own business capabilities, packages own shared runtime primitives, connectors own external integrations, templates own reusable assets, and infrastructure owns deployment and operations.

```
Repository Root
autoflow-platform/
├── apps/
├── services/
├── packages/
├── connectors/
├── templates/
├── infrastructure/
├── scripts/
├── tools/
├── .github/
└── docs/
```

### apps/

The apps layer contains the deployable frontend surfaces. Each app is independently buildable and can be deployed with its own release cadence where needed.

```
autoflow-platform/apps/
├── web/           Customer-facing SaaS
├── admin/         Internal operations portal
├── docs/          Documentation site
├── marketing/     Landing pages
└── marketplace/   Connector marketplace frontend
```

### Frontend Structure: apps/web

The Next.js application uses the App Router, colocated feature modules, and a clean separation between routes, domain features, shared UI, state, API clients, and tests.

```
apps/web/
├── src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── workflows/
│   ├── executions/
│   ├── builder/
│   ├── marketplace/
│   ├── templates/
│   ├── billing/
│   ├── settings/
│   └── admin/
├── features/
│   ├── auth/
│   ├── workflows/
│   ├── executions/
│   ├── builder/
│   ├── marketplace/
│   ├── templates/
│   ├── billing/
│   ├── ai/
│   └── settings/
├── components/
├── hooks/
├── lib/
├── stores/
├── graphql/
├── api/
├── styles/
└── tests/
```

### services/

Services are split by bounded context so the control plane, execution plane, and supporting platform capabilities can evolve independently.

```
autoflow-platform/services/
├── api-gateway/
├── auth-service/
├── platform-service/
├── workflow-service/
├── execution-service/
├── scheduler-service/
├── connector-service/
├── template-service/
├── marketplace-service/
├── dashboard-service/
├── datasource-service/
├── ai-service/
├── billing-service/
├── metering-service/
├── notification-service/
├── audit-service/
└── search-service/
```

### Service Layout: workflow-service

This service owns workflow authoring, versioning, validation, publishing, and metadata retrieval. It should remain clean-architecture friendly and expose both REST and GraphQL entry points through the gateway.

```
services/workflow-service/
├── src/
├── domain/
│   ├── workflow/
│   ├── node/
│   ├── edge/
│   ├── trigger/
│   └── versioning/
├── application/
│   ├── commands/
│   ├── queries/
│   └── handlers/
├── infrastructure/
│   ├── postgres/
│   ├── redis/
│   └── events/
├── api/
│   ├── rest/
│   └── graphql/
└── tests/
```

### Service Layout: execution-service

This is the core runtime for orchestration, retries, checkpoints, dead-letter handling, telemetry, and worker coordination. It should be isolated for scaling and operational safety.

```
services/execution-service/
├── src/
├── orchestrator/
├── executors/
│   ├── action/
│   ├── trigger/
│   ├── condition/
│   ├── transform/
│   ├── approval/
│   ├── ai/
│   └── code/
├── checkpointing/
├── retry/
├── dlq/
├── queue/
├── workers/
├── telemetry/
└── tests/
```

### Service Layout: dashboard-service

Dashboard runtime concerns should be separate from dashboard authoring. The service owns dashboard definitions, pages, components, datasource binding, query execution, permissions, and publishing.

```
services/dashboard-service/
├── dashboard/
├── page/
├── component/
├── datasource/
├── query/
├── permissions/
├── templates/
└── publishing/
```

### Service Layout: ai-service

AI should remain isolated because it evolves quickly, requires model routing, prompt governance, evaluation, and usage accounting, and may eventually need per-model provider policies.

```
services/ai-service/
├── providers/
│   ├── openai/
│   ├── anthropic/
│   ├── google/
│   ├── deepseek/
│   └── openrouter/
├── routing/
├── prompts/
├── embeddings/
├── vector-search/
├── moderation/
├── usage/
└── evaluation/
```

### packages/

Shared packages provide the primitives used by apps and services. They must be versioned carefully and kept free of business logic that belongs in bounded contexts.

```
autoflow-platform/packages/
├── ui/
├── design-system/
├── sdk/
├── workflow-engine/
├── workflow-canvas/
├── dashboard-renderer/
├── dashboard-widgets/
├── connector-runtime/
├── sandbox-runtime/
├── agent-runtime/
├── shared-types/
├── shared-config/
├── shared-auth/
├── shared-db/
├── shared-rbac/
├── shared-events/
├── shared-logger/
├── shared-cache/
├── shared-testing/
└── event-bus/
```

### Database Package: shared-db

This package centralizes the schema layer, migration generation, seed data, repository abstractions, and test fixtures. It is the source of truth for relational persistence conventions.

```
packages/shared-db/
├── prisma/
├── migrations/
├── schemas/
├── repositories/
├── seeds/
└── fixtures/
```

### Connector SDK

The SDK is what external developers consume to build connectors, workflow nodes, triggers, and tests. It should remain stable, versioned, and heavily documented.

```
packages/sdk/
├── connector-sdk/
├── workflow-sdk/
├── trigger-sdk/
├── auth-sdk/
└── testing-sdk/
```

### Connectors

Each connector should follow a uniform repository layout so publishing, signing, testing, and marketplace review are consistent across the ecosystem.

```
connectors/slack/
├── src/
├── actions/
│   ├── send-message/
│   ├── create-channel/
│   └── invite-user/
├── triggers/
│   ├── new-message/
│   └── mention/
├── auth/
├── schemas/
├── tests/
└── connector.ts
```

### templates/

Templates are content and product assets used for instant onboarding, industry solutions, and marketplace distribution. They should be supported by versioned metadata and previewable manifests.

```
autoflow-platform/templates/
├── workflows/
├── dashboards/
├── industries/
└── connector-bundles/
```

### Infrastructure

Infrastructure should separate provisioning, deployment, observability, secrets, networking, and environment overlays so the platform can support dev, staging, prod, and enterprise-dedicated deployments.

```
autoflow-platform/infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── modules/
│       ├── eks/
│       ├── postgres/
│       ├── redis/
│       ├── vault/
│       ├── monitoring/
│       └── networking/
├── kubernetes/
│   ├── base/
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── prod/
└── helm/
```

---

## Operational Conventions

Generated clients, shared types, API contracts, and database schemas should always be derived from canonical definitions. Feature code should depend inward toward packages and services, never upward into app-specific code. This prevents circular dependencies and keeps the platform maintainable as teams scale.

---

## Engineering Roadmap

The roadmap should balance platform foundations, product surfaces, and enterprise readiness. Version 1.0 focuses on the minimum set of primitives required to author, run, observe, and monetize workflows and dashboards. Later phases expand the platform into AI-native automation, template ecosystems, and multi-region enterprise operations.

| Phase | Focus | Outputs |
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

All mutating requests should follow a shared lifecycle: authenticate, resolve tenant, authorize, validate, perform the operation, emit events, and record telemetry. The API should use a standard error envelope so that the UI can render actionable messages while logs preserve diagnostic detail.

| Stage | Input | Output / failure behavior |
|---|---|---|
| Authenticate | Bearer token, session cookie, or SSO assertion | Authenticated principal or 401/403 |
| Resolve tenant | Tenant header, tenant claim, invite token | Tenant context or tenant-scoped denial |
| Authorize | Principal, action code, resource id | Allow/deny with reason code |
| Validate | Payload schema and domain constraints | 422-style validation response |
| Execute | Command object, idempotency key, version token | State transition or conflict response |
| Emit events | Domain event payload, correlation id | Async consumers notified, retry on failure |
| Telemetry | Trace id, metrics labels, request metadata | Logs/traces/metrics persisted |

- Use optimistic concurrency for workflow draft updates and publish actions.
- Use idempotency keys for connector installs, payments, AI runs, and webhook retries.
- Return machine-readable error codes, not only human text, for all operational failures.
- Log domain identifiers, correlation ids, and actor ids on every mutation.

---

## Detailed Backend Architecture: Service Boundaries and Runtime Contracts

This section defines the implementation boundaries in the backend. The platform should avoid hidden coupling between authoring, execution, identity, billing, and ecosystem concerns. Each service below owns its own application logic, but all services share the same identity, tenancy, audit, and observability model.

| Service | Responsibilities | Profile | Key state |
|---|---|---|---|
| Auth Service | Sessions, MFA, SSO, claims, invite links, impersonation controls | Low-latency, security-sensitive, read-heavy | JWT/session bootstrap, auth callback, MFA challenge states |
| Tenant Service | Tenant profile, plan state, region policy, lifecycle, membership bootstrap | Strong consistency, low write volume | Tenant records, tenant settings, ownership metadata |
| Workflow Service | Workflow CRUD, graph validation, version publishing, diffing, rollback prep | Moderate write volume, high read volume | Draft graph, version snapshots, publish lock |
| Execution Service | Orchestration, retries, checkpoints, dead-lettering, run search | High throughput, queue-driven | Run state machine, step execution, replay controls |
| Scheduler Service | Cron triggers, delayed jobs, periodic polling, reconciliation | Time-driven, resilient, horizontally scalable | Trigger registry, schedule leases, job issuance |
| Connector Service | Connector catalog, installs, updates, manifest validation, trust state | Burst writes during installs, mostly read traffic | Catalog items, semver versions, install state |
| Template Service | Template registry, compatibility checking, package install, promotion | Read-heavy with moderate writes | Template metadata, package manifests, dependency graph |
| Billing Service | Usage aggregation, invoices, subscriptions, entitlements, proration | Batch + API mix, correctness critical | Usage rollups, invoice lines, payment references |
| AI Service | Model registry, prompt execution, token accounting, safety checks | External latency bound, policy heavy | Prompt versions, model metadata, AI run logs |
| Audit Service | Append-only audit logs, admin search, export, retention | Write-heavy append-only, compliance critical | Audit records, search index, retention rules |
| Notification Service | Email, in-app notices, webhooks, delivery retries, preferences | Bursty asynchronous | Notification queue, delivery attempts, templates |
| Search Service | Workflow, template, connector, execution indexing | Read optimized | Denormalized search documents and indexes |
| Policy Service | Feature flags, enterprise controls, policy decisions | Low latency, high read | Policy definitions, evaluations, override history |
| Media/Artifact Service | Uploads, exports, bundle storage, artifact signing | Object-store heavy | Artifact metadata, signed references |

---

## Detailed Frontend Architecture: Routing, State, and Rendering

The frontend is a composition of Next.js app routes and shared feature modules. Its job is to make complex platform behavior understandable. The UI should map directly to the user mental model: author, inspect, monitor, publish, install, bill, and administer. The routing structure should reflect that model rather than backend microservice names.

| Module | Responsibilities | State/data pattern |
|---|---|---|
| Route shell | Main navigation, tenant switching, environment picker, command palette, global alerts | Single app-level layout |
| Auth surface | Login, signup, SSO, invite acceptance, MFA challenge | Public routes with guarded transitions |
| Workflow surfaces | List, detail, editor, diff, publish, run monitor | Editor-heavy, graph state management |
| Dashboard surfaces | List, builder, preview, publish, widget configuration | Responsive layout and binding aware |
| Marketplace surfaces | Catalog, item detail, install flow, trust and version info | Search-heavy, conversion-oriented |
| Billing surfaces | Usage dashboard, invoices, plans, payment state | Read-only with controlled actions |
| Admin surfaces | Tenants, users, roles, audit, flags, policies | High trust, high safety |
| Shared query layer | Generated clients, React Query, cache keys, polling rules | Typed fetching and cache invalidation |
| Shared local state | Zustand or equivalent, undo stacks, UI preferences | Editor and interaction state only |
| Component primitives | Buttons, panels, dialogs, tables, form controls, charts | Design-system backed |
| Canvas runtime | Node graph rendering, drag/drop, edges, inspector panels | Performance-sensitive |
| Preview runtimes | Workflow preview, dashboard preview, sandbox render | Safe and isolated rendering |
| Notification center | Toast, banners, activity stream, background task status | Cross-cutting feedback |
| Search command layer | Command palette, entity search, quick action routes | Power user productivity |

### Component hierarchy and ownership

The hierarchy should ensure a clear separation between feature shells and reusable primitives. The goal is to prevent the builder from becoming a tangle of ad hoc components. Shared primitives and domain components should remain small, testable, and style-system driven.

```
AppShell
├─ TenantSwitcher
├─ EnvironmentSwitcher
├─ CommandPalette
├─ NotificationCenter
├─ Navigation
├─ Breadcrumbs
├─ ContentArea
│  ├─ RoutePages
│  ├─ FeatureShells
│  └─ ModalHost
├─ WorkflowModule
│  ├─ WorkflowList
│  ├─ WorkflowEditor
│  │  ├─ CanvasViewport
│  │  ├─ NodePalette
│  │  ├─ InspectorPanel
│  │  ├─ ValidationRail
│  │  └─ VersionHistory
│  └─ RunMonitor
├─ DashboardModule
│  ├─ DashboardList
│  ├─ DashboardStudio
│  │  ├─ GridCanvas
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

- Data fetching must be centralized so cache invalidation and authorization rules remain consistent.
- Server components should be used for static or lightly interactive pages, while editor surfaces remain client-heavy.
- Error boundaries should be specific enough to protect the shell without hiding feature-level failures.
- Any component that manipulates workflow or dashboard state should operate on normalized entities.

---

## Implementation Appendix A: API, Data, and Runtime Contracts

The following appendices convert the architecture into implementation-oriented guidance. They focus on contract boundaries, common failure cases, and the data model expectations that engineering teams should preserve while building services, clients, and operational tooling.

### Backend contract rules

Domain services should expose clear command and query boundaries so that stateful mutations can be audited and retried independently from read-heavy lookups.

Every public write operation should support a deterministic error envelope and carry a correlation identifier from ingress to persistence, which makes debugging possible without inspecting raw logs.

- Build the API and UI against explicit schemas rather than inferred request shapes.
- Keep invariants close to the service that owns the data.
- Prefer immutable published records for workflow, dashboard, template, and prompt releases.

| Area | Implementation expectation | Risk if missed |
|---|---|---|
| Backend contract rules | Documented contract and automated tests | Ambiguous behavior and brittle integrations |
| Retry handling | Deterministic, idempotent, observable | Duplicate side effects or hidden failures |
| Versioning | Immutable published versions and rollback | No safe promotion path |

### Frontend rendering rules

The shell must stay lightweight while feature modules own the heavy interaction logic. Shared primitives should be typed, theme-aware, and free from business-specific assumptions.

Large editors must isolate local interaction state from global app state so that selection changes, drag operations, and keyboard shortcuts do not trigger unnecessary app-wide rerenders.

### Workflow execution rules

Workflow execution must be idempotent at the step level, because the platform will inevitably see duplicate deliveries from queues, webhooks, and retries. The engine should therefore treat duplicate execution attempts as a normal condition, not an exception.

Checkpoint data should preserve enough information to reconstruct a failed run after a worker crash. That includes the current node, the inputs and outputs for completed steps, and the retry count for failed steps.

### Dashboard rendering rules

Dashboard widgets should render from versioned configuration records. The preview experience should reuse the same renderer as production, with edit-mode overlays layered on top, so that what users preview is what they can ship.

Permission checks must occur before binding data to widgets. A dashboard should never resolve unauthorized data even if the widget itself is hidden on the page.

### Connector packaging rules

A connector package should be declarative and signed. The manifest must declare authentication modes, actions, triggers, permissions, and compatibility constraints so that install-time validation can be deterministic.

Runtime logs should be sanitized and connector secrets should only appear as references. The connector runtime should be able to rotate credentials without forcing a package reinstall when the auth mode allows it.

### AI safety rules

AI prompts are versioned assets and should be reviewed like code. A prompt change can materially alter behavior, cost, or compliance posture, so the prompt registry needs publish controls and rollback support.

AI nodes should be able to call tools only through explicit platform allow-lists. This prevents free-form prompt output from becoming an uncontrolled execution path.

### Billing rules

Metering should be append-only at the event layer and aggregated later. The platform can tolerate delayed billing more easily than incorrect billing, but it cannot tolerate silent missing records.

Invoice lines should always be traceable back to raw usage events. This makes enterprise disputes, support investigations, and cost analytics significantly more defensible.

### Security rules

No frontend code path should ever become the sole authority for authorization or tenancy decisions. Every sensitive operation must be rechecked in the backend service that owns the resource.

Secrets, tokens, and private payloads should be masked in logs, redacted in audit exports where appropriate, and stored outside the relational core when practical.

---

## Implementation Appendix B: Database, API, and Event Semantics

These notes are intended to guide schema migrations, request modeling, and event design. The operational principle is simple: data that must survive failure or drive accounting belongs in durable storage, while derived state can be recomputed from durable inputs and event logs.

| Domain | Expectation | Implementation note |
|---|---|---|
| Tenants and memberships | Tenant identity, user identity, and membership state must be modeled separately | Use clear foreign keys and prefer tenant-scoped constraints |
| Workflows and versions | Drafts should be editable; published versions should be immutable | Preserve checksum and publish metadata |
| Executions and checkpoints | Execution tables capture run-level status; checkpoints capture node-level progress | Partition for retention and replay |
| Connectors and installs | Catalog metadata, versioned artifacts, and tenant installs are different concepts | Do not conflate a connector listing with a tenant installation |
| Dashboards and widgets | Track layout version and widget configuration independently | Use clear migration paths for widget config changes |
| Templates and bundles | Templates can span multiple object types and carry dependency metadata | Validate compatibility up front |
| Billing and metering | Atomic meter events, rollups, invoices, and payments each deserve separate tables | Never compute invoice lines directly from mutable operational records |
| AI prompts and runs | Prompt definitions should be versioned; runs should reference the exact version and model | Preserve traceability for support and compliance |

### Event Catalog

| Event | When emitted | Consumers |
|---|---|---|
| workflow.created | draft created, metadata initialized | Workflow service, search indexing |
| workflow.published | immutable version created | Execution service, audit, cache invalidation |
| workflow.activated | live alias moved to version | UI state and routing updates |
| execution.started | run accepted and scheduled | Monitoring, billing, UI updates |
| execution.completed | terminal success state reached | Analytics, notifications, invoice accrual |
| execution.failed | terminal failure state reached | Alerts, retry workflows, support tooling |
| connector.installed | tenant install activated | Runtime enablement, billing tracking |
| connector.revoked | install or version no longer allowed | Disable runtime access and alert users |
| template.published | template is available for install | Marketplace search and catalog sync |
| usage.recorded | atomic billable event emitted | Billing rollup and invoice generation |
| ai.run.completed | AI call finished with usage metrics | Token billing, performance analytics |

- Events should include version numbers so that consumers can evolve safely.
- Audit events and platform events are related but not interchangeable; audit records are optimized for compliance, while platform events are optimized for orchestration.
- Billing calculations should rely on immutable raw events, not mutable summaries.

---

## Implementation Appendix C: GraphQL, REST, and Client Contract Details

The API surface should be documented as a contract, not a collection of ad hoc endpoints. REST endpoints should map to actions that need explicit server control, while GraphQL should provide the aggregate read shapes that power editor bootstraps and dashboard previews.

| Domain | Surface area | Contract priority |
|---|---|---|
| Auth | session bootstrap, MFA, invite flow | Strong auth, tenant scoping, idempotency where needed |
| Workflow | draft CRUD, validation, publish, diff, activate | Strong auth, tenant scoping, idempotency where needed |
| Execution | list, detail, logs, checkpoints, retry, cancel | Strong auth, tenant scoping, idempotency where needed |
| Connectors | catalog, review, install, update, revoke | Strong auth, tenant scoping, idempotency where needed |
| Dashboards | draft CRUD, preview, publish, versions | Strong auth, tenant scoping, idempotency where needed |
| Templates | browse, detail, install, publish, deprecate | Strong auth, tenant scoping, idempotency where needed |
| Billing | usage summary, invoice list, billing portal | Strong auth, tenant scoping, idempotency where needed |
| AI | model list, prompt CRUD, run, usage summary | Strong auth, tenant scoping, idempotency where needed |
| Admin | audit search, feature flags, policy views | Strong auth, tenant scoping, idempotency where needed |

For both REST and GraphQL, the frontend should rely on generated types or validated schema artifacts rather than manually typed request shapes. That practice reduces drift, especially in a monorepo where many teams may touch the same data contracts.

| Type | Representative fields | Use case |
|---|---|---|
| Workflow | id, name, status, version, tags, currentVersion | Editor bootstrap and list views |
| WorkflowVersion | id, versionNumber, graph, checksum, createdBy | Immutable snapshot |
| Execution | id, status, startedAt, endedAt, steps, logs | Monitoring and replay |
| Connector | id, slug, name, trustLevel, versions | Marketplace browsing |
| ConnectorVersion | id, semver, manifest, permissions | Install and review |
| Dashboard | id, title, status, currentVersion, widgets | Preview and detail |
| Template | id, category, visibility, versions | Install and gallery |
| BillingSummary | period, totals, breakdowns | Finance dashboard |
| Prompt | id, name, status, currentVersion | AI authoring |
| AIUsage | model, tokens, cost, latency | Token accounting |

---

## Implementation Appendix D: Operations, Reliability, and Release Management

Operational architecture needs to be designed from the start, not added after the product is live. The system should be able to report when it is healthy, prove how it recovers, and show the path from an engineering change to a safe production release.

| Area | Mechanism | Outcome |
|---|---|---|
| CI validation | Type checks, tests, linting, schema lint | Protect the trunk |
| Artifact integrity | Build once, sign once, deploy same digest | Reproducibility |
| Staging gates | Smoke tests, contract tests, synthetic flows | Catch breakage before prod |
| Production rollout | Progressive traffic, canary analysis | Reduce blast radius |
| Rollback readiness | Retain prior artifacts, manifests, migrations strategy | Quick reversal |
| Metrics | Latency, error rate, queue depth, saturation, spend | Capacity management |
| Tracing | Frontend to backend to worker trace propagation | Rapid debugging |
| Alerting | SLO-based, actionable, runbook-linked alerts | Signal over noise |
| Backups | Snapshots, WAL, artifact copies, config export | Recovery foundation |
| Recovery drills | Restore tests and region failover simulation | Operational confidence |

A healthy release process should leave an audit trail that explains what changed, who approved it, what tests ran, which version was deployed, and how rollback would occur if needed. This should be true for application code, schema changes, workflow templates, connector packages, and AI prompt versions alike.

**Release record contents:**
- artifact checksum
- source version id
- approvers
- test evidence
- deployment target
- rollback target
- audit trail id

---

## Implementation Appendix E: Multi-Region, Data Residency, and Disaster Recovery

The multi-region strategy should be staged carefully so that region expansion improves reliability rather than introducing uncontrolled complexity. The control plane should know where tenant data is allowed to live, and the execution plane should know where jobs are allowed to run.

_(See Multi-Region Strategy and Disaster Recovery sections above for full table.)_

The practical standard is simple: backups must restore, queues must replay, and environment state must be reconstructible from controlled artifacts. If any of those cannot be demonstrated in a drill, the disaster recovery plan is not yet real.

---

## Implementation Appendix F: Glossary and Governance

| Term | Definition | Governance note |
|---|---|---|
| Control plane | The services and interfaces used to manage metadata, permissions, billing, templates, and configuration | Can be read-heavy but must remain authoritative |
| Execution plane | The workers and asynchronous systems that run workflows, AI tasks, and delivery jobs | Optimized for throughput and resilience |
| Draft | An editable in-progress workflow or dashboard definition | Not yet immutable |
| Published version | An immutable artifact ready for execution or promotion | Used for runtime and rollback |
| Tenant | An isolated customer or workspace boundary | Primary unit of access control and billing |
| Artifact | A signed, versioned deployable package | May represent workflow, template, connector, or prompt |
| Metering event | An atomic record of billable usage | Feeds billing rollups and invoices |
| Trust level | A label describing how much confidence the platform has in a connector or template package | Affects install and production approval |

- Version 1.0 should remain the official baseline for implementation review.
- Any scope expansion should be recorded as a new version or an architecture decision record.
- Public API changes should be made with deprecation windows and consumer migration support.

---

## Implementation Appendix G: Full API Contract Matrix

This appendix expands the REST surface into a fuller implementation matrix. The intent is to make major routes easy to split into OpenAPI groups, ownership boundaries, and test cases. Each row below is a contract, not simply a route; it represents a user-visible operation with explicit semantics.

_(See REST API Reference section above for the full matrix — this appendix confirms each operation includes semantics, auth/policy, notes, and response shape.)_

---

## Implementation Appendix H: Security and Policy Control Matrix

The platform should make security a product feature with visible controls and auditable outcomes. This matrix maps common security requirements to the technical mechanisms used to satisfy them.

| Control area | Threat / goal | Implementation mechanisms | Residual risk |
|---|---|---|---|
| Tenant isolation | Separate tenant context in every request and query | Service checks, row scoping, audit logs | Low |
| Secrets handling | Protect credentials and tokens | Vault refs, masking, rotation, secret-bound installs | Medium |
| MFA | Protect privileged access | MFA challenge, backup codes, conditional access | Low |
| Break-glass | Emergency admin access | Expiring elevated role, audit trail, approval | Medium |
| Supply chain | Protect packages and templates | Signing, provenance, review, trust levels | Medium |
| Prompt safety | Keep AI tools controlled | Allow-lists, redaction, policy checks, prompt versioning | Medium |
| Queue integrity | Prevent bad jobs or duplicates | Signed jobs, dedupe, idempotency keys | Low |
| Rate limiting | Keep abuse in check | Token buckets, per-tenant quotas, edge limits | Low |
| Export controls | Prevent accidental data leakage | Scoped export rights, watermarking, audit | Medium |
| Data retention | Meet legal and product retention | Partitioning, deletion jobs, retention policies | Low |
| Admin actions | Protect high-risk operations | Approval gates, impersonation controls, audit export | Low |
| Session security | Protect login state | Short-lived access, refresh rotation, revoke on risk | Low |
| Webhook security | Verify inbound/outbound events | HMAC signatures, secret rotation, replay protection | Medium |
| Billing integrity | Ensure correct charges | Append-only meter ledger, reconciliation, anomaly detection | Medium |
| Environment promotion | Keep release history auditable | Version pinning, approvals, rollback records | Low |

- Every privileged action must be searchable in the audit trail.
- No connector or template package should bypass signature or policy checks.
- Sensitive data must never be surfaced to the browser unless explicitly required.
- Security alerts should map to owner teams and runbooks.

---

## Implementation Appendix I: Reliability, Capacity, and Release Topology

| Dimension | Expectation | Operational mechanism |
|---|---|---|
| API latency | Fast response for authoring and read paths | P95 targets per surface; avoid heavy cross-service joins |
| Workflow throughput | Sustained execution volume | Worker pools scale horizontally with queue depth |
| Dashboard rendering | Interactive UI at reasonable data sizes | Virtualization and caching for heavy views |
| Queue depth | Backlog control | Autoscale on queue metrics and lag |
| Database capacity | Writes and reads growth | Indexes, partitioning, replicas, and retention |
| Artifact storage | Template, connector, and export assets | Object storage with signed references |
| Search load | Catalog and execution search | Separate indexing pipeline and query tier |
| Billing batch | Usage rollups and invoice generation | Scheduled jobs with backfill support |
| AI latency | Provider-dependent response time | Timeouts, fallback providers, and user-facing status |
| Recovery time | Restore and failover windows | Runbooks, rehearsals, and defined objectives |

**Deployment topology:**
- shared control plane
- shared execution plane
- dedicated enterprise namespaces or clusters where required
- optional regional worker pools
- managed data services preferred
- immutable artifact registry for all releases

---

## Implementation Appendix J: Extended Sequence and Flow Catalog

The platform should maintain a small library of canonical sequences in the repository. Each sequence can be used as the basis for tests, onboarding, and architecture diagrams.

| Flow | Actors / systems | Primary checkpoint |
|---|---|---|
| Login and bootstrap | User -> Auth -> Tenant context -> UI shell | Session and permissions resolve before app render |
| Create workflow | UI -> Workflow service -> Draft save -> Audit | Draft exists before editing continues |
| Publish workflow | Editor -> Validation -> Version snapshot -> Activation | Immutable version produced |
| Run workflow | Trigger -> Execution service -> Worker -> Checkpoint | Execution recorded end to end |
| Retry workflow | Operator -> Execution retry -> Queue -> Worker | Replay with idempotency preserved |
| Install connector | Marketplace -> Review -> Install -> Secret binding | Tenant-specific enablement |
| Publish template | Template editor -> Signing -> Registry -> Search index | Reusable asset becomes discoverable |
| Preview dashboard | Dashboard studio -> Preview service -> Renderer | Safe preview without write side effects |
| Collect meter event | Runtime -> Metering -> Rollup -> Billing | Usage is traceable |
| Run AI node | Workflow -> AI service -> Provider -> Token meter | AI use is governed and billed |
| Promote environment | Draft -> Approval -> Release -> Live alias | Versioned deployment history |
| Recover from failure | Alarm -> Runbook -> Restore -> Replay | Controlled restoration and resumption |

- Each canonical flow should be represented in automated tests.
- Execution and billing flows require special attention because they influence customer trust and revenue.
- Promotion and recovery flows should be rehearsed before enterprise launch.

---

## Implementation Appendix K: Architecture Acceptance Checklist

The following checklist is a practical gate for declaring the platform implementation-ready. It translates the architecture into reviewable acceptance criteria that can be tied to epics, milestones, and release gates.

| Gate | Requirement | Why it matters |
|---|---|---|
| Documentation | All major services, APIs, and schemas are described in the repository | Reviewers can understand the system without tribal knowledge |
| Contracts | REST, GraphQL, connector, and prompt contracts are versioned | Clients can integrate safely |
| Security | MFA, RBAC, secrets, audit, and signing controls exist | Enterprise review can proceed |
| Execution | Workflows can be run, retried, monitored, and recovered | Core platform works end to end |
| UI | Builder and dashboard experiences are usable and performant | Users can author and inspect assets |
| Billing | Usage can be metered, aggregated, and invoiced | Revenue model is measurable |
| Ops | Deployments, logs, metrics, traces, and backups are in place | Production operations are possible |
| Scale | The design supports horizontal scaling and multi-region evolution | Growth path is credible |

---

## Implementation Appendix L: Schema Deep Dive, Runbooks, and ADR Backlog

### Key Tables

| Table | Core columns | Use case |
|---|---|---|
| tenants | id, name, status, plan_id, region_policy, billing_account_id | Tenant lifecycle, residency, and pricing root |
| tenant_settings | tenant_id, key, value_json, updated_at | Feature toggles and defaults |
| users | id, tenant_id, email, status, locale, profile_json | Identity profile and state |
| memberships | tenant_id, user_id, role_id, status, invited_by | Access control binding |
| workflows | id, tenant_id, name, status, current_version_id | Workflow root and live alias |
| workflow_versions | id, workflow_id, version_number, graph_json, checksum | Immutable workflow snapshot |
| workflow_executions | id, workflow_version_id, status, started_at, finished_at | Run-level execution record |
| node_execution_checkpoints | execution_id, node_id, attempt, state_json | Recovery and resume state |
| connectors | id, slug, name, trust_level, scope | Connector catalog record |
| connector_versions | connector_id, semver, manifest_json, artifact_ref | Versioned release artifact |
| tenant_connector_installs | tenant_id, connector_version_id, status, installed_at | Tenant install state |
| tenant_credentials | tenant_id, connector_install_id, secret_ref, status | Secret reference binding |
| dashboards | id, tenant_id, title, status, current_version_id | Dashboard root record |
| dashboard_versions | dashboard_id, version_number, layout_json, checksum | Immutable dashboard snapshot |
| dashboard_widgets | dashboard_version_id, widget_id, type, config_json | Widget instances and config |
| templates | id, category, visibility, status, source_type | Reusable asset catalog |
| template_versions | template_id, semver, manifest_json, artifact_ref | Immutable template release |
| environments | id, tenant_id, name, type, policy_json | Dev/staging/prod metadata |
| environment_releases | environment_id, artifact_type, source_version_id, approved_by | Promotion history and rollback |
| metering_events | tenant_id, metric_code, quantity, occurred_at | Atomic billing event |
| usage_rollups | tenant_id, period_start, period_end, metric_code | Billing summary |
| billing_accounts | tenant_id, provider_ref, status, currency | Payment and subscription root |
| invoices | billing_account_id, invoice_number, period_start, period_end | Invoice header |
| invoice_lines | invoice_id, metric_code, quantity, unit_price | Charge details |
| ai_models | provider, model_name, context_window, price_json | Model registry record |
| ai_prompts | tenant_id, name, status, current_version_id | Prompt root |
| ai_prompt_versions | prompt_id, version_number, template_text, checksum | Prompt snapshot |
| ai_usage | tenant_id, model_id, prompt_tokens, completion_tokens | Token and spend record |
| audit_logs | actor_id, action, target_type, target_id, diff_json | Security audit trail |
| platform_events | event_type, aggregate_id, payload_json, occurred_at | Internal orchestration events |

### Runbook Quick Reference

| Runbook | Signals to inspect | Immediate response | Target time |
|---|---|---|---|
| Login outage | Check auth provider, session service, MFA, and gateway logs | Restore access and identify provider or config issue | Minutes |
| Workflow publish failure | Validate graph schema, permissions, and version lock | Fix draft and republish or rollback | Minutes to hours |
| Execution backlog | Inspect queue depth, worker health, and dead letters | Scale workers or pause trigger ingestion | Minutes |
| Webhook delivery failures | Review signatures, retries, response codes | Repair endpoint or rotate secret | Minutes |
| Connector install failures | Check manifest, permissions, auth, and trust state | Re-run validation or patch package | Minutes |
| Dashboard preview errors | Inspect widget schema and data bindings | Fix widget config or access rule | Minutes |
| Billing mismatch | Compare rollups with raw metering events | Reconcile, re-run aggregation, or correct event source | Hours |
| AI provider degradation | Check provider availability, timeout, and quota | Fallback model/provider or throttle usage | Minutes |
| Region failover | Trigger traffic reroute and tenant placement review | Restore service in secondary region | Hours |
| Database restore | Apply snapshot plus WAL recovery and verify state | Rebuild from point-in-time backup | Hours |
| Security incident | Revoke secrets, sessions, tokens, and suspect installs | Contain, investigate, and document actions | As needed |

### ADR Backlog

| Decision area | Question to resolve | When to capture |
|---|---|---|
| Service boundaries | Why each service exists and what it owns | Before implementation starts |
| Data model | Why tables are normalized or partitioned | During schema finalization |
| Execution model | Queue, worker, and checkpoint choices | Before first workflow runtime |
| Frontend state | Why React Query, Zustand, and editor state are split | During UI foundation work |
| Connector runtime | How packages are signed and executed | Before marketplace launch |
| AI governance | Model selection, prompt versioning, and guardrails | Before AI nodes ship |
| Billing semantics | Metering definitions and invoice logic | Before any customer billing |
| Release process | Promotion, approval, and rollback flow | Before production rollout |
| Security controls | MFA, RBAC, secrets, and audit logging | Before enterprise review |
| Multi-region plan | Primary region, failover, and residency | Before regional expansion |
| Observability | Logs, traces, metrics, and alert design | Before launch |
| Support model | How ops, support, and engineering respond to incidents | Before enterprise support |

---

## Implementation Appendix M: Component Inventory and Ownership Matrix

| Component | Responsibilities | Ownership |
|---|---|---|
| Web shell | Global layout, navigation, tenant state, and error boundaries | Frontend platform |
| Auth views | Login, signup, SSO, MFA, invite acceptance | Identity team |
| Workflow list/detail | Browse, search, metadata, version history | Workflow product team |
| Workflow editor | Canvas, inspector, validation, diff, versioning | Workflow product team |
| Execution monitor | Run list, step detail, logs, checkpoints | Execution team |
| Dashboard studio | Layout editor, widgets, bindings, preview | Dashboard team |
| Marketplace catalog | Search, detail pages, install flows | Ecosystem team |
| Billing console | Usage, invoices, plans, portal entry | Finance and platform |
| Admin console | Users, roles, audit, flags, policies | Platform ops |
| API gateway | Routing, auth enforcement, request shaping | Backend platform |
| Workflow service | Drafts, publish, diff, validation | Backend workflow team |
| Execution service | Scheduler, worker orchestration, checkpointing | Backend execution team |
| Connector service | Catalog, installs, trust, manifests | Ecosystem backend |
| Template service | Registry, package installs, search | Ecosystem backend |
| Billing service | Usage aggregation, invoices, entitlements | Finance platform |
| AI service | Model registry, prompt runs, token meter | AI platform |
| Audit service | Security logs, admin trails, export | Security and compliance |
| Search service | Indexes, query APIs, ranking | Platform infrastructure |
| Notification service | Email, in-app, webhook delivery | Platform infrastructure |
| Shared UI package | Buttons, modals, tables, form fields | Design system |
| SDK package | Connector SDK, workflow SDK, shared contracts | Platform developer experience |
| Workflow engine package | Graph runtime, checkpointing, step contracts | Execution team |
| Shared types package | Schemas, DTOs, generated types | Architecture / platform |
| Kubernetes manifests | Deployments, jobs, HPAs, ingress, policies | SRE / DevOps |
| Terraform modules | Cloud primitives, networking, storage, secrets | SRE / DevOps |
| Observability stack | Logs, metrics, traces, alerts, dashboards | SRE / DevOps |
| Documentation site | Architecture docs, API docs, SDK docs | Developer experience |
| Release automation | Build, scan, sign, deploy, rollback | Release engineering |
| Feature flag admin | Runtime controls and rollout | Platform ops |
| Tenant support tools | Impersonation, diagnostics, exports | Customer support and platform |

---

## Implementation Appendix N: Verification and Test Matrix

| Test case | Expected result | Systems involved | Owner |
|---|---|---|---|
| Auth login | User can log in with password and MFA | Session bootstrap works and audit is recorded | Frontend + auth service |
| Workflow draft create | User can create and edit a draft workflow | Draft persistence and graph validation | Workflow service + UI |
| Workflow publish | Valid workflow publishes immutable version | Version snapshot and publish audit exist | Workflow service + execution |
| Workflow run | Workflow executes from trigger to completion | Run state and checkpoints exist | Execution service + worker |
| Workflow retry | Failed run can be retried safely | Idempotency and dedupe preserved | Execution service |
| Dashboard preview | Draft dashboard renders safely | No writes, permission checks enforced | Dashboard studio + preview |
| Connector install | Tenant installs connector package | Trust and secrets binding validated | Connector service |
| Template install | Template creates required assets | Dependencies resolved and recorded | Template service |
| AI run | Prompt executes and token cost recorded | Guardrails and metering active | AI service |
| Billing rollup | Usage events aggregate into invoice lines | Reconciliation successful | Billing service |
| Audit search | Admin can search audit logs | Search scoped and permissioned | Audit service |
| Region failover | Traffic reroutes to secondary region | Recovery objective met | SRE + platform |
| Backup restore | Database and artifacts can be restored | Data integrity verified | SRE + database team |
| Release rollback | Deployment can revert to previous version | Known-good state restored | Release engineering |

The verification matrix should be linked to CI, staging gates, and operational drills. The objective is not to create paperwork, but to ensure the architecture can be exercised end-to-end before it is depended on by customers or investors.

- Every row should map to an automated or rehearsed check with evidence retained in the repository or release system.
- The team should mark each test as green only when the result is reproducible, not merely observed once.

---

## Implementation Appendix O: Environment, Release, and Support Matrices

### Environments

| Environment | Primary purpose | Allowed artifact types | Notes |
|---|---|---|---|
| Development | Rapid authoring, local testing, low-risk previews | Workflow and dashboard drafts, sandbox credentials | High change rate |
| Staging | Pre-production validation, integration checks, approvals | Promoted artifacts and replayable test data | Release candidate |
| Production | Live customer traffic and billing | Immutable versions, controlled access, audit | Strictest controls |
| Enterprise dedicated | Tenant-isolated runtime or namespace | Dedicated policy, region, and support model | Highest isolation |
| Disaster recovery | Failover and restore validation | Backups, replay queues, recovery runbooks | Recovery-only |
| Analytics | Read-heavy reporting and aggregation | Aggregates and warehouse-like exports | Derived data only |
| Support sandbox | Safe reproduction of customer issues | Anonymized or scoped test data | Support-only |

### Release Steps

| Release step | Inputs / actions | Success criteria |
|---|---|---|
| Plan release | Scope, owner, approval criteria | Reduces ambiguity before work starts |
| Build release | Compile, test, sign, and store artifact | Proves artifact integrity |
| Deploy release | Rollout to staging then production | Provides controlled exposure |
| Promote release | Move approved version between environments | Preserves immutability |
| Rollback release | Rebind to previous approved version | Fast escape hatch |
| Verify release | Smoke tests and synthetic journeys | Detects regressions |
| Document release | Changelog, audit, and artifact references | Traceability for review |
| Measure release | Usage, errors, and adoption metrics | Confirms customer impact |

### Support Areas

| Support area | Evidence to inspect | Customer-facing objective |
|---|---|---|
| Login issue | Auth, SSO, MFA, tenant membership | Account recovery and access restoration |
| Workflow issue | Validation, publish, run monitor, retries | User can resume productive work |
| Dashboard issue | Widget config, binding, preview, permissions | Dashboard renders correctly |
| Connector issue | Install state, secrets, trust, versions | Integration works or is safely disabled |
| Billing issue | Usage events, rollups, invoices, entitlements | Charge is explainable and correct |
| AI issue | Prompt version, model selection, usage logs | AI result is traceable and safe |
| Regional issue | Placement, failover, restore, data policy | Service availability returns |
| Security issue | Audit trail, token revocation, impersonation | Containment and traceability |

---

## Implementation Appendix P: Ownership, Rollout, and Quality Checklists

### Team Ownership

| Team | Primary responsibilities | Key quality bar | Owner |
|---|---|---|---|
| Frontend platform | Design tokens, shared UI primitives, route shells, editor perf | Accessibility, performance, consistency | Frontend lead |
| Workflow team | Draft model, publish flow, validation, diffing, versioning | Graph correctness, rollback safety | Workflow lead |
| Execution team | Scheduler, workers, checkpoints, dead letters | Idempotency, throughput, recovery | Execution lead |
| Ecosystem team | Connectors, marketplace, templates, signing | Trust, install safety, compatibility | Ecosystem lead |
| Finance team | Metering, invoices, usage summaries, subscriptions | Billing integrity, reconciliation | Finance lead |
| AI platform | Model registry, prompt versions, guardrails | Token accounting, safe output | AI lead |
| SRE | Kubernetes, observability, backups, failover | Availability, recovery, capacity | SRE lead |
| Security | MFA, RBAC, audit logs, secrets policy | Threat reduction, review gates | Security lead |
| Platform ops | Feature flags, support tools, admin audit | Controlled operations | Platform ops lead |
| Developer experience | Docs, SDKs, examples, templates | Adoption and integration ease | DX lead |

### Rollout Milestones

| Step | Rollout milestone | Exit criteria | Primary owner |
|---|---|---|---|
| 1 | Lock scope and publish architecture baseline | Agree on version 1.0 contract | Architecture review |
| 2 | Implement identity and tenant model | Users can authenticate and be scoped | Identity team |
| 3 | Ship workflow draft and publish flow | Immutable workflow versions exist | Workflow team |
| 4 | Ship execution engine and monitoring | Workflows can run end to end | Execution team |
| 5 | Add dashboard builder and preview | Dashboards can be authored safely | Dashboard team |
| 6 | Release connector catalog and installs | Tenants can enable integrations | Ecosystem team |
| 7 | Release template registry and promotion | Reusable assets can be distributed | Ecosystem team |
| 8 | Enable metering and billing summaries | Usage can be measured and explained | Finance team |
| 9 | Enable AI nodes and prompt registry | AI usage is governed and billed | AI platform |
| 10 | Harden security and audit exports | Enterprise review can proceed | Security team |
| 11 | Add CI/CD gates and rollback procedures | Production releases become routine | SRE / release engineering |
| 12 | Add multi-region and recovery drills | Resilience story is credible | SRE / platform |

### Quality Dimensions

| Quality dimension | Artifacts or practices | Why it matters |
|---|---|---|
| Documentation | Design doc, API specs, SDK docs, runbooks | Reviewability and onboarding |
| Code quality | Type-safe, test-covered, linted, and reviewed | Maintainability |
| Security quality | Audit logs, secrets handling, MFA, RBAC, signing | Risk reduction |
| Runtime quality | Idempotency, retries, checkpoints, monitoring | Production stability |
| Data quality | Schemas, partitions, retention, reconciliation | Correctness and scale |
| Product quality | Clear UX flows, accessible interactions, sane defaults | Adoption and usability |
| Release quality | Signed artifacts, staging gates, rollback paths | Safe shipping |
| Ops quality | Dashboards, alerts, runbooks, drills | Recovery and accountability |

---

## Open Decisions (v1.0)

- Whether GraphQL subscriptions or SSE will be the default for execution monitoring.
- Whether the first enterprise deployment pattern will be shared cluster isolation or dedicated namespace isolation.
- Whether workflow diffs should be stored as JSON patches, graph deltas, or full snapshots only.
- Whether connector code execution is hosted in-process, sandboxed workers, or WASM containers for version 1.0.

The above decisions should be resolved during implementation planning and then codified in the architecture decision log. Version 1.0 of this document is intentionally specific enough to build from, but it still leaves room for team-level engineering decisions where the implementation strategy can vary without changing the platform contract.

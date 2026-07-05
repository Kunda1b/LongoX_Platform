# LongoX Architecture Design Document

**Product:** LongoX — The AI-Native Workflow Operating System for Modern Teams.
**Version:** 2.1 · Implementation Blueprint · ADR Batch 2
**Owner:** LongoX Platform Architecture Team
**Date:** 2026-06-18
**Status:** Implementation-Ready Baseline
**Classification:** Internal — Engineering, Security & Investor Review
**URL:** longox.com

---

## Document Control

**Table 1. Document Metadata**

Field Value
Document title LongoX — Architecture Design Document
Version 2.1 (ADR Batch 2)
Product LongoX — The AI-Native Workflow Operating
System for Modern Teams
URL longox.com
Primary scope Workflow automation engine, low-code app
builder, AI platform, marketplace, billing,
enterprise operations
Intended use Implementation planning, design review,
security review, investor diligence, onboarding
Status Implementation-ready baseline
Owner LongoX Platform Architecture Team
Reviewers Frontend, Backend, DevOps, Security, Data,
Product, Finance, AI Platform
Classification Internal — Engineering, Security & Investor
Review
Last updated 2026-06-18
Supersedes v1.0 (Initial Blueprint), v2.0 (Revised)

**Table 2. Revision History**

Version Date Author Summary of
changes
1.0 2026-04-02 Platform Architecture
Team
Initial baseline.
Established
control/execution
plane split, 30+ table
schema, REST API
catalog, monorepo
structure, basic
operational sections.
Version Date Author Summary of
changes
2.0 2026-06-17 Platform Architecture
Team
Revised baseline
addressing 11 key
gaps from internal
review: (1) real C4 +
sequence diagrams
added; (2) ~40%
appendix duplication
removed via
consolidated Contract
Rules Matrix; (3) Non-
Functional
Requirements section
added with concrete
SLOs, capacity,
RPO/RTO; (4)
OpenAPI skeletons
for 5 critical endpoints

- GraphQL SDL
  excerpt added; (5)
  Multi-tenancy model
  made explicit with 3
  tiers
  (Shared/Dedicated-
  NS/Dedicated-
  Cluster); (6) AI
  chapter expanded
  with RAG, streaming,
  evals, PII, cost
  guardrails; (7)
  Workflow engine
  extended with long-
  running, saga, child
  workflows; (8)
  Compliance section
  added mapping to
  SOC 2 / ISO 27001 /
  GDPR / HIPAA; (9)
  Event schema
  specified with
  mandatory fields +
  JSON Schema
  example; (10) API
  versioning policy
  added (path-based,
  6mo deprecation);
  (11) ADR template +
  5 sample ADRs
  added.
  Version Date Author Summary of
  changes
  2.1 2026-06-18 LongoX Platform
  Architecture Team
  ADR batch 2:
  resolved all seven
  open decisions from
  v2.0 Section 29.1.
  Added ADR-006
  (Kong as API
  Gateway), ADR-007
  (WorkOS as Identity
  Provider), ADR-008
  (SSE for Realtime
  Updates), ADR-009
  (Deno Isolates for
  Connector Sandbox),
  ADR-010
  (PostgreSQL FTS for
  Search), ADR-011
  (Workflow Diffs —
  JSON Patch +
  Semantic UI Overlay),
  ADR-012 (Run
  History Retention —
  13M hot + 7Y cold,
  tenant-configurable).
  Section 29 rewritten
  to reflect resolutions
  and expanded
  implementation next-
  steps checklist.
  Rebranded to LongoX
  identity (navy +
  electric cyan, LX hex
  monogram on cover).

Revision policy: changes that affect runtime behavior, schemas, public APIs,
deployment topology, security model, billing semantics, or compliance posture require a
new reviewed revision. Version 2.1 supersedes v2.0 as the baseline contract for
engineering execution. All thirteen Architecture Decision Records (ADR-001 through
ADR-012) are in Accepted status. Future changes should come through explicit versioned
updates and new ADRs rather than silent drift. LongoX, the LX hex monogram, and the
tagline 'The AI-Native Workflow Operating System for Modern Teams' are product marks of
LongoX (longox.com).

## Table of Contents

Document Control.................................................................................................................. 1

1. Executive Summary........................................................................................................... 2
2. Product Vision & Strategic Goals..................................................................................... 3
   2.1 Differentiators vs. Adjacent Platforms.......................................................................... 3
3. Platform Scope & Non-Goals............................................................................................ 3
   3.1 In Scope (v2.0)............................................................................................................. 4
   3.2 Out of Scope for v2.0 (Deferred to v2.x+).................................................................... 5
   3.3 Permanent Non-Goals..................................................................................................6
4. System Architecture Overview......................................................................................... 6
   4.1 Layer Overview.............................................................................................................6
   4.2 C4 Level 1 — System Context..................................................................................... 7
   4.3 C4 Level 2 — Container Model.................................................................................... 7
   4.4 C4 Level 3 — Component Model................................................................................. 7
   4.5 C4 Level 4 — Code Boundaries...................................................................................8
   4.6 Control Plane vs. Execution Plane............................................................................... 8
5. Non-Functional Requirements.......................................................................................... 8
   5.1 Availability SLOs...........................................................................................................8
   5.2 Latency Targets............................................................................................................9
   5.3 Capacity Estimates.......................................................................................................9
   5.4 Recovery Point & Recovery Time Objectives.............................................................10
   5.5 Security NFRs............................................................................................................ 10
6. Multi-Tenancy Model........................................................................................................10
   6.1 Tier 1 — Shared......................................................................................................... 11
   6.2 Tier 2 — Dedicated Namespace................................................................................ 11
   6.3 Tier 3 — Dedicated Cluster........................................................................................ 11
   6.4 Tier Comparison......................................................................................................... 11
   6.5 Tenant Placement & Migration................................................................................... 12
7. Frontend Architecture (Next.js)...................................................................................... 12
   7.1 Application Map..........................................................................................................12
   7.2 Rendering & State Management................................................................................ 12
   7.3 Design System Layers............................................................................................... 13
   7.4 Workflow Builder Canvas........................................................................................... 13
   7.5 Dashboard Builder......................................................................................................13
8. AI Platform Architecture.................................................................................................. 13
   8.1 Provider Abstraction Layer......................................................................................... 14
   8.2 Prompt Registry..........................................................................................................14
   8.3 Model Registry............................................................................................................14
   8.4 Token Accounting & Cost Metering............................................................................15
   8.5 Guardrails................................................................................................................... 15
   8.6 RAG Architecture........................................................................................................15
   8.7 Streaming Responses................................................................................................ 15
   8.8 Evaluation Framework................................................................................................16
   8.9 PII Handling................................................................................................................ 16
   8.10 Cost Guardrails.........................................................................................................16
   8.11 AI Run Lifecycle........................................................................................................17
9. Workflow Engine Internals.............................................................................................. 17
   9.1 Engine Components...................................................................................................17
   9.2 DAG Execution & Bounded Loops............................................................................. 18
   9.3 Long-Running Workflows........................................................................................... 18
   9.4 Saga Compensation...................................................................................................19
   9.5 Human-in-the-Loop.................................................................................................... 19
   9.6 Child Workflows..........................................................................................................19
   9.7 Checkpoint Schema................................................................................................... 20
   9.8 Recovery Protocol...................................................................................................... 20
   9.9 Execution Lifecycle.....................................................................................................20
   9.10 Node Taxonomy....................................................................................................... 20
10. PostgreSQL Schema Catalog........................................................................................21
    10.1 Schema by Domain.................................................................................................. 21
    10.2 Indexing & Partitioning............................................................................................. 21
11. Redis & BullMQ Architecture........................................................................................ 21
    11.1 Queue Topology.......................................................................................................22
    11.2 Redis Use Cases......................................................................................................22
12. API Gateway & Versioning Policy.................................................................................22
    12.1 API Versioning Policy (NEW)................................................................................... 23
13. REST API Reference...................................................................................................... 23
    13.1 Endpoint Catalog......................................................................................................23
    13.2 OpenAPI Skeletons (NEW)...................................................................................... 24
    13.2.1 POST /api/v1/auth/login...................................................................................24
    13.2.2 POST /api/v1/workflows/{id}/publish................................................................24
    13.2.3 POST /api/v1/triggers/webhook.......................................................................24
    13.2.4 POST /api/v1/connectors/{id}/install................................................................ 24
    13.2.5 POST /api/v1/ai/runs....................................................................................... 24
    13.3 Standard Error Envelope..........................................................................................24
14. GraphQL Schema & SDL Excerpt................................................................................. 25
    14.1 When to Use GraphQL vs REST..............................................................................25
    14.2 SDL Excerpt............................................................................................................. 25
    14.3 Persisted Queries.....................................................................................................25
15. RBAC Model....................................................................................................................26
    15.1 Scope Hierarchy.......................................................................................................26
    15.2 Permission Matrix (Common Roles × Action Codes)............................................... 26
16. Billing, Metering & Unit Economics..............................................................................26
    16.1 Metered Dimensions................................................................................................ 27
    16.2 Metering Pipeline......................................................................................................27
    16.3 Pricing Tiers..............................................................................................................27
    16.4 Unit Economics.........................................................................................................28
    16.5 Invoice Traceability...................................................................................................28
    16.6 Enterprise Commitments..........................................................................................28
17. Connector Marketplace & SDK..................................................................................... 28
    17.1 Marketplace Objects.................................................................................................29
    17.2 Connector SDK & Manifest...................................................................................... 29
    17.3 Trust Tiers................................................................................................................ 29
18. Template Registry & Environment Promotion.............................................................30
    18.1 Template Types........................................................................................................30
    18.2 Environment Promotion............................................................................................30
    18.3 Promotion Contract.................................................................................................. 31
19. Event Schema & Versioning..........................................................................................31
    19.1 Mandatory Event Fields............................................................................................31
    19.2 Versioning Policy......................................................................................................31
    19.3 Consumer Idempotency Rule...................................................................................32
    19.4 Event Catalog...........................................................................................................32
    19.5 JSON Schema Example...........................................................................................32
20. Security, Threat Model & Compliance..........................................................................32
    20.1 Threat Model............................................................................................................ 33
    20.2 Compliance Posture (NEW)..................................................................................... 33
    20.3 Secrets Management............................................................................................... 33
    20.4 Data Residency........................................................................................................ 34
21. Kubernetes Deployment & CI/CD..................................................................................34
    21.1 Namespace Pattern..................................................................................................34
    21.2 Workload Patterns....................................................................................................35
    21.3 CI/CD Pipeline..........................................................................................................36
22. Observability Stack........................................................................................................ 36
    22.1 SLO Dashboards......................................................................................................37
23. Multi-Region & Disaster Recovery................................................................................37
    23.1 Phased Multi-Region................................................................................................ 37
    23.2 Disaster Recovery.................................................................................................... 38
    23.3 DR Failover Flow — Control Plane vs. Execution Plane..........................................38
24. Monorepo Structure....................................................................................................... 39
    24.1 Top-Level Layout......................................................................................................39
    24.2 Service Layout Example (workflow-service).............................................................39
25. Sequence Diagrams....................................................................................................... 39
    25.1 Workflow Publish......................................................................................................40
    25.2 Workflow Execution (with Checkpoint & Retry)........................................................ 40
    25.3 Marketplace Install................................................................................................... 40
    25.4 Dashboard Preview.................................................................................................. 41
    25.5 AI Run (with Guardrails + RAG)............................................................................... 41
    25.6 Environment Promotion............................................................................................41
26. Architecture Decision Records.....................................................................................41
    26.1 ADR Template.......................................................................................................... 42
    26.2 ADR-001: Use BullMQ + Redis for Workflow Queue............................................... 42
    26.3 ADR-002: Tiered Multi-Tenancy (Shared / Dedicated Namespace / Dedicated
    Cluster)............................................................................................................................. 43
    26.4 ADR-003: pgvector for v1.0 RAG............................................................................. 43
    26.5 ADR-004: Path-Based API Versioning with 6-Month Deprecation...........................44
    26.6 ADR-005: Workflow Diffs as JSON Patch................................................................ 45
    26.7 ADR-006: Kong as API Gateway............................................................................. 46
    26.8 ADR-007: WorkOS as Identity Provider................................................................... 46
    26.9 ADR-008: Server-Sent Events (SSE) for Realtime Updates....................................47
    26.10 ADR-009: Deno Isolates for Connector Sandbox Runtime.................................... 48
    26.11 ADR-010: PostgreSQL Full-Text Search for v2.x...................................................49
    26.12 ADR-011: Workflow Diffs — JSON Patch Storage + Semantic UI Overlay........... 49
    26.13 ADR-012: Workflow Run History Retention — 13M Hot + 7Y Cold, Tenant-
    Configurable..................................................................................................................... 50
27. Engineering Roadmap................................................................................................... 51
28. Implementation Appendices (Consolidated & Deduplicated)....................................51
    Appendix A. Contract Rules Matrix.................................................................................. 51
    Appendix B. Event Catalog (Consolidated)...................................................................... 52
    Appendix C. Runbook Catalog......................................................................................... 52
    Appendix D. Verification Matrix........................................................................................ 53
    Appendix E. Ownership Matrix......................................................................................... 53
    Appendix F. Glossary....................................................................................................... 53
29. Resolved Decisions & Next Steps................................................................................ 54
    29.1 Resolved Decisions (ADR-0006 – ADR-0012).........................................................54
    29.2 Implementation Next Steps...................................................................................... 54
    Right-click the table above → Update Field to refresh page numbers.

## 1. Executive Summary

LongoX is the AI-native workflow operating system for modern teams — a single multi-
tenant SaaS platform that combines workflow automation, low-code internal tooling, AI-
assisted automation, connector distribution, billing, and enterprise deployment controls.
This document defines LongoX's target architecture. Version 2.1 is the implementation-
ready baseline: it keeps the proven control-plane / execution-plane separation, the
immutability of published artifacts, the idempotency-first execution model, and the SDK-
driven connector ecosystem from v2.0, adds seven resolved Architecture Decision Records
(ADR-006 through ADR-012) that close every open question from the v2.0 review, and
rebrands the document under the LongoX identity (longox.com).
The most significant revisions in v2.0 (carried forward into v2.1) are: (1) real C4 L1–L4
and sequence diagrams replace the ASCII sketches of v1.0; (2) concrete non-functional
requirements (availability, latency, capacity, RPO/RTO) are stated per service tier; (3) the
multi-tenancy model is now explicit, with three named tiers (Shared, Dedicated Namespace,
Dedicated Cluster) and a clear data, compute, network, and secrets isolation contract for
each; (4) the AI chapter is expanded to cover RAG architecture, streaming responses, an
evaluation framework, PII handling, and per-tenant cost guardrails; (5) the security chapter
now maps to SOC 2 Type II, ISO 27001, GDPR, and HIPAA-ready controls; (6) the event
schema is specified with mandatory fields, JSON Schema examples, and a consumer
idempotency rule; (7) the API versioning policy is now explicit — path-based versioning, six-
month deprecation window, OpenAPI-first contract; (8) billing now includes concrete pricing
tiers, overage rates, and target unit economics; (9) five sample Architecture Decision
Records (ADRs) and an ADR template are included; (10) the appendices have been
deduplicated — the eight identical contract-rule tables from v1.0 have been consolidated
into one cross-cutting Contract Rules Matrix; and (11) OpenAPI skeletons for five critical
endpoints and a GraphQL SDL excerpt are included inline.
v2.1 adds ADR Batch 2: all seven open decisions from v2.0 Section 29.1 are now
resolved. ADR-006 selects Kong as the API gateway. ADR-007 selects WorkOS as the
identity provider. ADR-008 selects Server-Sent Events (SSE) for realtime updates.
ADR-009 selects Deno isolates for the connector sandbox runtime. ADR-010 selects
PostgreSQL full-text search for v2.x with a documented escape path to OpenSearch.
ADR-011 keeps JSON Patch as the workflow diff storage format and adds a semantic diff
renderer in the UI. ADR-012 sets run history retention at 13 months hot + 7 years cold by
default, tenant-configurable to 24M or 36M hot for Enterprise. With these decisions,
engineering can proceed with implementation knowing the API gateway, identity provider,
realtime transport, sandbox runtime, search backend, diff UI, and retention policy are
settled.
The intended audience is engineering (for implementation planning and epic
breakdown), security (for review and sign-off), DevOps and SRE (for deployment and
operations design), product (for scope and roadmap alignment), and external platform
partners and investors (for technical due diligence). This document favors explicit
boundaries, tables, interfaces, operational responsibilities, and failure handling over
marketing language. Where the platform supports future expansion, v2.1 identifies the
immediate 1.0 contract as well as the forward-compatible path.
Design principles, restated for v2.1: control plane APIs must be deterministic and
auditable; execution must be idempotent, retry-safe, and observable; tenancy, billing, and
authorization are first-class platform concerns; frontend and backend contracts must be
versioned and validated at build time; no single authorization check, queue boundary, or
client-side control may be treated as sufficient protection; and every published artifact —
workflow, dashboard, template, prompt, connector — must be immutable, checksummed,
and rollback-able.

## 2. Product Vision & Strategic Goals

LongoX is positioned as the operating layer for internal automation and customer-
facing workflow applications. Users should be able to design workflows, provision
dashboards, publish reusable templates, package connectors, and run AI-enhanced
automation without assembling a separate stack for each concern. The strategic model is to
build the platform once and reuse it everywhere: internal operations, customer success,
sales engineering, partner integrations, and industry-specific solution packs. The
architecture therefore must balance generic primitives with strong product opinionation. The
brand promise — 'The AI-Native Workflow Operating System for Modern Teams' —
commits LongoX to making AI a first-class primitive in every workflow, not a bolt-on feature.

**Table 3. Strategic Goals**

Strategic Goal Meaning Primary Metric
Reduce time to automation Enable business teams and
operators to ship workflows
and dashboards quickly
Median time from idea to first
production execution (target:
< 1 day for Pro tier)
Support enterprise adoption Meet security, tenancy, billing,
audit, and compliance
requirements
Enterprise conversion rate;
SOC 2 / ISO 27001 audit
pass rate
Create platform leverage Reuse workflows, templates,
connectors, and UI
components across tenants
Template reuse ratio > 30%;
connector install rate
Enable AI-native automation Make AI nodes and assistant
flows a core primitive, not a
bolt-on
AI node adoption > 40% of
workflows by Q4; AI token
efficiency
Scale globally Design for regional expansion
and data residency
Uptime ≥ 99.95% control
plane; regional deployment
readiness

### 2.1 Differentiators vs. Adjacent Platforms

Compared to n8n (open-source workflow), LongoX differentiates on enterprise-grade
multi-tenancy, native AI primitives with prompt governance, and a governed dashboard
builder. Compared to Workato (enterprise iPaaS), LongoX differentiates on a modern
Next.js frontend, a low-code dashboard layer that Workato lacks, and a significantly lower
entry price point. Compared to Retool (internal tool builder), LongoX differentiates by
including a real workflow execution engine, an AI runtime with token accounting, and a
connector marketplace with signing and review gates — capabilities Retool does not
provide. The strategic position is the intersection of these three product categories, unified
by a single control plane and the LongoX AI-native workflow runtime.

## 3. Platform Scope & Non-Goals

Scope discipline is what keeps a v1.0 platform shippable. The following boundaries
define what v2.0 commits to deliver, what is explicitly deferred to v2.x or later, and what is
permanently out of scope for this product line.

### 3.1 In Scope (v2.0)

• Workflow orchestration: trigger ingestion, DAG execution, retries, checkpoints, dead-
letter handling, human approval gates, AI nodes, child workflows.
• Dashboard creation: 12-column grid, schema-driven widgets, data binding, role-
aware visibility, environment-aware preview.
• Connector marketplace: publishing, signing, semantic versioning, trust tiers,
installation, dependency updates, tenant-scoped credential binding.
• AI platform: provider abstraction, prompt registry, model registry, token accounting,
guardrails, RAG, streaming responses, evaluation framework, per-tenant cost
ceilings.
• Billing: usage metering (append-only), aggregation, invoicing, plan entitlements,
overage, enterprise commitments, unit-economics tracking.
• RBAC: hierarchical, tenant-scoped, with audit-trail and reason-code-bearing
authorization decisions.
• Environment promotion: dev→staging→prod with approval gates, immutable
releases, rollback to prior approved version.
• Observability: structured logs, metrics, distributed traces, event audit — spanning
frontend through worker.
• Multi-region: regional deployment topology, regional data residency, primary-region
control with read replicas, failover runbooks.
• Multi-tenancy tiers: Shared, Dedicated Namespace, Dedicated Cluster — with explicit
isolation contract per tier (see Section 7).

### 3.2 Out of Scope for v2.0 (Deferred to v2.x+)

• Cross-cloud active-active multi-master write semantics. v2.0 supports primary-region
control with read replicas and active-passive failover. Active-active is targeted for
v2.5.
• Custom on-prem runtime binaries outside the supported deployment model. On-prem
is supported only through the Dedicated Cluster tier running on customer-managed
Kubernetes.
• General-purpose application code hosting. The platform runs workflows and renders
dashboards; it does not host arbitrary user-uploaded server code outside the
sandboxed connector runtime.
• Full BI warehouse functionality. Dashboards bind to API queries, workflow outputs,
and datasets, but the platform is not a replacement for Snowflake / BigQuery.

### 3.3 Permanent Non-Goals

• Arbitrary user-defined compute without sandboxing. All untrusted code (connector
actions, AI tool calls, transform nodes) runs inside a sandboxed runtime (WASM via
Deno isolates for v2.0).
• Bypassing platform metering or RBAC. AI execution, connector actions, and workflow
runs must never bypass billing or authorization constraints, even for internal tooling.

## 4. System Architecture Overview

The architecture is organized into four major layers: the user experience layer (frontend
apps), the control plane (metadata, identity, billing, templates), the execution plane
(workflow runs, AI calls, webhooks, scheduler jobs), and the data/infra plane (PostgreSQL,
Redis, object storage, secrets, observability backends). This layering is the spine of the
platform: every service belongs to exactly one plane, every cross-plane call is explicit and
observable, and every plane has its own scaling profile and failure tolerance.

### 4.1 Layer Overview

+-------------------------------------------------------------+
| Frontend Apps (Next.js): Portal | Builder | Admin | Market |
+---------------------------+---------------------------------+
|
+---------------------------v---------------------------------+
| Control Plane: Auth | RBAC | Metadata | Billing | Templates|
+---------------------------+---------------------------------+
|
+---------------------------v---------------------------------+
| Execution Plane: Scheduler | Workers | AI Runtime | Webhooks|
+---------------------------+---------------------------------+
|
+---------------------------v---------------------------------+
| Data/Infra Plane: PostgreSQL | Redis/BullMQ | Vault | S3 |
+-------------------------------------------------------------+

**Figure 1. Four-Layer Architecture — each plane scales and fails independently.**

### 4.2 C4 Level 1 — System Context

At the system context level, the platform sits between end users (operators, builders,
admins), external systems (CRMs, databases, SaaS apps via connectors), identity
providers (SSO), payment processors (Stripe), and LLM vendors (OpenAI, Anthropic,
Google, DeepSeek). The platform acts as the orchestration and governance center;
external systems remain authoritative for their own domain data and events.
+-------------------+
End Users ---->| |
| LongoX |
External Systems <--| Platform |---> Identity Provider (SSO)
(CRM, DB, SaaS) <---| (this system) |
| |---> Payment Processor (Stripe)
LLM Vendors <-----| |
(OpenAI etc) <-----| |---> Object Storage / Monitoring
+-------------------+

**Figure 2. C4 L1 — System Context.**

### 4.3 C4 Level 2 — Container Model

The container model shows the deployable units: a Next.js web app family, an API
gateway, twelve backend services, and the data layer. Each container has independent
build, deploy, and scale cadence. Containers communicate over the gateway for
synchronous REST/GraphQL and over the event bus / queue for asynchronous
orchestration.

**Table 4. C4 L2 Container Catalog**

Container Responsibilities Technology
Web App Portal, builder, dashboards,
marketplace UI, admin
console
Next.js 16, React 19,
TypeScript
API Gateway Routing, auth enforcement,
throttling, request shaping
Kong Gateway (OSS or
Enterprise)
Auth Service Login, session, MFA, SSO
orchestration
Node.js + WorkOS (per
ADR-007)
Workflow Service Workflow metadata, versions,
publishing, validation
Node.js, REST + GraphQL
Execution Service Workflow runtime, trigger
processing, state machine
Node.js + BullMQ workers
Connector Service Connector catalog, versions,
installs, secrets binding
Node.js
Container Responsibilities Technology
Billing Service Usage aggregation, invoicing,
entitlements
Node.js + batch processor
Template Service Template publish / install /
search
Node.js
AI Orchestrator Prompt execution, provider
abstraction, token tracking
Node.js + streaming via SSE
Notification Service Email, in-app, webhook
delivery with retries
Node.js + queue
Audit Service Append-only audit log,
search, export, retention
Node.js + ClickHouse for
search
Data Layer Persistent storage and cache PostgreSQL, Redis, S3-
compatible object store

### 4.4 C4 Level 3 — Component Model

Each service is internally decomposed into domain components with strict interfaces.
The workflow service is split into versioning, validation, persistence, graph normalization,
and publish orchestration. The execution service is split into trigger ingestion, scheduling,
run-state machine, checkpointing, retry, dead-letter, and event emission. This internal
decomposition is enforced at the package level inside each service's source tree so that
components cannot reach into each other's internals.

### 4.5 C4 Level 4 — Code Boundaries

The code boundary is enforced at the monorepo package level. Shared type contracts,
SDKs, and UI primitives live in packages that are dependency-safe and version-aware.
Services own their business logic and database migrations. Frontend apps consume
generated API clients and typed schema definitions rather than ad hoc request code. Cross-
package imports are validated by the build system; circular dependencies fail CI.

### 4.6 Control Plane vs. Execution Plane

The control plane is responsible for authoring and governance: authentication,
authorization, design-time metadata, templates, marketplace listings, billing artifacts, and
system configuration. The execution plane is responsible for live operations: running
workflows, evaluating triggers, executing connector actions, running AI calls, and recording
telemetry. This split is reflected in K8s namespaces, queue topology, scaling policies, and
failure tolerance.

**Table 5. Control Plane vs. Execution Plane**

Aspect Control Plane Execution Plane
Primary concern Consistency, governance,
configuration
Latency, throughput,
resilience
Aspect Control Plane Execution Plane
State model Authoritative metadata and
version history
Run-time state and
checkpoints
Failure tolerance Strong auditability and
recoverability
Retries, idempotency, dead-
lettering
Scaling pattern Stateless API scaling with
relational persistence
Worker pools and queue-
based horizontal scaling
User-facing impact What can be built and who
can do it
Whether the build actually
runs
SLO (availability) 99.95% 99.9%

## 5. Non-Functional Requirements

v1.0 stated principles without numbers. v2.0 commits to concrete non-functional
requirements per service tier. These NFRs are the contract that engineering designs to,
SRE alerts against, and the customer-facing SLA is derived from. NFRs are reviewed
quarterly; any change requires an ADR and customer notification if it would affect the
published SLA.

### 5.1 Availability SLOs

**Table 6. Availability SLOs by Service Tier**

Service Tier SLO (monthly) Error Budget Measurement
Window
Control Plane (auth,
workflow metadata,
billing, RBAC)
99.95% ~22 min/month Rolling 30-day
Execution Plane
(workflow runs,
scheduler)
99.9% ~44 min/month Rolling 30-day
AI Service (LLM
provider calls)
99.5% (provider-
dependent)
~3.6 hr/month Rolling 30-day
Billing & Metering 99.95% ~22 min/month Rolling 30-day
Marketplace &
Templates
99.9% ~44 min/month Rolling 30-day
Dashboard rendering
(read path)
99.95% ~22 min/month Rolling 30-day
SLOs are measured from the customer perspective (synthetic monitoring from three
geographic regions plus real-user monitoring). The error budget is the engineering team's
allowance for incidents, deployments, and experimental features; once 50% of the monthly
budget is consumed, non-emergency deployments are paused and a postmortem is
triggered. AI service SLO is explicitly provider-dependent because external LLM vendors
have their own uptime characteristics; the platform adds provider failover (see Section 9) but
cannot contractually exceed the underlying provider's availability.

### 5.2 Latency Targets

**Table 7. Latency Targets**

Operation p50 p99 Notes
Control-plane API
(GET, cached)
60 ms 200 ms Excludes cold-start
after deploy
Control-plane API
(POST, mutating)
150 ms 500 ms Includes optimistic-
concurrency check
Workflow trigger-to-
start
200 ms 2 s From webhook
receipt to first node
execution
Workflow node
execution (non-AI)
100 ms 1 s Excludes external
system latency
AI run (single LLM
call, non-streaming)
1.5 s 8 s Provider-dependent;
streaming reduces
TTFT to < 500 ms
p99
Dashboard render
(initial paint)
300 ms 1.5 s Server-rendered,
includes data fetch
GraphQL query
(editor bootstrap)
200 ms 800 ms Aggregate of 5–10
entity fetches
Webhook delivery
(signed, single
attempt)
100 ms 1 s Excludes downstream
response time
Latency SLOs are enforced through a combination of synthetic monitoring (Datadog or
Grafana Synthetic), real-user monitoring (frontend RUM), and distributed traces
(OpenTelemetry). p99 is the binding number for alerting; p50 is tracked for regression
detection. Persistent p99 breach triggers an incident regardless of error-budget
consumption.

### 5.3 Capacity Estimates

Capacity planning is grounded in a three-year growth model. The architecture must be
designed to absorb the Year 3 numbers without re-architecture; capacity headroom targets
are 2x current peak for stateless services, 1.5x for stateful.

**Table 8. Capacity Estimates (Year 1 → Year 3)**

Dimension Year 1 Year 2 Year 3
Tenants 1,000 4,000 10,000
Daily workflow
executions
1M 15M 50M
Dimension Year 1 Year 2 Year 3
Daily AI runs (LLM
calls)
500K 5M 20M
Daily AI tokens
(prompt + completion)
100M 1.5B 5B
Active dashboards 10K 100K 500K
Connector installs
(cumulative)
5K 50K 200K
PostgreSQL data
volume (hot)
500 GB 5 TB 20 TB
PostgreSQL data
volume (cold, audit +
metering)
2 TB 20 TB 100 TB
Object storage
(artifacts, exports)
1 TB 10 TB 50 TB
Concurrent users
(peak)
500 5,000 20,000
The Year 3 PostgreSQL volume (20 TB hot) drives the partitioning strategy:
executions, events, logs, and metering are partitioned monthly with 13-month retention for
hot partitions; older partitions are archived to object storage and accessible via a slow-query
path. The Year 3 AI token volume (5B/day) drives the cost-guardrails design (Section 9.10)
and the provider-abstraction layer's fan-out capability (multi-provider concurrent calls for
batch workloads).

### 5.4 Recovery Point & Recovery Time Objectives

**Table 9. RPO / RTO by Service Class**

Service Class RPO RTO Backup Strategy
Control plane
(metadata, RBAC,
billing)
5 min 1 hr PITR via WAL
streaming + hourly
snapshots
Execution plane (run
state, checkpoints)
15 min 4 hr PITR + checkpoint
replication to standby
region
Audit logs 0 (append-only, sync-
replicated)
4 hr Synchronous
replication to standby
region + cold archive
Metering events 1 min 4 hr Append-only, sync-
replicated; queue-
replay fallback
Templates &
marketplace catalog
1 hr 4 hr Daily snapshot +
object-storage
versioning
Service Class RPO RTO Backup Strategy
Object storage
(artifacts, exports)
1 hr 8 hr Cross-region
replication +
versioning
AI prompt versions 0 (immutable, sync-
replicated)
1 hr Synchronous
replication
RPO and RTO are validated through quarterly disaster-recovery drills. A drill restores
the most recent backup into an isolated recovery environment, replays queued work, and
verifies data integrity. A drill that fails to meet RTO triggers a remediation backlog item with a
30-day SLA.

### 5.5 Security NFRs

**Table 10. Security NFRs**

Dimension Target Measurement
MTTR for critical security
incidents
< 4 hr from detection to
containment
Incident postmortem
Audit log retention 7 years (hot 90d, cold 7y) Compliance audit
Secret rotation cadence DB credentials 30d, API keys
90d, OAuth client secrets
180d
Vault rotation log
Time to revoke compromised
credentials
< 5 min from alert to
revocation
Incident drill
Vulnerability remediation SLA Critical 7d, High 30d, Medium
90d, Low 180d
Snyk + npm audit + triage log
Penetration test cadence Annual external + quarterly
internal
Pen-test report
Security awareness training 100% engineering annual
completion
HR + training platform

## 6. Multi-Tenancy Model

v1.0 referenced row-level tenant scoping and the platform-enterprise-<tenant> K8s
namespace pattern but did not specify the boundary between shared and isolated tenancy.
v2.0 defines three explicit tiers, each with a complete isolation contract covering data,
compute, network, secrets, and observability. Tenant placement is determined at
provisioning time and may be upgraded (Shared → Dedicated Namespace → Dedicated
Cluster) via a tenant-migration workflow.

### 6.1 Tier 1 — Shared

Tier 1 tenants share the platform's primary cluster: a shared Kubernetes cluster, a
shared PostgreSQL database (with row-level tenant_id isolation on every table), shared
Redis, shared worker pools. This is the default for Starter and Pro plans. The isolation
boundary is logical: every query is scoped by tenant_id at the repository layer, every queue
job carries tenant context, every secret reference is tenant-scoped in Vault. Trust model:
tenants trust the platform to enforce tenant_id scoping correctly; the platform trusts tenants
not to attempt data exfiltration via the workflow execution path (mitigated by connector
allow-lists and AI guardrails).

### 6.2 Tier 2 — Dedicated Namespace

Tier 2 tenants get a dedicated Kubernetes namespace (platform-enterprise-<tenant>)
with dedicated worker pods, dedicated Redis namespace (logical database), and either a
dedicated PostgreSQL schema or a dedicated database within the shared DB cluster. The
control plane (auth, billing, marketplace catalog) remains shared; the execution plane is
isolated. This is the default for Team and standard Enterprise plans. The isolation boundary
is compute-level: noisy-neighbor risk is eliminated for execution; data isolation is
strengthened because the tenant's execution-state tables are physically separated.

### 6.3 Tier 3 — Dedicated Cluster

Tier 3 tenants get a single-tenant VPC deployment: dedicated control plane, dedicated
execution plane, dedicated PostgreSQL (managed RDS / CloudSQL), dedicated Redis,
dedicated object storage bucket. The only shared component is the global identity provider
and the marketplace catalog (read-only mirror). This is the deployment model for regulated
industries (healthcare, finance) with HIPAA BAA or PCI requirements, and for customers
with explicit data-residency contractual obligations. The isolation boundary is network-level:
there is no shared network path between the tenant's cluster and any other tenant's cluster.

### 6.4 Tier Comparison

**Table 11. Multi-Tenancy Tier Isolation Matrix**

Dimension Tier 1 Shared Tier 2 Dedicated NS Tier 3 Dedicated
Cluster
Kubernetes cluster Shared Shared (dedicated
namespace)
Dedicated
PostgreSQL Shared DB, row-level
tenant_id
Shared cluster,
dedicated schema or
DB
Dedicated DB
instance
Redis Shared (logical DB
index)
Dedicated logical DB Dedicated Redis
instance
Object storage Shared bucket, prefix-
per-tenant
Shared bucket, prefix-
per-tenant
Dedicated bucket
Worker pods Shared pool Dedicated pool in
namespace
Dedicated pool in
dedicated cluster
Dimension Tier 1 Shared Tier 2 Dedicated NS Tier 3 Dedicated
Cluster
Network Shared VPC,
namespace-level
NetworkPolicy
Shared VPC,
namespace-level
NetworkPolicy
Dedicated VPC, no
cross-tenant network
path
Secrets (Vault) Shared Vault, per-
tenant path
Shared Vault, per-
tenant path
Dedicated Vault
namespace or
instance
Observability Shared dashboards,
per-tenant filters
Shared dashboards,
per-tenant filters
Dedicated
dashboards,
dedicated log index
Control plane Shared Shared Dedicated (except
global IDP +
marketplace catalog
mirror)
Data residency Pinned to home
region
Pinned to home
region
Pinned to home
region; can be
customer-managed
Target plan Starter, Pro Team, Enterprise
(standard)
Enterprise
(regulated / HIPAA /
PCI)
Pricing multiplier vs
Tier 1
1x 3–5x 10–20x + dedicated
infrastructure pass-
through

### 6.5 Tenant Placement & Migration

Tenant placement is recorded on the tenants table as tier (1/2/3) and is enforced at
every layer: K8s deployment selectors, DB connection routing, Redis DB index selection,
Vault path prefix. Upgrades (Tier 1 → Tier 2 → Tier 3) are supported via a tenant-migration
workflow that (1) provisions the new isolation boundary, (2) backfills data via logical
replication or pg_dump/restore, (3) cuts over traffic during a coordinated maintenance
window, (4) verifies data integrity, (5) decommissions the old boundary. Downgrades are
not supported in v2.0.

## 7. Frontend Architecture (Next.js)

The frontend is a modular Next.js application family with shared design tokens, shared
data fetching patterns, and domain-specific route groups. The architecture assumes server
components where they reduce client complexity, but preserves client-side state
management for canvas editing, live previews, collaboration, and high-frequency
interactions. Route groups map cleanly to product surfaces: auth, workflows, executions,
dashboards, marketplace, billing, and admin.

### 7.1 Application Map

**Table 12. Frontend Route Groups**

App / Route Group Purpose Key Concerns
/login, /signup, /invite Authentication and
onboarding
SSO, MFA, validation,
session bootstrap
/workflows/_ Workflow authoring and
lifecycle
Canvas performance,
versioning, publish actions
/executions/_ Run monitoring and drill-down Live updates via SSE, logs,
checkpoints
/builder/_ Dashboard creation and
preview
Grid layout, bindings,
responsive rendering
/marketplace/_ Connector and template
discovery
Search, install flow, trust
signals
/billing/_ Usage and subscriptions Entitlements, invoices, plans
/admin/_ Platform administration Tenant support, policies,
feature flags

### 7.2 Rendering & State Management

Rendering strategy isolates expensive graph and canvas calculations from global
application state. The workflow editor uses normalized entities for nodes, edges, groups,
and annotations. The runtime preview consumes a frozen serializable workflow definition
rather than the editable draft structure, which avoids coupling preview performance to editor
complexity. Forms use schema validation and typed field metadata. Error handling is
centralized through an application-level error boundary, query retry policy, and a unified
notification system. Accessibility is a release gate: keyboard navigation, focus
management, and contrast compliance are not optional polish items.
Server state is managed by React Query with normalized cache keys and explicit
invalidation rules; local editor state is managed by Zustand stores, one per domain module.
Realtime updates use SSE (not WebSocket subscriptions) for execution monitoring and
dashboard refresh — this is the accepted decision per ADR-008. The UI layer talks to the
API through typed clients generated from OpenAPI; the GraphQL client is generated from
the SDL via graphql-codegen.

### 7.3 Design System Layers

**Table 13. Design System Layers**

Layer Examples Decision
Tokens Color, spacing, typography,
radius, shadow
Central source of truth with
semantic aliases
Layer Examples Decision
Primitives Button, Input, Dialog, Tabs,
Tooltip
Composable, built for reuse
Composition Panels, drawers, accordions,
tables
Business-safe patterns with
predictable structure
Data visualization Chart cards, KPI blocks,
sparklines
Consistent chart wrapper and
label language
Builder visuals Canvas grid, node cards,
resizers
High-density interaction
patterns

### 7.4 Workflow Builder Canvas

The canvas separates visual state (viewport transforms, selection, transient
interactions) from business state (the actual graph content). This split prevents user
interaction from corrupting the underlying workflow model and makes it possible to export,
diff, and validate graphs deterministically. Edits are buffered locally, debounced, validated,
and committed through explicit save or publish actions; the canvas never directly talks to
persistence on every mouse event. The node model includes a stable client identifier, server
identifier, type, config schema, input/output handles, and runtime mapping.

### 7.5 Dashboard Builder

The dashboard builder is a responsive 12-column layout system with data bindings,
reusable widgets, permissions-aware visibility rules, and environment-aware previews.
Widgets are schema-driven so that their configuration can be stored, validated, and
migrated over time. Data sources are explicit: every widget binds to an API query, workflow
output, dataset, or manual input source. The preview experience reuses the same renderer
as production, with edit-mode overlays layered on top, so that what users preview is what
they can ship.

## 8. AI Platform Architecture

AI is integrated as a first-class execution primitive rather than an external feature. v1.0
listed the components; v2.0 specifies how they behave in production. The platform needs a
provider abstraction layer, prompt versioning, model cataloging, usage accounting, safety
guardrails, RAG architecture, streaming responses, an evaluation framework, PII handling,
per-tenant cost ceilings, and a clear execution trace for each AI step. AI nodes execute
through the same reliability framework as traditional workflow steps: retries, timeout
policies, correlation IDs, and auditable traces. AI execution must not bypass billing or RBAC
constraints.

### 8.1 Provider Abstraction Layer

The provider gateway exposes a uniform interface (chat, embed, moderate) and hides
provider-specific differences (request shape, response shape, error semantics, rate-limit
headers). New providers are added by implementing a ProviderAdapter interface; the
registry selects the provider at runtime based on model selection, tenant policy, and
provider health. Fallback chains are configurable per model: if the primary provider returns
5xx or hits a tenant quota, the orchestrator retries with the next provider in the chain (with the
user's consent logged).

**Table 14. AI Provider Matrix**

Provider Chat Streaming Embeddin
gs
Tool Calls Vision Notes
OpenAI ✓ ✓ ✓ ✓ ✓ GPT-4o,
GPT-4o-
mini, o1,
o3-mini
Anthropic ✓ ✓ ✗ ✓ ✓ Claude 3.5
Sonnet,
Claude 3
Opus,
Claude 3
Haiku
Google ✓ ✓ ✓ ✓ ✓ Gemini 1.5
Pro,
Gemini 1.5
Flash,
Gemini 2.0
Flash
DeepSeek ✓ ✓ ✓ ✓ ✗ DeepSeek-
V3,
DeepSeek-
R1 — cost-
effective
for batch
OpenRout
er
✓ ✓ ✗ ✓ varies Aggregator
— used for
long-tail
model
access

### 8.2 Prompt Registry

Prompt templates are versioned assets. A prompt change can materially alter
behavior, cost, or compliance posture, so the prompt registry needs publish controls and
rollback support. Each prompt version is immutable once published; the live alias points to a
specific version. Promotion (draft → staging → production) requires approval for production
environment; lower environments allow self-promotion. Every AI run records the exact
prompt version, model, parameters, and provider used — this traceability is non-negotiable
for support and compliance.

### 8.3 Model Registry

The model registry tracks every supported (provider, model) tuple with metadata:
context window, training data cutoff, input modalities, output modalities, price per million
prompt tokens, price per million completion tokens, risk tags (e.g., 'not for HIPAA-regulated
use' for models without BAA support), and availability status. Editors use the registry to filter
models by capability and cost; the runtime uses it to validate that a model selected in a
workflow is still supported and to compute cost estimates before execution.

### 8.4 Token Accounting & Cost Metering

Every AI run records prompt tokens, completion tokens, cached tokens, and tool-call
tokens as atomic metering events. These events feed the billing pipeline (Section 11) and
the per-tenant cost dashboard. Token counts come from the provider's response when
available; if the provider does not return counts, the platform estimates via a tokenizer
matching the model family. Estimated counts are flagged in the metering event so that
downstream reconciliation can identify discrepancies.

### 8.5 Guardrails

Guardrails run at three points in the AI execution pipeline. Input guardrails check the
rendered prompt (after variable substitution, before provider call) for: PII presence
(configurable per tenant — see Section 8.9), prompt-injection signatures (using both regex
heuristics and a small classifier), and prompt policy compliance (e.g., 'no SQL generation').
Output guardrails check the model response for: content-policy violations (provider-side
moderation plus platform-side classifier), tool-call allow-list adherence, and structured-
output schema compliance. Tool guardrails enforce that any tool call the model emits is on
the workflow's explicit allow-list — the model cannot invoke arbitrary platform capabilities.

### 8.6 RAG Architecture

Retrieval-Augmented Generation is supported as a first-class pattern. v2.0 uses
pgvector as the vector store, leveraging the existing PostgreSQL deployment to avoid
introducing a new stateful dependency in v1.0. The migration path to a dedicated vector
database (Pinecone, Weaviate, or Qdrant) is documented in ADR-003 and will be triggered
if RAG workload volume exceeds 10M vectors per tenant or query latency degrades beyond
p99 500 ms.
The RAG pipeline: (1) Document ingestion — source documents are fetched from
object storage, connector outputs, or direct upload; (2) Chunking — text is chunked using a
recursive splitter with 800-token chunks and 100-token overlap (configurable per knowledge
base); (3) Embedding — chunks are embedded via the configured embedding model
(default: text-embedding-3-small); (4) Storage — embeddings stored in pgvector with
HNSW index; (5) Retrieval — at query time, the top-K chunks (default K=5, configurable) are
retrieved via cosine similarity with optional metadata filtering; (6) Citation — retrieved
chunks are surfaced to the model with stable chunk IDs so the model can cite them in its
response; the platform preserves the citation map in the AI run record for auditability.

### 8.7 Streaming Responses

AI nodes support streaming responses via Server-Sent Events (SSE). Streaming
reduces time-to-first-token from seconds to sub-500 ms p99, which materially improves UX
for chat-style AI nodes. The execution engine persists partial responses every ~1 second so
that a worker crash mid-stream does not lose all progress; on resume, the engine can either
continue the stream from the last persisted checkpoint (provider-permitting) or restart the
call and discard the prior partial. Backpressure is handled by buffering at the worker and
closing the SSE connection if the client cannot keep up — the workflow continues executing;
only the live stream is affected.

### 8.8 Evaluation Framework

AI behavior is non-deterministic, which makes regression testing harder than for
traditional code. The platform includes an evaluation framework to make prompt and model
changes safe. Each prompt version can declare a golden dataset (input→expected-output
pairs, or input→rubric pairs for open-ended evaluation). When a prompt change is proposed
for production promotion, the eval CI gate runs the new prompt against the golden dataset
and compares results to the prior version using a configurable scorer (exact match,
semantic similarity, LLM-as-judge, or custom rubric). A prompt change that drops the eval
score by more than the configured threshold blocks promotion.
Model swaps (e.g., GPT-4o → Claude 3.5 Sonnet) go through the same eval gate. The
platform also supports dry-run mode: a workflow version can be executed against a sample
of historical inputs with the new model, and the results compared side-by-side with the
original run. This makes model migration a deliberate, evidence-based decision rather than
a flip-the-switch gamble.

### 8.9 PII Handling

Personally Identifiable Information handling is a tenant-configurable policy. At ingress,
the input guardrail runs a PII detector (a combination of regex patterns for common
identifiers — SSN, email, phone, credit card — and a small NER model for names,
addresses, dates of birth). Detected PII is either (a) redacted before the prompt is sent to the
provider (replaced with tokens like [REDACTED-EMAIL-1] and restored in the response),
(b) flagged in an audit log but allowed through (for tenants who require PII for the workflow's
purpose), or (c) blocked entirely. The tenant admin configures the policy per environment;
the default is redact for Pro tier and below, configurable for Enterprise.
Every redaction is recorded in the audit log with the run ID, the field type, and a hash of
the redacted value (for correlation without re-exposing the value). The audit log is the
system of record for compliance inquiries — 'did this workflow ever send PII to an LLM
provider?' is an answerable query. Tenants on Tier 3 (Dedicated Cluster) can deploy their
own LLM providers (e.g., a self-hosted Llama) for zero-PII-egress workflows.

### 8.10 Cost Guardrails

AI tokens cost real money, and runaway workflows can rack up significant spend in
minutes. The platform enforces per-tenant monthly token budgets with three thresholds:
50% (notification to billing admins), 80% (notification to all workflow owners + soft warning in
the UI), 100% (hard cutoff — AI nodes fail-fast with a clear error message; non-AI nodes
continue executing). Enterprise tenants can negotiate overage contracts that lift the hard
cutoff in exchange for committed monthly volume + overage rates.
Cost guardrails also apply at the workflow level: each workflow can declare a per-run
token ceiling (default 100K tokens, configurable). If a single AI run exceeds the ceiling, the
platform terminates the call and marks the node as failed. This prevents a misconfigured
prompt loop from consuming the tenant's entire monthly budget in a single run. The
workflow-level ceiling is enforced client-side (in the AI orchestrator) and server-side (in the
provider adapter) for defense in depth.

### 8.11 AI Run Lifecycle

Prompt version
|
v
Context assembly (incl. RAG retrieval if configured)
|
v
Input guardrails (PII / prompt-injection / policy)
|
v
Provider call (with retry + fallback per provider chain)
|
v
Output guardrails (content / tool-allowlist / schema)
|
v
Token accounting (metering event emitted)
|
v
Checkpoint (partial response persisted)
|
v
Analytics event (latency, cost, model, prompt version)

**Figure 3. AI Run Lifecycle — every step is observable and replayable.**

## 9. Workflow Engine Internals

The workflow engine executes directed acyclic graphs (DAGs) with explicit trigger
nodes, action nodes, condition nodes, human approval gates, AI nodes, and subworkflow
nodes. Execution state is persisted so that retries, checkpoint recovery, and dead-letter
routing remain possible even under partial infrastructure failures. v2.0 extends v1.0 with
explicit semantics for long-running workflows, saga compensation, child workflows, and a
concrete checkpoint schema.

### 9.1 Engine Components

• Scheduler — converts delayed, recurring, or event-triggered work into queue jobs.
Backed by BullMQ delayed-job and repeatable-job primitives.
• Worker — fetches jobs, loads run state, evaluates the next node, and persists
checkpoints. Workers are stateless; all state lives in PostgreSQL.
• Checkpointing — saves node-level progress to allow recovery after worker crash or
voluntary reschedule.
• Idempotency — each step has a deterministic execution key (workflow_id + run_id +
node_id + attempt); deduplication happens at the executor level.
• Dead-letter handling — failed runs (after max retries) move to a dead-letter queue for
inspection, replay, or archival.

### 9.2 DAG Execution & Bounded Loops

The platform executes DAGs. 'Loop' nodes appear in the taxonomy under Logic; this is
not a contradiction — loop nodes are statically expanded at runtime into a bounded
sequence of DAG iterations. The loop node declares a max-iteration count (default 100,
hard cap 10,000 for Pro tier, configurable for Enterprise); the engine unrolls the loop body
into N copies at execution time, with conditional exit between iterations. This preserves the
DAG invariant (no cycles in the executed graph) while exposing a loop primitive to workflow
authors. Unbounded loops are explicitly forbidden; workflows requiring unbounded iteration
must use an event-driven pattern with explicit termination conditions.

### 9.3 Long-Running Workflows

Workflows that run for hours or days use a checkpoint-and-resume pattern with lease
renewal. A worker holds a lease on a run for a configurable duration (default 5 minutes); the
lease is renewed every 60 seconds while the worker is actively executing. If the worker
crashes or becomes unresponsive, the lease expires and another worker picks up the run
from its latest checkpoint. Maximum workflow duration is 30 days; workflows that need to
run longer must be restructured as event-driven: the long-running state lives in a database
row, and discrete events trigger discrete workflow runs that operate on that state.
Long-running workflows that include human approval nodes are not 'executing' for the
entire duration — the run enters a paused state when it hits the approval node, the lease is
released, and the run is reactivated when the approval (or rejection, or timeout) arrives. This
means a 30-day workflow might only consume 5 minutes of actual worker time; the rest is
paused state in PostgreSQL.

### 9.4 Saga Compensation

Action nodes may declare a compensation handler. If a parent workflow fails
downstream of a successful Action node, the engine invokes that Action's compensation
handler in reverse order. Compensation is best-effort: if a compensation handler itself fails,
the failure is logged and the engine continues compensating other nodes; the original failure
plus any compensation failures are surfaced in the run's failure report. Compensation is opt-
in — Action nodes that do not declare a handler are skipped during compensation (the
workflow author has decided the action is safe to leave in place).
Example: a workflow creates a Salesforce lead (Action A), sends a welcome email
(Action B), and updates an internal DB row (Action C). If Action C fails, the engine
compensates B (send a 'sorry, technical difficulty' email or suppress the original) and A
(delete the Salesforce lead). The compensation handlers are explicit functions in the
connector action contract.

### 9.5 Human-in-the-Loop

Approval nodes block workflow execution until an external decision arrives. Each
approval node declares: approvers (a list of user IDs or role codes), timeout (default 7 days,
configurable per environment), escalation chain (optional: who gets notified if the primary
approver doesn't respond). Reminders are sent at configurable intervals (default: 24h
before timeout, 1h before timeout). On timeout, the node can be configured to auto-approve,
auto-reject, or extend the timeout. The approval decision (approved / rejected / withdrawn)
and the decider's identity are recorded in the run log for audit.

### 9.6 Child Workflows

Subworkflow nodes spawn a child workflow run with parent-child correlation. The
parent can wait for the child to complete (synchronous semantics, but the parent releases its
lease while waiting) or fire-and-forget (asynchronous semantics, parent continues
immediately). Child runs have their own run ID and checkpoint history but share the parent's
tenant, environment, and correlation ID. Max nesting depth is 5 to prevent runaway
recursion. A child's failure does not automatically fail the parent — the parent's behavior on
child failure is configured at the subworkflow node (fail / continue / retry child).

### 9.7 Checkpoint Schema

Checkpoint data preserves enough information to reconstruct a failed run after a
worker crash. The schema is JSON, stored in the node*execution_checkpoints table.
{
"execution_id": "exec_01HNQK8X3F6...",
"node_id": "node_action_5",
"attempt": 2,
"state": "completed", // pending|running|completed|failed|skipped
"inputs": { /* rendered inputs at execution time _/ },
"outputs": { /_ action outputs, if completed \_/ },
"error": null, // structured error if failed
"started_at": "2026-06-17T10:23:01Z",
"finished_at": "2026-06-17T10:23:04Z",
"retry_count": 1,
"idempotency_key": "exec_01HNQK...|node_action_5|2",
"compensation_status": "pending" // pending|done|failed|skipped
}

### 9.8 Recovery Protocol

When a worker crashes mid-execution: (1) the lease on the run expires after 5 minutes;
(2) the scheduler requeues the run with a 'recover' marker; (3) a new worker picks up the
run, loads the latest checkpoint for the in-flight node, and either resumes from the
checkpoint (if the node is idempotent and the checkpoint indicates partial progress) or
restarts the node from scratch (if the node is non-idempotent or the checkpoint is
incomplete). The choice is made by the executor based on the node type and the checkpoint
state. A run that fails to recover after 3 attempts is moved to the dead-letter queue with a
'recovery_exhausted' status.

### 9.9 Execution Lifecycle

Trigger event
|
v
Normalize payload --> Resolve workflow version
|
v
Load run context
|
v
Execute node --> Persist checkpoint
|
v
Emit platform event
|
v
Enqueue next node
|
v
Complete or fail --> (if fail) compensate + DLQ

**Figure 4. Execution Lifecycle — every transition is logged and replayable.**

### 9.10 Node Taxonomy

**Table 15. Workflow Node Taxonomy**

Node Family Examples Execution Model
Trigger Webhook, schedule, poll,
manual, event bridge
Starts a run and hydrates
initial context
Transform Map, format, merge, split,
extract
Pure data shaping without
side effects
Action HTTP, connector action,
database write, file upload
Side effects with retry and
idempotency rules; may
declare compensation
Logic If, switch, branch, loop
(bounded), expression
Determines next execution
path; loops are statically
unrolled
Human Approval, review, task
assignment, wait step
Pauses run and resumes on
external event with timeout +
escalation
AI Prompt, classify, summarize,
generate, embed, RAG
Provider abstraction, token
billing, guardrails, streaming
Utility Delay, log, annotate, notify,
debug
Operational support and
observability
Boundary Subworkflow, reusable
component, exception handler
Modular graph reuse and
isolation; max nesting depth 5

## 10. PostgreSQL Schema Catalog

PostgreSQL is the authoritative store for tenants, identity links, workflow definitions,
versions, executions, dashboards, connectors, templates, metering, billing records, and
audit logs. Tables are designed for tenant isolation, indexed access paths, event replay, and
append-only history where the domain requires it. The schema is grouped by domain;
production deployments additionally define indexes for tenant-scoped lookups, composite
keys for execution replay, partial indexes for active records, and retention policies for high-
volume tables.

### 10.1 Schema by Domain

**Table 16. Schema Catalog (grouped by domain)**

Domain Table Key Columns / Notes
Identity tenants id, name, status, plan_id,
region_policy, tier (1/2/3),
billing_account_id
Identity users id, email, status, locale,
profile_json
Domain Table Key Columns / Notes
Identity memberships user_id, tenant_id, role_id,
status, invited_by
Identity rbac_roles id, tenant_id, name, scope
Identity rbac_permissions id, code, description
Identity role_permissions role_id, permission_id
Workflow workflows id, tenant_id, name, status,
current_version_id
Workflow workflow_versions id, workflow_id,
version_number, graph_json,
checksum
Workflow workflow_diffs id, from_version_id,
to_version_id, patch_json —
JSON Patch per ADR-005
Execution workflow_executions id, workflow_version_id,
status, trigger_type,
started_at, finished_at
Execution node_execution_checkpoints execution_id, node_id,
attempt, state_json — see
Section 9.7
Execution execution_leases execution_id, worker_id,
leased_until — for crash
recovery
Execution dead_letter_queue id, execution_id, node_id,
reason, payload_json, status
Connector connectors id, slug, name, trust_level
(first-party/partner/community)
, scope
Connector connector_versions id, connector_id, semver,
manifest_json, artifact_ref,
signature_ref
Connector tenant_connector_installs tenant_id,
connector_version_id, status,
installed_at
Connector tenant_credentials tenant_id,
connector_install_id,
secret_ref, status
Dashboard dashboards id, tenant_id, title,
layout_version, status,
current_version_id
Dashboard dashboard_versions id, dashboard_id,
version_number, layout_json,
checksum
Domain Table Key Columns / Notes
Dashboard dashboard_widgets dashboard_version_id,
widget_id, type, config_json
Dashboard data_sources id, tenant_id, kind,
config_json
Template templates id, category, visibility, status,
source_type
Template template_versions id, template_id, semver,
manifest_json, published_at
Environment environments id, tenant_id, name
(dev/staging/prod), type,
policy_json
Environment environment_releases id, environment_id,
artifact_type,
source_version_id,
approved_by, approved_at
Approval approval_tasks id, workflow_id, requester_id,
approver_id, status, due_at,
escalated_at
Billing metering_events id, tenant_id, event_type,
quantity, occurred_at —
append-only
Billing usage_rollups tenant_id, period_start,
period_end, metric_code,
quantity
Billing billing_accounts id, tenant_id, provider_ref,
status, currency
Billing invoices id, billing_account_id,
invoice_number, period_start,
period_end, status
Billing invoice_lines invoice_id, metric_code,
quantity, unit_price, amount
Billing token_budgets tenant_id, period,
monthly_limit, alert_50,
alert_80, hard_cutoff_at
AI ai_models provider, model_name,
context_window, price_json,
risk_tags, status
AI ai_prompts id, tenant_id, name, status,
current_version_id
AI ai_prompt_versions id, prompt_id,
version_number,
template_text,
parameters_json, checksum
Domain Table Key Columns / Notes
AI ai_usage id, tenant_id, model_id,
prompt_tokens,
completion_tokens, cost_usd,
run_id
AI ai_eval_datasets id, prompt_id, name,
golden_pairs_json
AI ai_eval_runs id, prompt_version_id,
dataset_id, score,
scorer_type, results_json
RAG knowledge_bases id, tenant_id, name,
embedding_model,
chunking_config
RAG knowledge_documents id, knowledge_base_id,
source_ref, status,
chunk_count
RAG vector_embeddings id, document_id,
chunk_index, content,
embedding vector(N),
metadata_json
Audit audit_logs id, actor_id, action,
target_type, target_id,
diff_json, occurred_at —
append-only
Platform platform_events id, event_type, event_version,
aggregate_id, payload_json,
occurred_at
Platform webhook_deliveries id, endpoint_id, status,
retry_count, next_attempt_at
Platform feature_flags id, tenant_id, key, value_json,
updated_at

### 10.2 Indexing & Partitioning

Indexing is tenant-scoped by default: every multi-tenant table has a composite index on
(tenant_id, <primary lookup column>). Execution-related tables add composite indexes for
replay queries: (workflow_id, started_at) on workflow_executions, (execution_id, node_id,
attempt) on node_execution_checkpoints. Partial indexes cover 'active' queries: workflows
WHERE status = 'active', executions WHERE status = 'running'.
Partitioning: workflow_executions, node_execution_checkpoints, platform_events,
audit_logs, metering_events, and ai_usage are partitioned monthly by occurred_at. Hot
partitions (current + previous 12 months) live on the primary PostgreSQL cluster; older
partitions are detached and archived to object storage in Parquet format, accessible via a
slow-query path. Retention: executions 13 months hot + 7 years cold (compliance), audit
logs 90 days hot + 7 years cold, metering events 13 months hot + 7 years cold, platform
events 90 days hot + 1 year cold.

## 11. Redis & BullMQ Architecture

Redis is the transient coordination layer for queues, distributed locks, rate limiting,
session acceleration, and short-lived caches. BullMQ provides job scheduling, retries,
delayed jobs, and worker concurrency control. The queue design separates control-plane
jobs from execution-plane jobs so that heavy workflow traffic cannot starve product
operations.

### 11.1 Queue Topology

**Table 17. Queue Catalog**

Queue Purpose Priority Tiers Persistence
workflow-execution Workflow run jobs high / default / low AOF every-write
workflow-execution-
recovery
Re-leased runs from
crashed workers
high AOF every-write
webhook-delivery Outbound webhook
fanout
default AOF every-write
ai-run AI orchestrator jobs default AOF every-second
billing-rollup Hourly usage
aggregation
default AOF every-second
billing-reconciliation Daily raw-vs-rollup
reconciliation
low AOF every-second
notification-outbound Email / in-app / push
delivery
default AOF every-second
template-publish Template catalog
sync
low RDB only
connector-install Tenant connector
install jobs
default AOF every-second
audit-export Compliance export
jobs
low RDB only

### 11.2 Redis Use Cases

**Table 18. Redis Use Cases**

Use Case Example Notes
Job queues workflow-execution, webhook-
delivery, ai-run
Distinct queues and priorities
per use case
Distributed locks workflow publish lock,
promotion lock
Prevents duplicate concurrent
mutations
Use Case Example Notes
Rate limits API key quotas, connector
API throttles
Tenant-aware token buckets
Caches Schema metadata,
permissions, template search
Short TTL and explicit
invalidation
Session acceleration JWT/session lookup, MFA
state
Never treat cache as source
of truth
Redis is deployed in cluster mode (3 primary + 3 replica shards) for HA. Persistence is
configured per-queue based on criticality: billing-adjacent queues use AOF every-write (no
data loss on Redis failover); notification and template queues use AOF every-second
(acceptable 1-second data loss, recoverable from source-of-truth). Caches use RDB-only
persistence because they are rebuildable from PostgreSQL. Tier 3 (Dedicated Cluster)
tenants get a dedicated Redis instance — no shared Redis infrastructure.

## 12. API Gateway & Versioning Policy

The gateway standardizes auth, request logging, routing, rate limiting, and schema-
aware validation. It is thin enough to avoid business logic but rich enough to enforce security
controls, tenant context extraction, and content negotiation across REST and GraphQL
surfaces. All requests carry tenant context explicitly or via authenticated session resolution.
Authorization checks are repeated at the gateway and service level for defense in depth.
The gateway must emit structured trace IDs and correlation IDs for every request.

### 12.1 API Versioning Policy (NEW)

v1.0 referenced /api/v1/ but did not state a versioning policy. v2.0 commits to a specific
policy: path-based versioning with a six-month deprecation window. Major versions are
bumped for breaking changes (changed request shape, changed response shape, removed
endpoint, changed auth model); minor changes (additive fields, new optional parameters,
new endpoints) do not bump the version. The cadence target is one major version per year,
minor releases as needed.

**Table 19. API Versioning Policy**

Aspect Policy
Versioning scheme Path-based: /api/v1/, /api/v2/, ...
Major version bump trigger Breaking change to request shape, response
shape, auth model, or endpoint removal
Minor change (no version bump) Additive fields, new optional parameters, new
endpoints
Deprecation window 6 months dual-run (both v(n) and v(n+1)
supported) + 6 months sunset (v(n) returns
deprecation header, still functional)
Aspect Policy
Deprecation signal Sunset and Deprecate HTTP headers on v(n)
responses during sunset window
Removal v(n) removed 12 months after v(n+1) GA
OpenAPI contract OpenAPI spec is source of truth; clients
generated via openapi-generator
GraphQL versioning Schema evolution via deprecation directives;
no path versioning for GraphQL
Webhook payload versioning x-payload-version header; consumer
idempotency by event_id (see Section 14)
SDK versioning SDK package version follows semver; major
SDK version aligns with API major version
Versioning decisions are recorded as ADRs. Breaking changes require: (1) an ADR
explaining the change and the migration path; (2) a migration guide published in the
developer documentation; (3) a customer notification at least 90 days before the new
version's GA; (4) a deprecation header on the old version's responses during the sunset
window. The OpenAPI spec is the source of truth for REST clients — generated clients are
versioned alongside the spec; hand-written clients are discouraged but supported via the
published spec.

## 13. REST API Reference

The REST API is the operational contract for most external and internal integrations. A
production reference must specify method, path, purpose, auth mode, request validation,
response schema, and error semantics. The table below is the baseline catalog for v2.0; full
OpenAPI 3.1 specs are maintained in the repository under services/api-gateway/openapi/
and rendered to the developer portal.

### 13.1 Endpoint Catalog

**Table 20. REST Endpoint Catalog (v2.0 baseline)**

Domain Method Path Auth Notes
Auth POST /api/v1/auth/login Public MFA + SSO
supported;
idempotency via
x-idempotency-
key
Auth POST /api/v1/auth/
logout
Session Invalidates
refresh token
Auth POST /api/v1/auth/
refresh
Refresh token Rotates access
token
Domain Method Path Auth Notes
Tenants GET /api/v1/
tenants/me
User Bootstrap profile
Users GET /api/v1/users Admin Paging + search
RBAC GET / POST /api/v1/roles Admin List / create
roles
Workflows GET / POST /api/v1/
workflows
User / Editor List / create draft
Workflows GET / PUT /api/v1/
workflows/{id}
User / Editor Get / update
draft
Workflows POST /api/v1/
workflows/{id}/
publish
Editor Creates
immutable
version
Workflows POST /api/v1/
workflows/{id}/
clone
Editor Copy with new
identity
Executions GET /api/v1/
executions
User Filter by tenant +
workflow
Executions GET /api/v1/
executions/{id}
User Includes run
state +
checkpoints
Executions POST /api/v1/
executions/{id}/
retry
Operator Idempotent retry
Executions POST /api/v1/
executions/{id}/
cancel
Operator Soft cancel
Triggers POST /api/v1/triggers/
webhook
Signed webhook Public endpoint
with HMAC
verification
Connectors GET / POST /api/v1/
connectors
User / Admin Search catalog /
create (admin
only)
Connectors POST /api/v1/
connectors/{id}/
install
Editor Tenant-bound
install
Templates GET / POST /api/v1/templates User / Admin Browse / publish
(signed artifact)
Dashboards GET / POST /api/v1/
dashboards
User / Editor List / create
Dashboards POST /api/v1/
dashboards/
{id}/publish
Editor Creates version
Domain Method Path Auth Notes
Billing GET /api/v1/billing/
usage
Billing admin Read-only usage
summary
Billing GET /api/v1/invoices Billing admin Paged list
AI POST /api/v1/ai/runs User Metered, traced;
supports SSE for
streaming
AI GET /api/v1/ai/models User Model registry
Admin GET /api/v1/audit Admin Security-
sensitive search
Admin POST /api/v1/feature-
flags
Admin Policy-gated

### 13.2 OpenAPI Skeletons (NEW)

Below are OpenAPI 3.1 skeletons for five critical endpoints. These are excerpts — the
full spec lives in the repository. Each skeleton shows the request body schema, response
schema, error envelope, and idempotency-key header where applicable.

#### 13.2.1 POST /api/v1/auth/login

openapi: 3.1.0
paths:
/api/v1/auth/login:
post:
summary: Create a session
security: []
parameters:

- in: header
  name: x-idempotency-key
  schema: { type: string, format: uuid }
  required: true
  description: Prevents duplicate session creation on retry
  requestBody:
  required: true
  content:
  application/json:
  schema:
  type: object
  required: [email, password]
  properties:
  email: { type: string, format: email }
  password: { type: string, minLength: 8 }
  mfa_code: { type: string, pattern: '^\d{6}$' }
sso_assertion: { type: string }
responses:
'200':
description: Session created
content:
application/json:
schema:
type: object
properties:
access_token: { type: string }
refresh_token: { type: string }
expires_in: { type: integer, example: 3600 }
tenant_context:
$ref: '#/components/schemas/TenantContext'
  '401': { $ref: '#/components/responses/Unauthorized' }
  '422': { $ref: '#/components/responses/ValidationError' }
  '429': { $ref: '#/components/responses/RateLimited' }

#### 13.2.2 POST /api/v1/workflows/{id}/publish

/api/v1/workflows/{id}/publish:
post:
summary: Publish an immutable workflow version
security: [{ bearerAuth: [] }]
parameters:

- in: path
  name: id
  required: true
  schema: { type: string }
- in: header
  name: x-idempotency-key
  schema: { type: string, format: uuid }
  required: true
  requestBody:
  content:
  application/json:
  schema:
  type: object
  properties:
  expected_draft_version:
  type: integer
  description: Optimistic concurrency token
  release_notes: { type: string }
  responses:
  '201':
  description: Immutable version created
  content:
  application/json:
  schema:
  type: object
  properties:
  version_id: { type: string }
  version_number: { type: integer }
  checksum: { type: string }
  published_at: { type: string, format: date-time }
  '409': { $ref: '#/components/responses/Conflict' }
  '422': { $ref: '#/components/responses/ValidationError' }

#### 13.2.3 POST /api/v1/triggers/webhook

/api/v1/triggers/webhook:
post:
summary: Receive a webhook trigger
security: []
parameters:

- in: header
  name: x-webhook-signature
  schema: { type: string }
  required: true
  description: HMAC-SHA256 of the body using the endpoint secret
- in: header
  name: x-webhook-timestamp
  schema: { type: integer }
  required: true
  description: Unix seconds; rejects > 5min skew
  requestBody:
  required: true
  content:
  application/json:
  schema: { type: object }
  responses:
  '202':
  description: Trigger accepted, execution queued
  content:
  application/json:
  schema:
  type: object
  properties:
  execution_id: { type: string }
  queued_at: { type: string, format: date-time }
  '401': { description: 'Invalid signature or stale timestamp' }

#### 13.2.4 POST /api/v1/connectors/{id}/install

/api/v1/connectors/{id}/install:
post:
summary: Install a connector version into a tenant
security: [{ bearerAuth: [] }]
parameters:

- in: path
  name: id
  required: true
  schema: { type: string }
- in: header
  name: x-idempotency-key
  schema: { type: string, format: uuid }
  required: true
  requestBody:
  required: true
  content:
  application/json:
  schema:
  type: object
  required: [version_id, secret_ref]
  properties:
  version_id: { type: string }
  secret_ref:
  type: string
  description: Vault path to bound credentials
  config: { type: object }
  responses:
  '201':
  description: Connector installed
  content:
  application/json:
  schema:
  type: object
  properties:
  install_id: { type: string }
  status: { type: string, example: 'active' }
  '409': { description: 'Version already installed' }
  '422': { $ref: '#/components/responses/ValidationError' }

#### 13.2.5 POST /api/v1/ai/runs

/api/v1/ai/runs:
post:
summary: Execute an AI request (metered and traced)
security: [{ bearerAuth: [] }]
parameters:

- in: header
  name: x-idempotency-key
  schema: { type: string, format: uuid }
  required: true
- in: header
  name: accept
  schema:
  type: string
  enum: [application/json, text/event-stream]
  description: text/event-stream enables SSE streaming
  requestBody:
  required: true
  content:
  application/json:
  schema:
  type: object
  required: [prompt_version_id, model]
  properties:
  prompt_version_id: { type: string }
  model: { type: string, example: 'gpt-4o' }
  parameters:
  type: object
  properties:
  temperature: { type: number, default: 0.7 }
  max_tokens: { type: integer, default: 1024 }
  fallback_chain:
  type: array
  items: { type: string }
  rag_config:
  type: object
  properties:
  knowledge_base_id: { type: string }
  top_k: { type: integer, default: 5 }
  variables: { type: object }
  responses:
  '200':
  description: AI run completed (or streaming)
  content:
  application/json:
  schema:
  type: object
  properties:
  run_id: { type: string }
  output: { type: string }
  token_usage:
  type: object
  properties:
  prompt_tokens: { type: integer }
  completion_tokens: { type: integer }
  cached_tokens: { type: integer }
  cost_usd: { type: number }
  prompt_version_id: { type: string }
  model: { type: string }
  provider: { type: string }
  text/event-stream:
  schema: { type: string }
  '402': { description: 'Tenant token budget exhausted (hard cutoff)' }
  '422': { $ref: '#/components/responses/ValidationError' }

### 13.3 Standard Error Envelope

{
"error": {
"code": "VALIDATION_ERROR",
"message": "email must be a valid email address",
"details": [
{ "field": "email", "rule": "format", "value": "not-an-email" }
],
"correlation_id": "01HNQK8X3F6...",
"retry_after_seconds": null,
"documentation_url": "https://errors.longox.com/VALIDATION_ERROR"
}
}

## 14. GraphQL Schema & SDL Excerpt

GraphQL is used for highly composable read models, editor bootstraps, dashboard
previews, and dependent UI data fetching. It complements REST rather than replacing it.
Mutations remain narrow and predictable; subscriptions are not used in v2.1 (SSE is the
accepted realtime transport per ADR-008). The SDL is the source of truth for GraphQL
clients; TypeScript types are generated via graphql-codegen.

### 14.1 When to Use GraphQL vs REST

**Table 21. GraphQL vs REST Decision Guide**

Use Case Use GraphQL Use REST
Editor bootstrap (load
workflow + version + nodes +
edges in one round trip)
✓
Use Case Use GraphQL Use REST
Dashboard preview (load
dashboard + widgets +
bindings)
✓
Workflow publish (mutation
with side effects)
✓
Webhook trigger (public,
signed)
✓
List + filter + page Either Either
AI run (long-running,
streaming)
(SSE)✓
Billing invoice fetch ✓

### 14.2 SDL Excerpt

The SDL excerpt below covers the core types and the most-used queries and
mutations. The full schema (600+ lines) is maintained in the repository at services/api-
gateway/graphql/schema.graphql.
type Tenant {
id: ID!
name: String!
tier: TenantTier!
planId: String!
region: String!
memberships: [Membership!]!
}

enum TenantTier { SHARED DEDICATED_NAMESPACE DEDICATED_CLUSTER }

type Membership {
userId: ID!
tenantId: ID!
role: Role!
status: MembershipStatus!
}

type Workflow {
id: ID!
tenantId: ID!
name: String!
status: WorkflowStatus!
currentVersionId: ID
tags: [String!]!
currentVersion: WorkflowVersion
versions(first: Int, after: String): WorkflowVersionConnection!
}

type WorkflowVersion {
id: ID!
versionNumber: Int!
graph: GraphSnapshot!
checksum: String!
createdBy: ID!
publishedAt: String!
}

type GraphSnapshot {
nodes: [Node!]!
edges: [Edge!]!
variables: [Variable!]!
policies: [Policy!]!
}

type Execution {
id: ID!
workflowVersionId: ID!
status: ExecutionStatus!
startedAt: String!
finishedAt: String
stepResults: [StepResult!]!
checkpoints: [Checkpoint!]!
}

type Dashboard {
id: ID!
tenantId: ID!
title: String!
status: DashboardStatus!
currentVersionId: ID
currentVersion: DashboardVersion
}

type DashboardVersion {
id: ID!
versionNumber: Int!
layout: JSON!
widgets: [Widget!]!
checksum: String!
}

type Connector {
id: ID!
slug: String!
name: String!
trustLevel: TrustLevel!
versions: [ConnectorVersion!]!
}

type Template {
id: ID!
category: String!
visibility: Visibility!
versions: [TemplateVersion!]!
installCount: Int!
}

type Query {
me: CurrentUser!
tenants: [Tenant!]!
workflows(filter: WorkflowFilter, first: Int, after: String): WorkflowConnection!
workflow(id: ID!): Workflow
executions(filter: ExecutionFilter, first: Int, after: String): ExecutionConnection!
execution(id: ID!): Execution
dashboards: [Dashboard!]!
connector(id: ID!): Connector
templates(category: String, first: Int, after: String): TemplateConnection!
}

type Mutation {
publishWorkflow(input: PublishWorkflowInput!): PublishWorkflowPayload!
createDashboard(input: CreateDashboardInput!): CreateDashboardPayload!
installConnector(input: InstallConnectorInput!): InstallConnectorPayload!
promoteEnvironment(input: PromoteEnvironmentInput!): PromoteEnvironmentPayload!
}

input PublishWorkflowInput {
workflowId: ID!
expectedDraftVersion: Int!
releaseNotes: String
}

type PublishWorkflowPayload {
workflowVersion: WorkflowVersion!
validationResult: ValidationResult!
}

type ValidationResult {
valid: Boolean!
errors: [ValidationError!]!
warnings: [ValidationWarning!]!
}

### 14.3 Persisted Queries

For security and performance, the production GraphQL endpoint accepts persisted
queries only: clients send a query hash instead of the full query text. New queries are added
to the persisted-query allow-list via CI; this prevents ad-hoc query injection and gives the
platform team visibility into what queries are in production use. The development
environment allows ad-hoc queries for exploration.

## 15. RBAC Model

Authorization is hierarchical and tenant-scoped. The model supports global platform
roles, tenant roles, environment roles, and resource-specific grants. Permissions are
expressed as atomic capabilities (e.g., workflow.publish, execution.retry, billing.view), while
roles are bundles of permissions with explicit scope boundaries. The authorization engine
returns both an allow/deny decision and a reason code so that the UI can explain why an
action is unavailable without leaking unnecessary details.

### 15.1 Scope Hierarchy

**Table 22. RBAC Scope Hierarchy**

Scope Example Role Representative Permissions
Platform Super admin tenant.support,
policy.management,
global.catalog.moderate
Tenant Workspace admin user.manage,
workflow.manage,
dashboard.manage,
billing.settings
Environment Release manager version.promote,
deployment.rollback,
change.approve
Resource Connector owner connector.edit,
connector.version.publish,
connector.release
Read-only Viewer workflow.view,
dashboard.view,
execution.view, report.view

### 15.2 Permission Matrix (Common Roles × Action Codes)

**Table 23. Permission Matrix**

Action Code Workspace
Admin
Editor Operator Billing
Admin
Viewer
workflow.crea
te
✓ ✓
workflow.publ
ish
✓ ✓
workflow.dele
te
✓
execution.vie
w
✓ ✓ ✓ ✓
execution.retr
y
✓ ✓
execution.ca
ncel
✓ ✓
connector.ins
tall
✓ ✓
connector.rev
oke
✓
dashboard.cr
eate
✓ ✓
Action Code Workspace
Admin
Editor Operator Billing
Admin
Viewer
dashboard.pu
blish
✓ ✓
template.publ
ish
✓
billing.view ✓ ✓
billing.manag
e
✓ ✓
audit.search ✓
user.manage ✓
role.manage ✓
feature_flag.s
et
✓
= granted; empty = denied. Custom roles can be assembled from the atomic✓
permission catalog at the tenant level; the matrix above shows the five most common pre-
defined roles. Permission checks are enforced at the API gateway (coarse) and at the
service layer (fine-grained, resource-specific) for defense in depth.

## 16. Billing, Metering & Unit Economics

Billing is usage-based with plan entitlements and overage support. Metering records
atomic events at the moment of usage; aggregation rolls them into invoiceable records
asynchronously. The architecture is resilient to duplicate events (idempotent ingest) and
delayed ingestion (reconciliation job). v2.0 makes pricing and unit economics explicit.

### 16.1 Metered Dimensions

**Table 24. Metered Dimensions**

Dimension Metered At Aggregation
Workflow executions Run accepted Daily + monthly rollup per
tenant
Node executions Node completed Daily + monthly rollup per
tenant
AI prompt tokens AI run completed Daily + monthly rollup per
(tenant, model)
AI completion tokens AI run completed Daily + monthly rollup per
(tenant, model)
AI RAG queries RAG retrieval completed Daily + monthly rollup per
tenant
Dimension Metered At Aggregation
API calls (metered endpoints) Request received Daily + monthly rollup per
tenant
Storage (GB-month) End of day Monthly rollup per tenant
Marketplace installs Install completed Per-install record (one-time
charge)
Premium seats Provisioned Monthly rollup per tenant

### 16.2 Metering Pipeline

Metering events are written to the metering_events table (append-only, partitioned
monthly) at the moment of usage. A hourly rollup job (running on the billing-rollup queue)
aggregates raw events into usage_rollups per (tenant, metric, period). A daily reconciliation
job compares the sum of raw events for a period to the rollup; discrepancies trigger an alert
and a re-rollup. Invoices are generated from rollups, never from raw events directly — this
protects invoice stability against late-arriving events.

### 16.3 Pricing Tiers

**Table 25. Pricing Tiers**

Plan Monthly
Base
Execution
s
AI Tokens Seats Multi-
Tenancy
Tier
Support
Starter $49 5,000 1M 3 Shared Community
Pro $499 50,000 10M 10 Shared Email
(24h)
Team $1,999 250,000 50M 25 Dedicated
Namespac
e
Email +
chat (8h)
Enterprise Custom Custom
commit
Custom
commit
Custom Dedicated
NS or
Cluster
Slack +
named
CSM (4h)

**Table 26. Overage Rates**

Dimension Starter Pro Team Enterprise
Workflow
execution
$0.02 / exec $0.015 / exec $0.01 / exec Negotiated
AI prompt token
(GPT-4o)
$5 / 1M $4 / 1M $3.50 / 1M Negotiated
AI completion
token (GPT-4o)
$15 / 1M $12 / 1M $10 / 1M Negotiated
Storage (GB-
month)
$0.25 $0.20 $0.15 Negotiated
Dimension Starter Pro Team Enterprise
Premium seat $15 / seat $12 / seat $10 / seat Negotiated

### 16.4 Unit Economics

Target unit economics per plan, at steady-state volume: subscription gross margin ≥
70% (cost of goods = cloud infrastructure allocated to tenant + support allocation); AI token
gross margin ≥ 50% after provider cost (OpenAI / Anthropic / Google) and ≥ 30% after RAG
infrastructure cost (embedding compute, vector storage, retrieval compute). Enterprise tier
with Dedicated Cluster has lower subscription gross margin (~40%) because dedicated
infrastructure is passed through at cost plus a margin, but higher AI token margin (60%+)
because the tenant's volume justifies negotiated provider rates.
The platform's blended gross margin target is 65% at Year 2 scale. Provider
concentration risk is monitored monthly: if any single LLM provider exceeds 60% of total AI
spend, the AI platform team is alerted to expand fallback-provider usage. Provider cost
changes (e.g., OpenAI reduces pricing) flow through to customers within 30 days via
overage rate adjustments, preserving margin.

### 16.5 Invoice Traceability

Every invoice line is traceable back to raw metering events. The invoice_lines table
stores (invoice_id, metric_code, quantity, unit_price, period_start, period_end); the
usage_rollups table provides the aggregation; the metering_events table provides the raw
events. A customer or auditor can drill from invoice → rollup → raw events for any line item.
This traceability is a sales tool for Enterprise prospects ('your CFO can audit every charge')
and a compliance requirement for SOC 2.

### 16.6 Enterprise Commitments

Enterprise contracts include a monthly committed volume (executions + tokens +
seats) at a discounted rate, plus overage rates above the commit. Commits are billed
monthly regardless of usage; unused commits do not roll over. Annual commits (paid
upfront) receive an additional 10% discount. Enterprise customers with Dedicated Cluster
tier negotiate infrastructure pass-through separately.

## 17. Connector Marketplace & SDK

The marketplace is the supply chain for integrations. It supports connector publishing,
semantic versioning, trust levels, installation flows, dependency updates, and tenant-
specific credential binding. Connectors can be first-party, partner, or community-maintained,
but only signed and policy-compliant artifacts may enter production environments.

### 17.1 Marketplace Objects

**Table 27. Marketplace Object Lifecycle**

Object Description Lifecycle
Connector listing Public metadata about an
integration package
Draft → Reviewed →
Published → Deprecated
Connector version Immutable implementation +
manifest
Built → Signed → Released
→ Revoked
Installation Tenant-scoped deployment of
a connector
Installed → Configured →
Active → Retired
Bundle Grouped connectors or
solution pack
Created → Promoted →
Installed
Review record Security and quality checks Pending → Approved →
Rejected

### 17.2 Connector SDK & Manifest

The SDK defines how connectors declare authentication, inputs, actions, events,
output schemas, polling behavior, rate limits, and webhook endpoints. It makes connector
development simple without sacrificing type safety or platform policy enforcement.
Manifests are signed via Sigstore; the signature is verified at install time and at runtime on
each cold-start.
{
"name": "crm.contact.sync",
"version": "1.0.0",
"auth": ["oauth2", "api_key"],
"actions": [
{
"name": "upsertContact",
"input_schema": "schemas/upsert_contact.json",
"output_schema": "schemas/contact.json",
"idempotent": true,
"timeout_ms": 30000,
"retry": { "max_attempts": 3, "backoff": "exponential" }
},
{
"name": "findContact",
"input_schema": "schemas/find_contact.json",
"output_schema": "schemas/contact_list.json",
"idempotent": true,
"timeout_ms": 10000
}
],
"triggers": [
{
"name": "contactUpdated",
"type": "webhook",
"payload_schema": "schemas/contact_updated.json"
}
],
"permissions": ["contacts.read", "contacts.write"],
"compatibility": { "platform_min": "2.0.0" },
"signature": {
"algorithm": "sigstore",
"cert_issuer": "platform-connector-ca",
"cert_fingerprint": "sha256:..."
}
}
Action handlers are pure where possible and idempotent by contract. Credential
access occurs through tenant-scoped secret references (Vault paths), never inline secrets.
Connectors must expose structured errors and retry hints for platform orchestration. The
connector runtime enforces per-action timeouts, per-tenant rate limits, and per-call log
redaction.

### 17.3 Trust Tiers

**Table 28. Connector Trust Tiers**

Tier Review Process Default Install Policy Badge
First-party Built by platform
team; full security
review + pen test
Allowed by default in
production
Verified (platform)
Partner Built by named
partner; security
review + signed
agreement
Allowed after admin
opt-in
Verified (partner)
Community Built by community;
automated security
scan only
Sandbox only by
default; production
requires admin opt-in

- manual review
  Community
  The marketplace separates community trust from platform trust. First-party connectors
  may be allowed by default; third-party packages may require explicit review, trust badges,
  and organization policy approval before production installation. Every install records the
  connector version, signature verification result, and approver identity in the audit log.

## 18. Template Registry & Environment Promotion

### 18.1 Template Types

**Table 29. Template Types**

Template Type Examples Distribution Model
Workflow template Lead routing, onboarding,
incident triage
Public, private, or tenant-only
Dashboard template Operations console, executive
summary, KPI board
Public or private
Template Type Examples Distribution Model
Solution pack Industry bundle (workflows +
dashboards + connectors)
Curated enterprise pack
AI starter template Prompt chains and assistant
workflows
Versioned and model-aware
Templates package reusable blueprints. The registry supports category browsing,
compatibility metadata, region restrictions, trust tags, version pinning, and preview
rendering. Templates are signed artifacts; install-time validation checks signature, platform
version compatibility, permission requirements, and dependency availability before
activation.

### 18.2 Environment Promotion

Environment promotion governs how versions move from development to staging to
production. Promotion records capture source artifact, destination environment, approvals,
checksum, author, and rollback metadata. Every promotion is reproducible and policy-
checked. Promotion is versioned, not mutable in place: rolling back rebinds the live alias to a
previously approved version rather than editing live records. Approval gates can require one
or more reviewers depending on environment policy. Environment parity is measured and
surfaced as part of release readiness.
[Draft] --validate--> [Save Draft] --request publish--> [Immutable Version]
|
v
[Audit event] [Optional: request env promotion]
|
v
[Approval gate] --approved--> [Release record]
|
v
[Live alias points to published version]
|
[Rollback switches alias back to prior version]

**Figure 5. Publishing and Promotion Flow**

### 18.3 Promotion Contract

Every promotion records: source version ID, target environment, approver identity,
policy check result (pass / fail with reason), rollback target (previous live version ID),
promotion timestamp, and correlation ID for audit. The promotion contract is the audit-trail
artifact that satisfies 'who deployed what, when, with whose approval, and how do we undo
it' for any compliance inquiry.

## 19. Event Schema & Versioning

v1.0 listed event names but did not specify payload schema, versioning policy, or
consumer idempotency rules. v2.0 specifies all three. The platform uses two distinct event
channels: platform_events (internal orchestration, optimized for throughput and consumer
fan-out) and audit_logs (compliance, optimized for retention and search). They are related
but not interchangeable: audit events are immutable, retention is 7 years; platform events
are immutable but retention is 1 year (with 90 days hot).

### 19.1 Mandatory Event Fields

Every platform event MUST include the following fields. Producers are validated at
build time via a JSON Schema check in CI; events missing required fields are rejected at
ingest.
{
"event*id": "evt_01HNQK8X3F6T9JZ3W2V1Y7N8MP", // UUID, primary dedupe key
"event_type": "workflow.published", // dotted, namespace.type
"event_version": 2, // integer, bumped on breaking change
"occurred_at": "2026-06-17T10:23:04.512Z", // ISO 8601 UTC
"tenant_id": "tnt_01HNQK8X3F6T9JZ3W2V1Y7N8MP", // tenant scope; null for platform-
level events
"correlation_id": "corr_01HNQK8X3F6T9JZ3W2V1Y", // for distributed tracing
"aggregate_id": "wf_01HNQK8X3F6T9JZ3W2V1Y7N8MP", // the entity this event pertains
to
"actor_id": "usr_01HNQK8X3F6T9JZ3W2V1Y7N8MP", // who/what triggered the event
"payload": { /* event-type-specific, see catalog \_/ },
"schema_url": "https://schemas.longox.com/events/workflow.published.v2.json"
}

### 19.2 Versioning Policy

Additive changes (new optional fields in payload) bump the minor version but do NOT
require a new event_type — consumers ignore unknown fields. Breaking changes (removed
fields, changed types, changed semantics) require a new event_type (e.g.,
workflow.published → workflow.published.v2). The platform supports dual-publishing both
event types during a migration window; consumers opt into the new type at their own pace.

### 19.3 Consumer Idempotency Rule

Consumers MUST dedupe by event_id. The platform provides a consumer_offsets
table that tracks (consumer_name, event_id, processed_at, status); consumers can use this
directly or implement their own dedupe store. At-least-once delivery is guaranteed; exactly-
once is the consumer's responsibility. The processing log table records every event a
consumer has processed, making idempotent retry safe.
CREATE TABLE consumer_offsets (
consumer_name TEXT NOT NULL,
event_id TEXT NOT NULL,
aggregate_id TEXT NOT NULL,
processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
status TEXT NOT NULL CHECK (status IN
('processing','completed','failed','dead_letter')),
error TEXT,
PRIMARY KEY (consumer_name, event_id)
);
CREATE INDEX ON consumer_offsets (consumer_name, processed_at DESC);

### 19.4 Event Catalog

**Table 30. Event Catalog**

Event Type When Emitted Key Consumers
workflow.created Draft created, metadata
initialized
Workflow service, search
indexing
workflow.published Immutable version created Execution service, audit,
cache invalidation, search
indexing
workflow.activated Live alias moved to version UI state updates, notifications
execution.started Run accepted and scheduled Monitoring, billing, UI live
updates
execution.completed Terminal success state Analytics, notifications,
invoice accrual
execution.failed Terminal failure state Alerts, retry workflows,
support tooling
execution.checkpoint.persiste
d
Node-level checkpoint saved Recovery service, monitoring
connector.installed Tenant install activated Runtime enablement, billing
tracking
connector.revoked Install or version no longer
allowed
Runtime access disable, user
alerts
template.published Template available for install Marketplace search, catalog
sync
usage.recorded Atomic billable event emitted Billing rollup, invoice
generation
ai.run.completed AI call finished with usage
metrics
Token billing, performance
analytics
ai.run.guardrail.violation Guardrail blocked input or
output
Security alerts, audit
environment.promoted Version promoted to
environment
Release audit, notifications
environment.rolled_back Live alias reverted Release audit, alerts
billing.invoice.generated Invoice created Notification service, billing
portal

### 19.5 JSON Schema Example

Each event type has a published JSON Schema. The schema*url field in every event
points to the canonical schema. Schemas are versioned in the repository under
packages/shared-types/schemas/events/ and published to a public schema registry.
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"$id": "https://schemas.longox.com/events/workflow.published.v2.json",
"title": "workflow.published v2",
"type": "object",
"required": ["event_id","event_type","event_version","occurred_at","tenant_id",
"correlation_id","aggregate_id","actor_id","payload","schema_url"],
"properties": {
"event_id": { "type": "string", "pattern": "^evt*" },
"event*type": { "const": "workflow.published" },
"event_version": { "const": 2 },
"occurred_at": { "type": "string", "format": "date-time" },
"tenant_id": { "type": "string", "pattern": "^tnt*" },
"correlation*id": { "type": "string" },
"aggregate_id": { "type": "string", "pattern": "^wf*" },
"actor_id": { "type": "string" },
"payload": {
"type": "object",
"required": ["workflow_id","version_id","version_number","checksum"],
"properties": {
"workflow_id": { "type": "string" },
"version_id": { "type": "string" },
"version_number": { "type": "integer", "minimum": 1 },
"checksum": { "type": "string" },
"release_notes": { "type": "string" }
}
},
"schema_url": { "type": "string", "format": "uri" }
}
}

## 20. Security, Threat Model & Compliance

Security must be layered across identity, transport, storage, execution, and supply
chain. The main threats are tenant data leakage, connector abuse, prompt injection,
credential exfiltration, privilege escalation, queue poisoning, replay attacks, and unsafe
template promotion. Defense in depth is mandatory: no single authorization check, queue
boundary, or client-side control is treated as sufficient protection.

### 20.1 Threat Model

**Table 31. Threat Model**

Threat Attack Vector Primary Mitigations
Tenant breakout Authorization bug, query leak,
export bug
Row-level tenant_id scoping,
service-layer enforcement,
test fixtures, audit logging,
tenant isolation tests in CI
Credential theft Logging, UI leakage, bad
secret handling
Vault references, masking,
redaction, least privilege,
rotation, no inline secrets in
manifests
Queue poisoning Injected jobs or malformed
payloads
Signed enqueue paths, queue
segmentation, payload
schema validation
Prompt injection AI step coerced into unsafe
tool use
Tool allow-list, output filtering,
prompt isolation, system-
prompt hardening
Supply chain compromise Malicious connector or
template bundle
Sigstore signing, review
gates, provenance checks,
version pinning
Privilege escalation Overbroad roles or
compromised account
MFA, RBAC, break-glass
controls, session revocation,
policy logs
Replay attack Duplicate webhook or queue
delivery
Idempotency keys, nonce
validation, dedupe store,
leases
Billing fraud Artificial usage inflation Append-only metering,
reconciliation, anomaly
detection, per-tenant rate
ceilings
Insider abuse Unauthorized admin actions Audit trail, approval gates,
separation of duties, break-
glass alerts
Denial of service Floods on API or execution
endpoints
Rate limits, quotas,
backpressure, WAF, per-
tenant token buckets

### 20.2 Compliance Posture (NEW)

v2.0 maps platform controls to specific compliance frameworks. This mapping is the
basis for customer due-diligence questionnaires and external audit preparation.
Compliance is treated as a first-class engineering concern — every control has an owner, an
evidence artifact, and an audit cadence.

**Table 32. Compliance Framework Mapping**

Framework Scope Target Status Key Controls Audit Cadence
SOC 2 Type II Platform +
Dedicated
Namespace tiers
Achieved by
month 12
CC1–CC8;
explicit controls
for access,
change mgmt,
monitoring,
encryption,
incident
response
Annual external
audit
ISO 27001 Platform +
Dedicated
Namespace tiers
Achieved by
month 18
Annex A
controls; ISMS
documented;
risk register
maintained
Surveillance
audit annually;
recertification
every 3 years
GDPR All EU/EEA
customers + any
customer
processing EU
personal data
Day-1 ready DPA available;
RTBF workflow
documented;
data residency
EU region;
subprocessor list
published; DPIA
template
available
Continuous +
customer-driven
HIPAA-ready Dedicated
Cluster tier only;
BAA available
Available on
request
PHI logging
disabled by
default;
encryption at
rest + in transit;
BAA with sub-
processors;
access controls

- audit logs;
  breach
  notification
  process
  Annual BAA
  review +
  customer audit
  rights
  PCI-DSS Out of scope N/A —
  delegated to
  Stripe
  Billing delegated
  to Stripe (PCI-
  DSS Level 1);
  platform never
  sees cardholder
  data
  N/A (Stripe's
  responsibility)
  Compliance evidence artifacts are stored in a compliance evidence repository with
  version control. Each artifact (policy document, control implementation evidence, audit log
  sample, penetration test report) is linked to the control it satisfies. This repository is the
  source of truth for audits — an auditor can be granted read access and self-serve most of
  the evidence they need without engineering intervention.

### 20.3 Secrets Management

Secrets are managed in HashiCorp Vault. The platform uses dynamic secrets for
database credentials (short-lived, auto-rotated every 30 days) and static secrets for third-
party API keys (rotated on a 90-day cadence with manual approval for high-privilege keys).
Per-tenant encryption keys are managed in AWS KMS (or cloud-equivalent) with a per-
tenant key ID; tenant data is encrypted at rest with the tenant's key, enabling cryptographic
separation between tenants even on shared infrastructure.
OAuth client secrets for connector integrations are stored in Vault with per-install
references; rotation of an OAuth secret does not require reinstalling the connector — the
platform updates the Vault path and the connector's next call picks up the new value. Secret
rotation cadence is enforced by a Vault policy that marks secrets older than their rotation
period as 'expired'; expired secrets are auto-rotated if the rotation is non-disruptive, or
surfaced for manual rotation if it requires coordination.

### 20.4 Data Residency

Tenant placement is recorded at provisioning time as a region pin. Cross-region
replication is prohibited for pinned tenants: their PostgreSQL data stays in the home region,
their object storage stays in the home region's bucket, their Redis stays in the home region's
cluster. The platform's global services (identity, marketplace catalog mirror) are read-only
from the tenant's perspective and do not store tenant PII — they are exempt from the
residency pin.
EU customers are pinned to the eu-west-1 region by default; US customers to us-
east-1; APAC customers to ap-southeast-1. Customers with global operations can request
multi-region tenancy where the tenant is pinned to a primary region but read replicas are
available in secondary regions for latency — but writes always go to the primary, and
replicas do not store PII that exceeds the primary region's residency policy.

## 21. Kubernetes Deployment & CI/CD

### 21.1 Namespace Pattern

The platform deploys as a Kubernetes-based set of stateless services, workers, and
stateful dependencies. Workloads are separated by function and scaling profile. Control-
plane services scale independently from execution workers, and AI or enterprise workloads
may require dedicated node pools or isolated namespaces.
• platform-control — auth, workflow, connector, template, billing services (stateless
API).
• platform-execution — execution-service workers, scheduler-service, ai-service
workers (queue-driven).
• platform-observability — log aggregators, metrics collectors, trace collectors (write-
heavy).
• platform-enterprise-<tenant> — dedicated execution workers for Tier 2 tenants
(dedicated namespace).
• platform-dedicated-<tenant> — dedicated control + execution plane for Tier 3 tenants
(dedicated cluster).

### 21.2 Workload Patterns

• Deployments for APIs and frontend (stateless, horizontally scaled).
• HorizontalPodAutoscalers on CPU, memory, and queue depth (queue-depth HPA via
BullMQ metrics adapter).
• Jobs / CronJobs for batch tasks (billing rollup, reconciliation, audit export).
• StatefulSets only for infrastructure components when self-managed (Redis cluster,
when not using managed ElastiCache).
• PodDisruptionBudgets on every deployment to prevent voluntary eviction storms
during node maintenance.

### 21.3 CI/CD Pipeline

CI/CD promotes confidence, not merely ships code. The pipeline validates types, tests,
linting, schema migrations, security scans, package provenance, container image signing,
deployment manifests, smoke tests, and progressive delivery gates.

**Table 33. CI/CD Stages**

Stage Checks Gate Behavior
Pull request Unit tests, static analysis,
schema validation,
dependency audit, license
check
Blocks merge on failure
Main branch Build artifacts, container scan
(Trivy), migration dry-run, API
contract test (Pact)
Blocks push on failure
Release candidate Signed artifacts (Sigstore),
deployment to staging, smoke
tests, synthetic flows
Blocks release tag on failure
Staging rollout Progressive traffic shift (10%
→ 50% → 100%), canary
analysis (error rate, latency)
Auto-rollback on canary
failure
Production rollout Approval gate (1 approver for
minor, 2 for major), rollback
target verified
Manual approval; rollback
within 5 min
Stage Checks Gate Behavior
Rollback path Versioned artifacts retained 6
months; manifests retained;
DB migration rollback strategy
documented per release
Rollback tested in staging
before each release
Database migration rollback is a first-class concern. Forward-only migrations are
preferred; when a migration cannot be safely reversed (e.g., a column drop), the release
notes document the rollback strategy (e.g., 'rollback requires restoring from snapshot —
estimate 30 min RTO'). Expansive-contraction migrations (add column → deploy → backfill
→ deploy → drop column) are the default pattern for risky schema changes.

## 22. Observability Stack

Observability combines logs, metrics, traces, and event audit data. The platform
exposes service-level and product-level telemetry so that engineers can answer both
operational questions and product analytics questions without rebuilding instrumentation for
each use case.

**Table 34. Observability Signals**

Signal Examples Why It Matters
Logs API events, worker
exceptions, audit events
Forensics and debugging
Metrics Latency, queue depth, error
rate, token usage, spend
SLOs and capacity planning
Traces End-to-end request flow
across services
Latency attribution and
dependency mapping
Events Workflow published,
execution completed,
template installed
Product analytics and billing
Logs are structured JSON with redaction rules (PII / secrets automatically scrubbed at
the log shipper). Retention is 90 days hot (in Loki or Elasticsearch) and 7 years cold (in
object storage) for audit-relevant logs. Metrics are scraped via Prometheus with 13-month
retention; long-term metrics are downsampled and stored in Thanos or Mimir. Traces use
OpenTelemetry with 1% sampling for non-critical paths and 100% sampling for billing, auth,
and AI runs. Every signal carries the tenant_id, correlation_id, and service_name labels so
that queries can be scoped per-tenant for Enterprise customer support.

### 22.1 SLO Dashboards

Each service has a published SLO dashboard showing: current SLO attainment, error
budget consumption, top error sources, latency distribution, and dependency health.
Dashboards are linked to runbooks — an alert links directly to the runbook for that alert type,
which links to the SLO dashboard for context. This closed loop (alert → runbook →
dashboard → postmortem) is what makes on-call sustainable.

## 23. Multi-Region & Disaster Recovery

The multi-region strategy is phased. v2.0 supports regional deployment topology and
data residency boundaries; active-active write semantics are not assumed. The design
supports primary-region control with read replicas, failover plans, and eventual regional
autonomy where needed.

### 23.1 Phased Multi-Region

**Table 35. Multi-Region Phases**

Phase Capability Status in v2.0
Phase 1 Single primary region + read
replicas for read locality
GA in v2.0
Phase 2 Regional execution pools
(workers + queues in
secondary regions, control
plane still primary)
v2.1 target
Phase 3 Active-passive failover (full
control + execution in standby
region, DNS-based cutover)
v2.5 target
Phase 4 Active-active for control plane
(multi-master writes —
requires consensus layer)
v3.0 target

### 23.2 Disaster Recovery

Disaster recovery requirements are defined in terms of RPO and RTO by service class
(see Table 9 in Section 5.4). Metadata services, execution services, and analytics services
have different recovery expectations. The backup strategy covers database snapshots,
WAL/log shipping, object storage versioning, config backups, and infrastructure state
export.

**Table 36. DR Backup Strategy**

Component Backup Strategy Recovery Target
PostgreSQL Automated snapshots every 6
hours + continuous WAL
streaming to standby region
PITR within RPO; full restore
within RTO
Redis Rebuildable cache; AOF for
billing-adjacent queues; no
persistence for caches
Fast restart; no cache
reliance
Component Backup Strategy Recovery Target
Object storage Versioned artifacts + cross-
region replication
Artifact restore + replay
Secrets / config Encrypted Vault snapshots +
IaC reconstruction (Terraform
state in versioned S3)
Rapid redeploy < 1 hr
Queues Drained or replayed from
durable state (PostgreSQL
event log)
At-least-once recovery
AI prompt versions Synchronous replication to
standby region
Zero RPO — immutability +
sync replication
DR drills are run quarterly. A drill restores the most recent backup into an isolated
recovery environment, replays queued work, and verifies data integrity against checksums.
A drill that fails to meet RTO triggers a remediation backlog item with a 30-day SLA. Drill
results are shared with Enterprise customers under NDA as evidence of DR readiness.

### 23.3 DR Failover Flow — Control Plane vs. Execution Plane

Control plane and execution plane have materially different failover contracts because
they have different state models and different RPO/RTO targets. The control plane owns
authoritative metadata (tenants, RBAC, workflow definitions, published versions, billing
artifacts, audit logs) and targets RPO = 5 min, RTO = 1 hr. The execution plane owns run-
time state (in-flight executions, checkpoints, queue jobs, leases) and tolerates RPO = 15
min, RTO = 4 hr. PostgreSQL is the load-bearing dependency for both planes; its replication
mode is therefore the linchpin of the entire DR posture.
For PostgreSQL, LongoX uses synchronous (quorum-1) streaming replication to a
standby region for the control-plane database. This means every committed transaction is
acknowledged by at least one synchronous standby before the client receives commit
confirmation — in normal operation this gives RPO = 0 for the control plane (no committed
transaction is lost on primary failure). The cost is a small write-latency penalty (typically < 5
ms p99 for cross-region round-trip within the same continent). The execution-plane
database uses asynchronous WAL streaming (RPO ≤ 15 min, no commit-latency penalty)
because execution state is checkpointed to durable storage and can be reconstructed from
the event log if recent WAL is lost.
PRIMARY REGION STANDBY REGION
(us-east-1) (us-east-2)
========== ==========

┌─────────────────────────────────────┐
┌─────────────────────────────────────┐
│ CONTROL PLANE │ │ CONTROL PLANE (cold standby) │
│ ┌────────────────────────────────┐ │ │
┌────────────────────────────────┐ │
│ │ Auth, Workflow, Connector, │ │ │ │ Auth, Workflow, Connector, │ │
│ │ Template, Billing services │ │ │ │ Template, Billing services │ │
│ │ (stateless, active) │ │ │ │ (stateless, provisioned but │ │
│ └────────────────┬───────────────┘ │ │ │ not serving traffic) │ │
│ │ │ │ └────────────────┬───────────────┘ │
│ v │ │ v │
│ ┌────────────────────────────────┐ │ │
┌────────────────────────────────┐ │
│ │ PostgreSQL (control) │ │ SYNC │ │ PostgreSQL (control) │ │
│ │ PRIMARY — accepts writes │—————————————>│ STANDBY — sync
replica │ │
│ │ WAL streaming (quorum=1) │ │ WAL │ Quorum-1 ack on every commit │ │
│ │ RPO = 0 (sync) RTO = 1 hr │ │ stream │ Promotable to PRIMARY on fail │ │
│ └────────────────────────────────┘ │ │ │ │
└─────────────────────────────────────┘│ │
└───────────────────────────────│┘
│ │ │
│ │ │
┌─────────────────────────────────────┐│ │
┌───────────────────────────────┐│
│ EXECUTION PLANE ││ │ │ EXECUTION PLANE ││
│ ┌────────────────────────────────┐ ││ │ │
┌───────────────────────────┐ ││
│ │ Workers, Scheduler, AI runtime │ ││ │ │ │ Workers, Scheduler, AI │ ││
│ │ (active) │ ││ │ │ │ runtime (cold standby) │ ││
│ └────────────────┬───────────────┘ ││ │ │
└─────────────┬─────────────┘ ││
│ v ││ │ │ v ││
│ ┌────────────────────────────────┐ ││ │ │
┌───────────────────────────┐ ││
│ │ PostgreSQL (execution) │—————————————>│ │ PostgreSQL (execution)
│ ││
│ │ PRIMARY — accepts writes │ ASYNC WAL │ │ ASYNC STANDBY │ ││
│ │ WAL streaming (async) │ stream │ │ May lag by ≤ 15 min │ ││
│ │ RPO ≤ 15 min RTO = 4 hr │ │ │ Checkpoints replayable │ ││
│ └────────────────────────────────┘ │ │ │
└───────────────────────────┘ ││
│ │ │ │ ││
│ ┌────────────────────────────────┐ │ │ │
┌───────────────────────────┐ ││
│ │ Redis (execution queues) │——————————————>│ │ Redis (rebuilt from
PG │ ││
│ │ AOF every-write (billing-q) │ repl │ │ event log on failover) │ ││
│ └────────────────────────────────┘ │ │ │
└───────────────────────────┘ ││
└─────────────────────────────────────┘ │
└────────────────────────────────┘│
│ │
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
FAILOVER TRIGGER (automated, with manual approval for prod): │

1. Health probes (synthetic login + workflow-publish) fail on primary for > 90 s │
2. PG replication lag checked — if control-plane lag < 1 s, failover is SAFE │
3. DNS cutover: longox.com → standby region IP (TTL 60s, so clients retry within 1 min)
   │
4. Standby PostgreSQL PROMOTED to PRIMARY (control plane first, then execution) │
5. Workers in standby region scaled up; primary-region workers cordoned │
6. Queues drained from primary or replayed from PG event log (at-least-once) │
7. Audit event emitted: environment.rolled_back or environment.failed_over │
8. Reverse failback is a planned, scheduled event (not automatic) │

CONTROL PLANE RECOVERY: RPO = 0 (sync replication) │ RTO = 1 hr (DNS +
promote + worker scale)
EXECUTION PLANE RECOVERY: RPO ≤ 15 min (async WAL) │ RTO = 4 hr (queue
replay + checkpoint resume)
AI PROMPT VERSIONS: RPO = 0 (immutable + sync) │ RTO = 1 hr (control-plane
tier)
AUDIT LOGS: RPO = 0 (append-only + sync) │ RTO = 4 hr (search index
rebuild)
METERING EVENTS: RPO ≤ 1 min (sync) │ RTO = 4 hr (queue replay
fallback)

**Figure 6. DR Failover Flow — control plane uses synchronous replication (RPO = 0); execution**

plane uses async WAL streaming (RPO ≤ 15 min) and reconstructs state from checkpoints + event
log.
The asymmetric replication strategy is deliberate: control-plane data is small
(terabytes, not petabytes), low-write-volume, and high-value (losing a workflow publish
means losing customer work), so synchronous replication is affordable. Execution-plane
data is high-volume (50M executions/day at Year 3) and individually low-value (a single
failed execution can be retried), so async replication with checkpoint-based reconstruction
is the right tradeoff. AI prompt versions and audit logs are sync-replicated despite being part
of the control-plane database because they are immutable — sync replication has no write-
contention cost, only a commit-latency cost, which is acceptable for compliance-critical
data.
Failover is automated for non-production environments and manual-approval for
production. The 90-second health-probe window prevents flapping during transient blips;
the lag check before promotion prevents split-brain (if the standby is more than 1 second
behind, the system holds the failover and pages SRE rather than risk data loss). Failback —
returning to the original primary after the incident is resolved — is always a planned,
scheduled event, never automatic, because it requires another replication re-sync and a
controlled traffic shift.

## 24. Monorepo Structure

The monorepo is organized around clear product surfaces, bounded contexts, and
reusable platform packages. Apps own user interfaces, services own business capabilities,
packages own shared runtime primitives, connectors own external integrations, templates
own reusable assets, and infrastructure owns deployment and operations.

### 24.1 Top-Level Layout

longox-platform/
├── apps/ # Deployable frontend surfaces
│ ├── web/ # Customer-facing SaaS (Next.js)
│ ├── admin/ # Internal operations portal
│ ├── docs/ # Documentation site
│ ├── marketing/ # Landing pages
│ └── marketplace/ # Connector marketplace frontend
├── services/ # Backend services (bounded contexts)
│ ├── api-gateway/
│ ├── auth-service/
│ ├── platform-service/
│ ├── workflow-service/
│ ├── execution-service/
│ ├── scheduler-service/
│ ├── connector-service/
│ ├── template-service/
│ ├── marketplace-service/
│ ├── dashboard-service/
│ ├── datasource-service/
│ ├── ai-service/
│ ├── billing-service/
│ ├── metering-service/
│ ├── notification-service/
│ ├── audit-service/
│ └── search-service/
├── packages/ # Shared runtime primitives
│ ├── ui/ # React component library
│ ├── design-system/ # Design tokens
│ ├── sdk/ # Connector + workflow SDKs
│ ├── workflow-engine/ # DAG runtime
│ ├── workflow-canvas/ # Canvas React components
│ ├── dashboard-renderer/
│ ├── dashboard-widgets/
│ ├── connector-runtime/
│ ├── sandbox-runtime/ # WASM/Deno isolates
│ ├── agent-runtime/ # AI agent loop
│ ├── shared-types/ # Generated TS types
│ ├── shared-db/ # Prisma schema + migrations
│ ├── shared-events/ # Event schemas + bus
│ ├── shared-rbac/
│ ├── shared-logger/
│ ├── shared-cache/
│ ├── shared-testing/
│ └── event-bus/
├── connectors/ # External integrations
│ ├── slack/
│ ├── github/
│ └── ... # One folder per connector
├── templates/ # Reusable content assets
│ ├── workflows/
│ ├── dashboards/
│ ├── industries/
│ └── connector-bundles/
├── infrastructure/ # Deployment
│ ├── terraform/
│ ├── kubernetes/
│ └── helm/
├── scripts/ # Repo-level scripts
├── tools/ # Internal tooling
├── .github/ # CI/CD workflows
└── docs/ # Architecture + ADRs + runbooks

### 24.2 Service Layout Example (workflow-service)

services/workflow-service/
├── src/
│ ├── domain/
│ │ ├── workflow/
│ │ ├── node/
│ │ ├── edge/
│ │ ├── trigger/
│ │ └── versioning/
│ ├── application/
│ │ ├── commands/
│ │ ├── queries/
│ │ └── handlers/
│ ├── infrastructure/
│ │ ├── postgres/
│ │ ├── redis/
│ │ └── events/
│ ├── api/
│ │ ├── rest/
│ │ └── graphql/
│ └── tests/
├── openapi.yaml # REST contract (source of truth)
├── schema.graphql # GraphQL SDL (service-specific)
├── Dockerfile
└── README.md
Operational conventions: generated clients, shared types, API contracts, and database
schemas are always derived from canonical definitions. Feature code depends inward
toward packages and services, never upward into app-specific code. This prevents circular
dependencies and keeps the platform maintainable as teams scale. Cross-package imports
are validated by the build system (madge or dependency-cruiser); circular dependencies fail
CI.

## 25. Sequence Diagrams

The sequence diagrams below are Mermaid sources. In the engineering repository
they render natively in markdown viewers; in this document they appear as Mermaid source
code for portability. Each diagram is preceded by a short context paragraph and followed by
a key insight.

### 25.1 Workflow Publish

A workflow author finalizes a draft and requests publication. The workflow service
validates the graph, creates an immutable version, writes an audit log entry, and emits a
platform event. The execution service consumes the event and updates its run-eligibility
cache.
sequenceDiagram
participant U as Author
participant W as Web App
participant WS as Workflow Service
participant V as Validator
participant DB as PostgreSQL
participant EB as Event Bus
participant ES as Execution Service

U->>W: Click "Publish"
W->>WS: POST /workflows/{id}/publish
WS->>DB: Load draft (optimistic concurrency check)
WS->>V: Validate graph (cycles, schemas, policies)
V-->>WS: Valid
WS->>DB: Create immutable version + checksum
WS->>DB: Write audit log entry
WS->>EB: Emit workflow.published (v2)
WS-->>W: 201 Created (version_id, version_number)
EB->>ES: Consume event, update run-eligibility cache
Key insight: the publish operation is atomic — version creation, audit log, and event
emission all succeed or all fail. The event bus consumer is async, so the author sees the
publish succeed immediately; cache invalidation happens within seconds.

### 25.2 Workflow Execution (with Checkpoint & Retry)

A webhook trigger arrives, the execution service accepts it, queues the run, a worker
picks it up and executes nodes one-by-one with checkpoint persistence. If a node fails
transiently, the executor retries with exponential backoff. If the worker crashes mid-run, the
lease expires and another worker resumes from the latest checkpoint.
sequenceDiagram
participant T as Trigger (Webhook)
participant GW as API Gateway
participant ES as Execution Service
participant Q as Queue (BullMQ)
participant W as Worker
participant C as Connector / AI
participant DB as PostgreSQL

T->>GW: POST /triggers/webhook (signed)
GW->>ES: Forward (verified)
ES->>DB: Create execution record (status=queued)
ES->>Q: Enqueue workflow-execution job
ES-->>GW: 202 Accepted (execution_id)
GW-->>T: 202

Q->>W: Dequeue job
W->>DB: Acquire lease (leased_until = now + 5min)
W->>DB: Load run context + latest checkpoint
loop Node execution
W->>C: Execute node (idempotent)
C-->>W: Result
W->>DB: Persist checkpoint (node_id, attempt, state)
W->>DB: Renew lease (now + 5min)
end
W->>DB: Mark execution completed
W->>DB: Release lease
Key insight: lease renewal every 60 seconds during long-running node execution is
what allows a worker to hold a run for hours without losing it on crash. The checkpoint is the
source of truth — the worker is a disposable executor.

### 25.3 Marketplace Install

A user installs a connector from the marketplace. The connector service verifies the
signature, validates permissions and compatibility, binds the tenant's secret reference,
records the install, and emits an event so the runtime can enable the connector.
sequenceDiagram
participant U as User
participant M as Marketplace UI
participant CS as Connector Service
participant V as Signature Verifier
participant VA as Vault
participant DB as PostgreSQL
participant EB as Event Bus
participant RT as Runtime

U->>M: Click "Install connector v1.2.0"
M->>CS: POST /connectors/{id}/install
CS->>V: Verify Sigstore signature
V-->>CS: Valid
CS->>DB: Check compatibility (platform_min version)
CS->>VA: Verify secret_ref exists for tenant
VA-->>CS: OK
CS->>DB: Create install record (status=active)
CS->>EB: Emit connector.installed (v2)
CS-->>M: 201 Created (install_id)
EB->>RT: Enable connector for tenant's runtime

### 25.4 Dashboard Preview

A user opens the dashboard builder and requests a preview. The GraphQL API fetches
the dashboard definition and widget bindings, resolves data sources with permission
checks, and returns a render-ready payload. No writes occur — preview is side-effect-free.
sequenceDiagram
participant U as User
participant B as Builder UI
participant GQL as GraphQL API
participant DS as Data Source Adapter
participant P as Permission Service
participant DB as PostgreSQL

U->>B: Click "Preview"
B->>GQL: Query dashboard(id) { version { layout widgets bindings } }
GQL->>DB: Load dashboard version
GQL->>P: Check dashboard.view permission
P-->>GQL: Allow
loop Per widget with binding
GQL->>DS: Resolve binding (API query / workflow output / dataset)
DS->>P: Check data-access permission
P-->>DS: Allow (or deny → mask data)
DS-->>GQL: Resolved data
end
GQL-->>B: Rendered preview payload
B->>U: Render (no writes occurred)

### 25.5 AI Run (with Guardrails + RAG)

A workflow's AI node executes. The AI orchestrator loads the prompt version,
assembles context (including RAG retrieval if configured), runs input guardrails, calls the
provider (with fallback chain), runs output guardrails, accounts for tokens, persists a
checkpoint, and emits analytics.
sequenceDiagram
participant W as Worker (workflow)
participant AO as AI Orchestrator
participant PR as Prompt Registry
participant RAG as RAG Service
participant IG as Input Guardrail
participant PV as Provider (OpenAI/Anthropic)
participant OG as Output Guardrail
participant TM as Token Meter
participant DB as PostgreSQL
participant EB as Event Bus

W->>AO: Execute AI node (prompt_version_id, model, variables)
AO->>PR: Load prompt version
AO->>RAG: Retrieve top-K chunks (if configured)
RAG-->>AO: Chunks + citations
AO->>IG: Check rendered prompt (PII / injection / policy)
IG-->>AO: Pass (or block → emit guardrail.violation)
AO->>PV: Provider call (streaming via SSE)
PV-->>AO: Response (with token counts)
AO->>OG: Check response (content / tool allow-list / schema)
OG-->>AO: Pass (or block → emit guardrail.violation)
AO->>TM: Record metering event (tokens, cost)
AO->>DB: Persist checkpoint (partial or full response)
AO->>EB: Emit ai.run.completed (v2)
AO-->>W: Result (output, token_usage, cost_usd, prompt_version_id)

### 25.6 Environment Promotion

A release manager requests promotion of a workflow version from staging to
production. The system checks promotion policy, requires approval (1 or 2 approvers
depending on policy), records the release, rebinds the live alias, and emits an event.
Rollback reverses the alias rebind.
sequenceDiagram
participant RM as Release Manager
participant WS as Workflow Service
participant PP as Promotion Policy
participant A as Approver(s)
participant DB as PostgreSQL
participant EB as Event Bus

RM->>WS: Request promotion (version_id, target=production)
WS->>PP: Evaluate policy (required approvers, parity check)
PP-->>WS: Required: 2 approvers
WS->>A: Request approval (1 of 2)
A-->>WS: Approved
WS->>A: Request approval (2 of 2)
A-->>WS: Approved
WS->>DB: Create release record (source_version, target_env, approvers, rollback_target)
WS->>DB: Rebind live alias to new version
WS->>DB: Write audit log entry
WS->>EB: Emit environment.promoted (v2)
WS-->>RM: Promotion complete

note over WS,DB: Rollback path: WS rebinds live alias to rollback_target, emits
environment.rolled_back

## 26. Architecture Decision Records

v1.0 listed ADRs as 'to be captured.' v2.0 includes an ADR template and five sample
ADRs covering the most consequential architectural decisions. ADRs live in the repository
at docs/adrs/ and are numbered sequentially; once an ADR is Accepted, it is immutable —
supersession requires a new ADR that references the prior one.

### 26.1 ADR Template

# ADR-NNNN: <Title>

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-MMMM
- **Date**: YYYY-MM-DD
- **Deciders**: <names + roles>
- **Supersedes**: <ADR-MMMM or n/a>
- **Superseded by**: <ADR-MMMM or n/a>

## Context

<What is the issue? What constraints? What forces? 2-4 paragraphs.>

## Decision

<What we decided. 1-2 paragraphs, declarative.>

## Consequences

- Positive: <bullet>
- Negative: <bullet>
- Neutral: <bullet>

## Alternatives Considered

### Alternative A: <name>

<Why not chosen.>

### Alternative B: <name>

<Why not chosen.>

## References

<Links to relevant docs, prior ADRs, external articles.>

### 26.2 ADR-001: Use BullMQ + Redis for Workflow Queue

Status: Accepted. Date: 2026-04-10. Deciders: Platform Architecture Team, Backend
Lead, SRE Lead.
Context: The execution engine needs a job queue that supports delayed jobs,
repeatable jobs (cron), priority tiers, per-queue concurrency control, dead-letter handling,
and observability. The queue must integrate with our existing Redis deployment (used for
caching and rate limiting) to avoid introducing a new stateful dependency. Throughput
target: 50M jobs/day by Year 3. The queue is on the critical path for every workflow
execution, so a queue outage is a platform outage.
Decision: Use BullMQ on Redis. BullMQ provides delayed jobs, repeatable jobs,
priority tiers, per-worker concurrency, dead-letter queues, and a first-class Node.js API. It
uses Redis as its only dependency, which we already operate. We deploy Redis in cluster
mode (3 primary + 3 replica) for HA with AOF persistence for billing-adjacent queues.
Consequences — Positive: single stateful dependency for queue + cache + rate limit;
mature library; excellent observability via BullMQ Board; native Node.js. Negative: Redis is
a single point of failure if misconfigured; cluster mode adds operational complexity; no
native exactly-once delivery (consumers must dedupe). Neutral: ties us to Redis ecosystem,
which is acceptable given the alternative (Kafka) is overkill for our throughput.
Alternatives — Alternative A: AWS SQS. Rejected because we want cloud-agnostic
infrastructure (Tier 3 customers may deploy on GCP/Azure) and because SQS does not
support delayed jobs at the priority granularity we need. Alternative B: RabbitMQ. Rejected
because it would add a second stateful dependency alongside Redis, and BullMQ gives us
equivalent functionality on Redis. Alternative C: Kafka. Rejected as overkill — our
throughput (50M/day) does not justify Kafka's operational complexity, and we don't need
Kafka's log-replay semantics because we have an append-only event log in PostgreSQL.
26.3 ADR-002: Tiered Multi-Tenancy (Shared / Dedicated
Namespace / Dedicated Cluster)
Status: Accepted. Date: 2026-04-15. Deciders: Platform Architecture Team, Security
Lead, Engineering Leadership.
Context: Customers span from self-serve Starter ($49/mo) to regulated Enterprise
(HIPAA, dedicated infra). A single tenancy model cannot serve both ends without either
over-charging small customers for isolation they don't need, or under-protecting Enterprise
customers who pay for it. We need explicit tiers with explicit isolation contracts.
Decision: Three tiers. Tier 1 (Shared): shared K8s cluster, shared PostgreSQL with
row-level tenant_id, shared Redis. Tier 2 (Dedicated Namespace): dedicated K8s
namespace, dedicated workers, dedicated Redis logical DB, dedicated PostgreSQL
schema or DB in shared cluster. Tier 3 (Dedicated Cluster): single-tenant VPC, dedicated
control + execution plane, dedicated PostgreSQL/Redis/storage. See Section 6 for the full
isolation matrix.
Consequences — Positive: clear product/pricing alignment (Starter/Pro → Tier 1,
Team/Enterprise-standard → Tier 2, Enterprise-regulated → Tier 3); security review can be
tiered; data-residency and compliance needs met by Tier 3. Negative: three deployment
topologies to operate and test; tier upgrades require a migration workflow; tier downgrades
are not supported. Neutral: customer-visible tier labels create an expectation of
differentiated support, which we already want.
Alternatives — Alternative A: Single shared tier with optional add-ons. Rejected
because Enterprise prospects in regulated industries will not sign without dedicated
infrastructure, and a shared-only platform cannot serve them. Alternative B: Two tiers
(Shared + Dedicated Cluster). Rejected because the jump from $499/mo Pro to ~$15K/mo
Dedicated Cluster is too wide; the intermediate Dedicated Namespace tier captures Team
and standard Enterprise customers. Alternative C: Single-tenant-only (Heroku-style).
Rejected because it prices out the self-serve segment that drives top-of-funnel growth.

### 26.4 ADR-003: pgvector for v1.0 RAG

Status: Accepted. Date: 2026-04-20. Deciders: AI Platform Lead, Data Platform Lead,
SRE Lead.
Context: RAG requires a vector store. The platform already uses PostgreSQL as the
primary OLTP store; introducing a new stateful dependency (Pinecone, Weaviate, Qdrant)
in v1.0 adds operational burden. Initial RAG workload estimates: <10M vectors per tenant,
query p99 target 500ms. The vector store is on the AI run critical path, but failure degrades
gracefully (RAG retrieval failure → non-RAG fallback).
Decision: Use pgvector (PostgreSQL extension) for v1.0 RAG. Vectors live in the
vector_embeddings table alongside relational data; HNSW index for fast similarity search.
Migration to a dedicated vector database is the documented escape path, triggered if (a) any
tenant exceeds 10M vectors, (b) query p99 exceeds 500ms for > 7 consecutive days, or (c)
total pgvector storage exceeds 20% of PostgreSQL cluster volume.
Consequences — Positive: zero new stateful dependencies in v1.0; vectors and
metadata in same database simplify transactional consistency; backup/restore is unified.
Negative: pgvector's HNSW index is memory-hungry; large tenants will pressure
PostgreSQL memory budget; migration to dedicated vector DB will require a non-trivial data
backfill. Neutral: ties RAG scaling to PostgreSQL scaling, which is acceptable for v1.0
volume.
Alternatives — Alternative A: Pinecone (managed SaaS). Rejected for v1.0 because it
adds a vendor dependency and a network hop on every RAG query; reconsider for v2.x if
scale demands. Alternative B: Weaviate (self-hosted). Rejected because it adds another
stateful service to operate; would reconsider alongside Qdrant if pgvector hits its limits.
Alternative C: OpenSearch k-NN. Rejected because we don't otherwise need OpenSearch
and the operational cost is not justified for v1.0.
26.5 ADR-004: Path-Based API Versioning with 6-Month
Deprecation
Status: Accepted. Date: 2026-05-02. Deciders: Platform Architecture Team, Developer
Experience Lead.
Context: REST APIs need a versioning strategy that (a) is obvious to clients, (b)
supports dual-running during migrations, (c) gives clients time to migrate, (d) makes
deprecation observable via standard HTTP headers. GraphQL has its own evolution model
(deprecation directives) and does not need path versioning.
Decision: Path-based versioning (/api/v1/, /api/v2/). Major version bumps for breaking
changes only. Deprecation window: 6 months dual-run (both versions supported) + 6
months sunset (old version returns Sunset and Deprecate headers, still functional) = 12
months total before removal. OpenAPI spec is source of truth; clients generated via
openapi-generator. See Section 12.1 for the full policy.
Consequences — Positive: clients see the version in the URL — no surprise breakage;
dual-running makes migration non-urgent; Sunset/Deprecate headers are RFC-compliant
and tooling-friendly. Negative: 12-month maintenance burden for each deprecated version;
CI must test both versions during the dual-run window. Neutral: forces the team to think hard
before making breaking changes, which is a feature not a bug.
Alternatives — Alternative A: Header-based versioning (Accept:
application/vnd.longox.v2+json). Rejected because it is less obvious to clients and harder to
test in a browser. Alternative B: No versioning (continuous evolution with additive-only
changes). Rejected because it makes breaking changes impossible, which becomes a
strategic blocker. Alternative C: GraphQL-only (deprecate REST). Rejected because REST
is the right tool for triggers, webhooks, and idempotent mutations.

### 26.6 ADR-005: Workflow Diffs as JSON Patch

Status: Accepted. Date: 2026-05-10. Deciders: Workflow Team, Platform Architecture.
Context: Workflow versions are immutable snapshots (graph_json + checksum). For
diffing (review, audit, promotion comparison), we need a representation of the change
between two versions. Options: (a) full snapshot only (no diff), (b) JSON Patch (RFC 6902),
(c) custom graph delta format. Storage cost matters because every published version pair
may have a diff.
Decision: Store diffs as JSON Patch (RFC 6902) in the workflow_diffs table. The diff is
computed at publish time from the prior published version's graph_json. Diffs are immutable;
the table is append-only. JSON Patch is a standard, has good library support in every
language, and is human-readable for review.
Consequences — Positive: standard format, well-tooled; storage cost is proportional to
change size, not graph size; can be applied to derive one version from another
programmatically. Negative: JSON Patch is path-based, not semantic — a node move looks
like a delete+add, which is less readable in review than a 'move' operation. Neutral: requires
a separate 'semantic diff' renderer in the UI for human-friendly review, but the storage format
is JSON Patch.
Alternatives — Alternative A: Full snapshot only (no diff storage). Rejected because
diffing at read time is expensive for large graphs and we want diffs available for review
without recomputation. Alternative B: Custom graph delta format. Rejected because it would
require us to maintain a non-standard format and its tooling; the readability benefit over
JSON Patch is marginal. Alternative C: JSON Merge Patch (RFC 7396). Rejected because
it cannot express array operations cleanly, and workflow graphs are array-heavy.

### 26.7 ADR-006: Kong as API Gateway

Status: Accepted. Date: 2026-06-18. Deciders: Platform Architecture Team, Backend
Lead, SRE Lead.
Context: The API gateway sits in front of every backend service and is on the critical
path for every request. It must handle routing, auth enforcement (JWT validation, tenant
context extraction), rate limiting (per-tenant token buckets), request/response
transformation, structured logging with correlation IDs, and observability hooks
(Prometheus metrics, OpenTelemetry traces). The gateway must be cloud-agnostic
because Tier 3 (Dedicated Cluster) customers may deploy on AWS, GCP, or Azure. v2.0
needs a production-grade gateway on day one — we cannot start with a toy and migrate
later.
Decision: Use Kong Gateway (OSS or Enterprise) as the API gateway. Kong provides
declarative configuration (YAML or via Kong DB-less mode for GitOps-friendly
deployments), a mature plugin ecosystem (JWT, rate-limiting, correlation-id, prometheus,
opentelemetry, request-transformer, response-transformer), and supports multi-region via
Konnect (SaaS control plane) or federated DB mode. Kong runs in front of every service;
routing rules map /api/v1/\* paths to upstream services. Tier 3 dedicated clusters run their
own Kong instance for full isolation.
Consequences — Positive: batteries-included (no need to build auth/rate-limit/logging
middleware per service); declarative config fits our GitOps workflow; Konnect gives us multi-
region control plane without building one; strong observability integrations. Negative: Kong
adds a stateful dependency when not in DB-less mode (Postgres or Cassandra for config
storage); Konnect is paid for production multi-region; plugin ecosystem varies in quality.
Neutral: ties us to Kong's plugin API for custom gateway logic, which is acceptable given the
alternative (hand-writing gateway middleware in Node.js) is reinventing the wheel.
Alternatives — Alternative A: Envoy. Rejected because Envoy's configuration surface
is significantly larger (xDS, filters, bootstrap config) and the team would need to build tooling
around it that Kong already provides. Envoy is the right choice for very high-throughput or
service-mesh-heavy deployments; our throughput (50M req/day Year 3) does not justify it.
Alternative B: Native Next.js middleware. Rejected because Next.js middleware runs in the
V8 runtime and cannot enforce auth at the network boundary; it also cannot rate-limit
effectively without a backing store, and it does not handle non-HTTP traffic (webhooks,
SSE). Alternative C: AWS API Gateway. Rejected because it creates cloud lock-in
incompatible with Tier 3 multi-cloud deployment; also has per-request pricing that becomes
expensive at our Year 3 volume. Alternative D: NGINX Plus. Rejected because the licensing
model is per-instance and the API/model is less developer-friendly than Kong's.

### 26.8 ADR-007: WorkOS as Identity Provider

Status: Accepted. Date: 2026-06-18. Deciders: Platform Architecture Team, Identity
Team Lead, Security Lead.
Context: The platform needs an identity provider that supports passwordless +
password auth, SSO (SAML 2.0 for enterprise, OIDC for modern IdPs), MFA (TOTP,
WebAuthn, SMS fallback), directory sync (SCIM 2.0 for user provisioning/deprovisioning), a
hosted admin portal UI for IT admins, and audit logs. Enterprise customers (Tier 2 and Tier 3) require SSO and SCIM as table stakes; the platform cannot close Enterprise deals
without them. The identity layer is on the critical path for every authenticated request, so
reliability and integration quality matter as much as feature coverage.
Decision: Use WorkOS as the primary identity provider. WorkOS provides drop-in SSO
connections for major IdPs (Okta, Azure AD, Google Workspace, OneLogin, PingIdentity),
SCIM 2.0 directory sync, hosted Admin Portal UI (IT admins manage SSO connections and
user provisioning themselves), MFA via AuthKit, and a clean REST API for user
management. Auth flows: (1) Username/password + MFA via WorkOS AuthKit for self-
serve; (2) SSO via WorkOS SAML/OIDC for Enterprise; (3) Directory sync via WorkOS
SCIM for automated provisioning. Sessions are issued by the platform (not WorkOS) after
WorkOS authentication succeeds — the platform remains the session authority.
Consequences — Positive: enterprise SSO ready out of the box (saves 3+ months of
integration work); Admin Portal offloads IT admin work to a hosted UI; transparent per-MAU
pricing scales predictably; modern API with good TypeScript SDK. Negative: vendor
dependency for a critical-path service; less customization than self-hosted Keycloak (e.g.,
custom login flows require WorkOS support engagement); per-MAU pricing can become
material at large user counts. Neutral: Tier 3 customers who already have an IdP (Azure AD,
Okta) federate to it via SAML/OIDC — WorkOS is the broker, not the IdP of record.
Alternatives — Alternative A: Auth0 (Okta). Rejected because per-MAU pricing scales
poorly at our Year 3 user volume (estimated 200K MAU), the customization model (Actions)
requires learning a proprietary runtime, and the post-Okta-acquisition roadmap has been
uneven. Alternative B: Keycloak (self-hosted). Rejected because the operational burden
(JVM tuning, version upgrades, database schema management, plugin compatibility) is not
justified for v2.0 team size; Keycloak's admin UI is also less polished than WorkOS Admin
Portal. Tier 3 customers with strict self-host requirements can still federate via SAML/OIDC.
Alternative C: Clerk. Rejected because Clerk's strength is consumer auth (social login,
magic links) rather than enterprise SSO + SCIM, which is our primary need. Alternative D:
Build in-house. Rejected because the scope (SAML, OIDC, SCIM, MFA, admin portal, audit)
is a 12-month engineering effort that delivers no competitive differentiation.

### 26.9 ADR-008: Server-Sent Events (SSE) for Realtime Updates

Status: Accepted. Date: 2026-06-18. Deciders: Frontend Lead, Backend Lead,
Platform Architecture.
Context: Several user-facing surfaces need realtime updates: execution monitoring
(run status changes, log lines, checkpoint progress), dashboard refresh (live KPI tiles),
collaborative editing (presence, cursors — future), and notification center (in-app toasts).
The transport choice affects every realtime consumer and is expensive to change later.
Options: (a) SSE, (b) WebSocket subscriptions, (c) long-polling, (d) GraphQL subscriptions
(which themselves wrap WebSocket).
Decision: Use Server-Sent Events (SSE) for all realtime updates. SSE is unidirectional
(server→client), which matches our use cases — client→server actions go via REST POST
with idempotency keys, not via the realtime channel. SSE works over HTTP/2 multiplexing
(multiple streams per connection), uses standard Bearer token auth in the Authorization
header (no subprotocol negotiation), and is browser-native via the EventSource API. The
platform multiplexes multiple event streams (execution updates, notifications, dashboard
refresh) over a single SSE connection per client, demultiplexed by event_type.
Consequences — Positive: simpler implementation than WebSocket (no connection
state machine, no ping/pong, no subprotocol negotiation); HTTP/2 friendly (no HEAD-of-line
blocking per stream); works through corporate proxies that block WebSocket; easier auth
(Bearer token in header, refreshed on reconnect). Negative: unidirectional — if we later
need true bidirectional (e.g., collaborative canvas with sub-100ms round-trips), we would
need to add WebSocket for that specific surface; browser EventSource API does not
support custom headers natively (workaround: pass token in query string + rotate often, or
use fetch-based SSE polyfill). Neutral: limits future bidirectional use cases, but we can add
WebSocket selectively without ripping out SSE.
Alternatives — Alternative A: WebSocket. Rejected because the bidirectional
capability is unused for our v2.0 use cases — client→server realtime would require a
fundamentally different (and more complex) authorization model. WebSocket also adds
connection-state management burden at the gateway (Kong supports it, but with caveats
around sticky sessions and timeouts). Alternative B: Long-polling. Rejected because it is
bandwidth-inefficient (each poll carries full HTTP overhead) and adds latency (average
polling interval vs. push). Alternative C: GraphQL subscriptions. Rejected because they are
specified over WebSocket (gives us the worst of both worlds: WebSocket complexity +
GraphQL subscription server complexity) and our mutations already use REST. Alternative
D: WebRTC data channels. Rejected — overkill for server→client fanout and adds NAT
traversal complexity.

### 26.10 ADR-009: Deno Isolates for Connector Sandbox Runtime

Status: Accepted. Date: 2026-06-18. Deciders: Ecosystem Team Lead, AI Platform
Lead, Security Lead.
Context: Connector actions, AI tool calls, and workflow Transform nodes execute
untrusted or semi-trusted code. This code must run in a sandbox that enforces: CPU time
cap, memory cap, wall-clock timeout, no filesystem access (except explicit allow-list), no
native module loading, no network access (except via platform-provided fetch with allow-
listed hosts), and no access to other tenants' state. Cold-start matters because AI tool calls
and connector actions are latency-sensitive (target p99 < 1s for non-AI nodes). Options: (a)
in-process via vm2 or isolated-vm, (b) WASM via Deno isolates (V8 isolate running Deno
runtime), (c) container-per-connector (Docker/gVisor per call), (d) WASM via wasmtime (no
JS runtime).
Decision: Use Deno isolates (V8 isolates running the Deno runtime) for connector and
tool-call sandboxing. V8 isolates provide the same security boundary used by Cloudflare
Workers: memory-isolated, no shared heap, op-table for capabilities (file, network, env
access is opt-in per isolate). Deno adds TypeScript-native execution, a curated standard
library, and resource caps (memory limit, CPU time, wall-clock). Cold-start is sub-
millisecond because isolates do not require process fork. The connector SDK targets Deno-
compatible APIs (fetch, Web Streams, Web Crypto) so connector code is portable to other
isolate runtimes if we ever switch.
Consequences — Positive: strong isolation (V8 isolate boundary is well-tested in
production at Cloudflare scale); sub-millisecond cold-start; native TypeScript; resource caps
enforced at the runtime level; no IPC overhead for simple calls (the isolate runs in-process).
Negative: V8 isolate limits — no Node.js native modules (must use Deno-compatible
equivalents); connector authors cannot use arbitrary npm packages that depend on Node
APIs (fs, child_process, etc.); debugging is harder than container-based runtimes (no exec
into a sandbox). Neutral: connector SDK must target Deno runtime APIs, which we already
prefer (fetch, Web Streams, Web Crypto) for portability.
Alternatives — Alternative A: Container-per-connector (Docker or gVisor). Rejected
because container cold-start (100ms+ even with snapshotting) is too slow for our latency
targets, and the per-call resource overhead (memory, CPU for containerd) is significant at
our Year 3 volume (50M executions/day). gVisor adds stronger isolation but more overhead.
Alternative B: in-process via vm2. Rejected because vm2 is deprecated (the maintainer
published a security advisory recommending migration away), and isolated-vm is lower-
level (requires manual op-table definition for every capability, which is error-prone).
Alternative C: WASM via wasmtime (no JS runtime). Rejected because the TS→WASM
toolchain is less mature than Deno's V8-native TS, and most connector authors want to
write TS, not Rust/AssemblyScript. Alternative D: AWS Lambda / Cloudflare Workers
(serverless functions). Rejected because per-call pricing becomes expensive at scale, and
we lose control over cold-start and resource caps.

### 26.11 ADR-010: PostgreSQL Full-Text Search for v2.x

Status: Accepted. Date: 2026-06-18. Deciders: Search Team, Platform Architecture,
SRE Lead.
Context: The platform needs search across workflows, templates, connectors,
dashboards, executions, and audit logs. Search use cases: (a) browse/discover (user
searches for a workflow by name or tag), (b) admin lookup (admin searches audit logs by
actor or action), (c) marketplace search (user searches for connectors by keyword or
capability). Search is not on the critical realtime path — it powers discovery and lookup, not
execution. v2.0 volume: 1K–10K tenants, ~500K active workflows/dashboards, ~200K
connector versions. Year 3: 10K tenants, 5M+ searchable entities.
Decision: Use PostgreSQL full-text search (tsvector + GIN index) for v2.x. Every
searchable table gets a generated tsvector column (workflow_name_tsv,
connector_desc_tsv, etc.) with a GIN index. Search queries use ts_query with ranking
(ts_rank or cover density). The search service exposes a thin abstraction
(SearchService.search(domain, query, filters)) so we can swap backends without touching
callers. Documented escape path: if (a) total searchable entities exceed 50M, (b) query p99
exceeds 500ms for > 7 consecutive days, or (c) marketplace search needs faceting/ranking
sophistication that PostgreSQL cannot provide, migrate to OpenSearch.
Consequences — Positive: no new stateful dependency in v2.x — PostgreSQL is
already operated, backed up, and monitored; unified backup/restore (no separate search
index to recover); transactional consistency (search index updates in same transaction as
data write, no eventual-consistency window). Negative: PostgreSQL FTS ranking is less
sophisticated than OpenSearch (no BM25 by default, no custom scoring functions easily);
no native faceting (must be implemented as separate GROUP BY queries); CJK
tokenization requires additional configuration (zhparser extension or pre-tokenized
tsvector). Neutral: SearchService abstraction makes future migration mechanical — callers
do not need to change.
Alternatives — Alternative A: OpenSearch (self-hosted). Rejected for v2.x because it
adds a significant operational burden (cluster management, shard rebalancing, version
upgrades, JVM tuning) that is not justified at our volume. Reconsider at Year 3 if escape
path is triggered. Alternative B: Elasticsearch. Rejected because of licensing concerns
(post-2021 SSPL license) and operational complexity equivalent to OpenSearch.
Alternative C: Typesense / Meilisearch. Rejected because they would add a new stateful
dependency for limited benefit over PostgreSQL FTS at our scale; reconsider if marketplace
search needs typo-tolerance or instant-search UX. Alternative D: Algolia (managed SaaS).
Rejected because per-search pricing becomes expensive at our volume, and we want
search data to stay in our infrastructure for compliance.
26.12 ADR-011: Workflow Diffs — JSON Patch Storage +
Semantic UI Overlay
Status: Accepted. Date: 2026-06-18. Deciders: Workflow Team Lead, Frontend Lead,
Platform Architecture.
Context: ADR-005 accepted JSON Patch (RFC 6902) as the storage format for
workflow version diffs. The open question was whether the UI should render JSON Patch
directly or add a semantic overlay. JSON Patch operations are path-based (replace
/nodes/3/position, add /nodes/5, remove /edges/2), so a 'move node from position A to
position B' is represented as a remove + add, which is technically correct but visually
confusing in a code-review UI. Workflow authors reviewing a publish want to see 'node X
was moved' not 'node X was deleted and a new node Y was added.'
Decision: Keep JSON Patch as the storage format (per ADR-005, unchanged). Add a
semantic diff renderer in the workflow builder UI that interprets the JSON Patch in the
context of the source and target graphs and displays human-friendly operations: node
moved (matched by stable client ID), node renamed (matched by stable ID + changed
label), node config changed (matched by stable ID + changed config fields), edge rewired
(matched by source+target node IDs). The semantic renderer is a pure frontend function:
input is (sourceGraph, targetGraph, jsonPatch); output is a list of semantic operations for
display. The JSON Patch remains the source of truth for storage, audit, and programmatic
diff application.
Consequences — Positive: best of both worlds — standard storage format (JSON
Patch, well-tooled) and friendly review UI (semantic operations); decouples storage from
presentation, so future UI improvements do not require storage migration; semantic
renderer can be iterated on independently of the storage format. Negative: additional
frontend code to maintain (the semantic renderer is non-trivial — ~500 LOC of graph-
matching logic); the renderer must be kept in sync with the node taxonomy as new node
types are added. Neutral: the semantic renderer is a UX concern, not an architectural one —
the storage contract (ADR-005) is unchanged.
Alternatives — Alternative A: Render JSON Patch directly in the UI. Rejected because
the resulting review experience is poor — authors see delete+add where they expect move,
which leads to false-positive 'this looks wrong' reactions and slower review cycles.
Alternative B: Switch storage to a custom graph delta format with semantic operations.
Rejected because it would supersede ADR-005 and lose the benefits of a standard format
(JSON Patch has library support in every language, can be applied programmatically, and is
auditable). Alternative C: Compute semantic diffs on the fly without storing JSON Patch.
Rejected because diffing at read time is expensive for large graphs and we want diffs
available for review without recomputation (per ADR-005).
26.13 ADR-012: Workflow Run History Retention — 13M Hot + 7Y
Cold, Tenant-Configurable
Status: Accepted. Date: 2026-06-18. Deciders: Platform Architecture,
Security/Compliance Lead, SRE Lead, Finance Lead.
Context: Workflow executions, audit logs, and metering events must be retained for
compliance (SOC 2, HIPAA, GDPR Article 30 records of processing). The compliance
baseline is 7 years for audit-relevant data. Hot retention (queryable from PostgreSQL) is
bounded by database capacity — executions are partitioned monthly, and the Year 3 hot
volume (50M executions/day) means each monthly partition is ~1.5B rows. Cold retention
(object storage in Parquet) is essentially unbounded but slow to query. Some Enterprise
customers (financial services, healthcare) have regulatory retention requirements longer
than the platform default (e.g., 6-year hot for FINRA-regulated workflows).
Decision: Default retention is 13 months hot (PostgreSQL, partitioned monthly) + 7
years cold (object storage in Parquet, accessible via slow-query path). Hot retention is
tenant-configurable: Enterprise tenants can extend hot retention to 24 or 36 months at
additional storage cost (passed through as a per-GB-month line item). Cold retention is fixed
at 7 years for all tenants (compliance baseline — cannot be shortened, can be extended for
Enterprise with a custom contract). Tier 3 (Dedicated Cluster) tenants can configure fully
custom retention because they own their own PostgreSQL instance.
Consequences — Positive: meets compliance baseline (SOC 2, HIPAA) by default;
accommodates Enterprise customers with longer retention requirements without bespoke
contracts for each; storage cost is transparent (customer pays for extended hot retention);
cold query path supports compliance inquiries without keeping 7 years of data in expensive
PostgreSQL storage. Negative: hot retention extension increases PostgreSQL storage cost
materially (36 months of executions at Year 3 volume = ~54B rows in PostgreSQL); cold
query path is slow (minutes, not milliseconds) — customers with realtime analytics needs
must keep data hot; partition management becomes more complex with per-tenant retention
policies (partition detachment is now tenant-aware). Neutral: the tenant-configurable
retention adds a setting to the tenant_settings table; the partition management job reads this
setting when deciding which partitions to detach.
Alternatives — Alternative A: Fixed 13M hot + 7Y cold for all tenants. Rejected because
it is too rigid for Enterprise customers with regulatory retention requirements longer than 13
months hot; we would lose deals to platforms that accommodate longer retention.
Alternative B: Unlimited hot retention. Rejected because PostgreSQL capacity is finite and
the storage cost would be unsustainable at Year 3 volume. Alternative C: Per-tenant fully
custom retention (any value for hot and cold). Rejected because of operational complexity
— the partition management job would need to handle arbitrary retention windows per
tenant, and the cost model would be unpredictable. The 13M/24M/36M tiers give customers
meaningful choice without unbounded complexity. Alternative D: Outsource retention to a
data warehouse (Snowflake / BigQuery). Rejected for v2.x because it adds a new stateful
dependency and a per-query cost model that is hard to predict; reconsider if analytics
workload volume justifies it.

## 27. Engineering Roadmap

The roadmap balances platform foundations, product surfaces, and enterprise
readiness. v2.0 focuses on the minimum set of primitives required to author, run, observe,
and monetize workflows and dashboards, plus the AI platform and compliance posture
needed for Enterprise sales. Later phases expand into multi-region maturity and ecosystem
growth.

**Table 37. Engineering Roadmap**

Phase Target Quarter Focus Key
Deliverables
Exit Criteria
Phase 1 Q3 2026 Core platform Auth + RBAC +
tenants +
workflow CRUD

- builder +
  execution +
  basic
  observability
  End-to-end
  workflow publish
- execute +
  monitor working
  in staging
  Phase 2 Q4 2026 – Q1
  2027
  Distribution &
  monetization
  Marketplace +
  connector SDK +
  template registry
- billing +
  metering
  First paid
  customer
  onboarded; first
  partner
  connector
  published
  Phase 3 Q2 2027 AI & promotion AI runtime +
  prompt
  governance +
  RAG +
  guardrails +
  environment
  promotion
  AI node adoption
  > 20% of
  > workflows; SOC
  > 2 Type II audit
  > kickoff
  > Phase 4 Q3 2027 Enterprise scale Multi-region
  > (Phase 2 of
  > multi-region
  > plan) + DR
  > maturity +
  > Dedicated
  > Cluster tier +
  > compliance
  > hardening
  > First HIPAA
  > customer
  > signed; ISO
  > 27001
  > certification audit
  > Phase 5 Q4 2027 – Q1
  > 2028
  > Global resilience Active-passive
  > failover +
  > regional
  > execution pools
- advanced
  ecosystem
  (partner
  program)
  Active-passive
  failover drill
  successful; 10+
  partner
  connectors in
  marketplace

28. Implementation Appendices (Consolidated &
    Deduplicated)
    v1.0 repeated the same 3-row contract-rules table under eight different domain
    sections. v2.0 replaces that duplication with a single cross-cutting Contract Rules Matrix
    (Appendix A). The remaining appendices consolidate event catalog, runbooks, verification
    matrix, ownership matrix, and glossary into one each.

### Appendix A. Contract Rules Matrix

This matrix replaces the eight identical tables from v1.0. Each row is a domain;
columns capture the contract artifact, idempotency mechanism, versioning rule, validation
strategy, and audit hook. The matrix is intentionally exhaustive — every domain gets the
same five-column treatment so reviewers can scan horizontally for consistency.

**Table 38. Contract Rules Matrix by Domain**

Domain Contract
Artifact
Idempotenc
y
Mechanism
Versioning
Rule
Validation
Strategy
Audit Hook
Backend API OpenAPI 3.1
spec +
generated
clients
x-
idempotency-
key header
on writes
(UUID, 24h
TTL)
Path-based
(/api/v1/);
6mo
deprecation
(ADR-004)
Schema
validation at
gateway +
service layer
Every
mutation logs
actor_id,
action,
target_id,
correlation_id
Frontend
rendering
Generated
TS types
from
OpenAPI/SD
L
Optimistic
concurrency
tokens on
draft updates
Component
version
follows
design-
system
semver
Type-check
at build +
contract test
against
OpenAPI
Frontend
errors logged
with
correlation_id
Workflow
execution
Workflow
version
(immutable,
checksumme
d)
Deterministic
key: run_id +
node_id +
attempt
Immutable
published
versions; live
alias rebinds
Schema +
cycle + policy
validation at
publish
Every state
transition
logged;
checkpoint
per node
Dashboard
rendering
Dashboard
version
(immutable,
checksumme
d)
Read-only
path —
idempotent
by
construction
Same as
workflow
versions
Schema
validation on
layout +
widget config
Render-time
permission
checks
logged
Connector
packaging
Manifest
(signed,
Sigstore)
Action-level
idempotency
declared in
manifest
Semver on
connector
versions
Signature
verification +
compatibility
check at
install
Install /
revoke / call
logged with
connector_ve
rsion_id
AI safety Prompt
version
(immutable,
checksumme
d) + model
registry
x-
idempotency-
key on AI
runs;
idempotency
key per (run,
attempt)
Prompt
versions
immutable;
model
registry
versioned
Eval gate
before
production
promotion
(Section 8.8)
Every AI run
logs
prompt_versi
on_id, model,
provider,
token_usage,
guardrail
results
Domain Contract
Artifact
Idempotenc
y
Mechanism
Versioning
Rule
Validation
Strategy
Audit Hook
Billing Metering
event
schema
(JSON
Schema,
versioned)
Append-only
by event_id;
consumer
dedupe by
(consumer,
event_id)
Event
versioning
policy
(Section
19.2)
Daily
reconciliation
job vs raw
events
Invoice line
→ rollup →
raw event
traceability
Security RBAC
permission
catalog +
audit log
schema
Idempotent
token
revocation;
replay
protection on
auth flows
Permission
catalog
additive-only;
role changes
versioned
Policy check
at gateway +
service layer
(defense in
depth)
All sensitive
actions
logged with
actor, target,
timestamp,
correlation_id
Event bus Event JSON
Schema per
event_type +
version
Event_id
dedupe at
consumer;
processing
log per
consumer
Additive →
minor bump;
breaking →
new
event_type
Schema
validation at
producer CI +
consumer
ingest
Every event
stored
immutable in
platform_eve
nts table
Templates &
marketplace
Template
manifest
(signed) +
listing
metadata
Install
idempotency
by (tenant_id,
template_ver
sion_id)
Semver on
template
versions;
listing
metadata
mutable
Compatibility

- signature
  check at
  install
  Install /
  publish /
  deprecate
  logged
  Environment
  promotion
  Release
  record
  (immutable)
  Promotion
  idempotency
  by
  (version_id,
  target_env)
  — re-
  promotion is
  a no-op
  Immutable
  releases;
  rollback
  rebinds alias
  Policy check
  (approvers,
  parity) before
  approval
  Release
  record +
  audit log +
  event on
  every
  promotion

### Appendix B. Event Catalog (Consolidated)

The complete event catalog lives in Section 19.4. The table below is a quick-reference
summary grouped by domain. For full payload schemas, see the JSON Schema files in
packages/shared-types/schemas/events/.

**Table 39. Event Catalog Summary**

Domain Events Primary Consumers
Workflow workflow.created, .published,
.activated
Execution service, search,
audit, cache
Execution execution.started, .completed,
.failed, .checkpoint.persisted
Monitoring, billing, UI, alerts
Domain Events Primary Consumers
Connector connector.installed, .revoked Runtime, billing
Template template.published, .deprecat
ed
Marketplace search, catalog
sync
AI ai.run.completed, .run.guardra
il.violation
Token billing, analytics,
security
Billing usage.recorded,
billing.invoice.generated
Rollup, invoice, notifications
Environment environment.promoted, .rolled
\_back
Release audit, notifications

### Appendix C. Runbook Catalog

Each runbook documents: signals to inspect, immediate response, escalation path,
and target resolution time. Runbooks live in the repository at docs/runbooks/ and are linked
from alert notifications.

**Table 40. Runbook Catalog**

Runbook Signals to Inspect Immediate
Response
Target Time
Login outage Auth provider,
session service, MFA,
gateway logs
Restore access;
identify provider or
config issue
Minutes
Workflow publish
failure
Graph schema,
permissions, version
lock
Fix draft and
republish, or rollback
Minutes to hours
Execution backlog Queue depth, worker
health, dead-letter
count
Scale workers or
pause trigger
ingestion
Minutes
Webhook delivery
failures
Signatures, retries,
response codes
Repair endpoint or
rotate secret
Minutes
Connector install
failures
Manifest,
permissions, auth,
trust state
Re-run validation or
patch package
Minutes
Dashboard preview
errors
Widget schema, data
bindings, permissions
Fix widget config or
access rule
Minutes
Billing mismatch Rollups vs raw
metering events
Reconcile, re-run
aggregation, or
correct event source
Hours
AI provider
degradation
Provider availability,
timeout, quota
Fallback
model/provider or
throttle usage
Minutes
Runbook Signals to Inspect Immediate
Response
Target Time
Region failover Traffic reroute +
tenant placement
review
Restore service in
secondary region
Hours
Database restore Snapshot + WAL
recovery
Rebuild from point-in-
time backup
Hours
Security incident Audit trail, token
revocation,
impersonation log
Revoke
secrets/sessions/toke
ns; contain;
investigate; document
As needed
AI guardrail violation
spike
Guardrail violation
events, model,
prompt version
Identify problematic
prompt or input
pattern; block or
rollback prompt
Minutes to hours

### Appendix D. Verification Matrix

A production-ready architecture package is paired with a verification matrix so the
engineering team can confirm the platform behaves as designed. The tests below are the
minimum cases that should be automated or rehearsed before launch. Every row maps to
an automated or rehearsed check with evidence retained in the repository or release
system.

**Table 41. Verification Matrix**

Test Case Expected Result Systems Involved Owner
Auth login User can log in with
password + MFA;
session bootstrap
works; audit recorded
Frontend + auth
service
Identity team
Workflow draft create User can create +
edit a draft workflow;
graph validation
works
Workflow service + UI Workflow team
Workflow publish Valid workflow
publishes immutable
version; publish audit
exists
Workflow service +
execution
Workflow team
Workflow run Workflow executes
from trigger to
completion
Execution service +
worker
Execution team
Workflow retry Failed run can be
retried safely;
idempotency
preserved
Execution service Execution team
Test Case Expected Result Systems Involved Owner
Long-running
workflow
Workflow with human
approval pauses +
resumes correctly
Execution +
scheduler
Execution team
Saga compensation Downstream failure
triggers
compensation
handlers in reverse
order
Execution +
connector runtime
Execution team
Dashboard preview Draft dashboard
renders safely;
permission checks
enforced
Dashboard studio +
preview
Dashboard team
Connector install Tenant installs
connector package;
trust + secrets
binding validated
Connector service Ecosystem team
Template install Template creates
required assets;
dependencies
resolved
Template service Ecosystem team
AI run Prompt executes;
guardrails + metering
active
AI service AI team
AI RAG retrieval RAG retrieves correct
chunks; citations
preserved
AI service + pgvector AI team
AI guardrail block PII / injection input
blocked; violation
event emitted
AI service +
guardrails
AI team
AI eval gate Prompt change with
score regression
blocked from
production
AI service + eval
framework
AI team
Billing rollup Usage events
aggregate into invoice
lines; reconciliation
passes
Billing service Finance team
Audit search Admin can search
audit logs; search
scoped +
permissioned
Audit service Security team
Region failover Traffic reroutes to
secondary region;
recovery objective
met
SRE + platform SRE
Test Case Expected Result Systems Involved Owner
Backup restore Database + artifacts
can be restored; data
integrity verified
SRE + database
team
SRE
Release rollback Deployment can
revert to previous
version
Release engineering Release engineering
Tenant isolation (Tier

1.  Tenant A cannot read
    Tenant B's data via
    API or workflow
    All services Security team
    Tenant isolation (Tier
2.  Tier 2 tenant's
    workers cannot
    access other tenants'
    queues
    Execution + K8s SRE + Security

### Appendix E. Ownership Matrix

This matrix maps major platform components to their owning teams. It is intended to
accelerate team assignment, codebase navigation, and service-by-service planning.
Ownership is recorded in CODEOWNERS files in the repository; this appendix is the
human-readable summary.

**Table 42. Component Ownership Matrix**

Component Responsibilities Owning Team
Web shell Global layout, navigation,
tenant state, error boundaries
Frontend platform
Auth views Login, signup, SSO, MFA,
invite acceptance
Identity team
Workflow list / detail / editor Browse, search, metadata,
version history, canvas editing
Workflow product team
Execution monitor Run list, step detail, logs,
checkpoints
Execution team
Dashboard studio Layout editor, widgets,
bindings, preview
Dashboard team
Marketplace catalog Search, detail pages, install
flows
Ecosystem team
Billing console Usage, invoices, plans, portal
entry
Finance + platform
Admin console Users, roles, audit, flags,
policies
Platform ops
API gateway Routing, auth enforcement,
request shaping
Backend platform
Workflow service Drafts, publish, diff, validation Backend workflow team
Component Responsibilities Owning Team
Execution service Scheduler, worker
orchestration, checkpointing
Backend execution team
Connector service Catalog, installs, trust,
manifests
Ecosystem backend
Template service Registry, package installs,
search
Ecosystem backend
Billing service Usage aggregation, invoices,
entitlements
Finance platform
AI service Model registry, prompt runs,
token meter
AI platform
Audit service Security logs, admin trails,
export
Security + compliance
Search service Indexes, query APIs, ranking Platform infrastructure
Notification service Email, in-app, webhook
delivery
Platform infrastructure
Shared UI package Buttons, modals, tables, form
fields
Design system
SDK package Connector SDK, workflow
SDK, shared contracts
Developer experience
Workflow engine package Graph runtime, checkpointing,
step contracts
Execution team
Shared types package Schemas, DTOs, generated
types
Architecture / platform
Kubernetes manifests Deployments, jobs, HPAs,
ingress, policies
SRE / DevOps
Terraform modules Cloud primitives, networking,
storage, secrets
SRE / DevOps
Observability stack Logs, metrics, traces, alerts,
dashboards
SRE / DevOps
Documentation site Architecture docs, API docs,
SDK docs
Developer experience
Release automation Build, scan, sign, deploy,
rollback
Release engineering
Feature flag admin Runtime controls and rollout Platform ops
Tenant support tools Impersonation, diagnostics,
exports
Customer support + platform

### Appendix F. Glossary

**Table 43. Glossary**

Term Definition Governance Note
Control plane Services and interfaces used
to manage metadata,
permissions, billing,
templates, configuration
Read-heavy but authoritative
Execution plane Workers and async systems
that run workflows, AI tasks,
delivery jobs
Optimized for throughput +
resilience
Draft Editable in-progress workflow
or dashboard definition
Not immutable
Published version Immutable, checksummed
snapshot of a workflow,
dashboard, prompt, or
connector
Cannot be modified; can be
deprecated or revoked
Live alias Pointer indicating which
published version is currently
active in an environment
Moved by promotion /
rollback; never mutates the
version
Environment Dev / staging / prod /
enterprise-dedicated context
for a tenant
Promotion policy is
environment-scoped
Tier (tenancy) Shared (1) / Dedicated
Namespace (2) / Dedicated
Cluster (3) isolation level
Set at provisioning;
upgradable; not
downgradable
Idempotency key Client-supplied UUID that
allows safe retry of a write
operation
24h TTL; consumer dedupe
by key
Checkpoint Persisted state of a workflow
run at a specific node +
attempt
Enables crash recovery +
resume
Lease Time-bounded claim by a
worker on a workflow run
5 min default; renewed every
60s during execution
Compensation Best-effort reverse action
invoked when a downstream
step fails
Declared per Action node;
opt-in
Guardrail Input or output check on an AI
run (PII, injection, content,
tool allow-list)
Configurable per tenant
RAG Retrieval-Augmented
Generation — vector retrieval
of relevant context chunks
before LLM call
pgvector in v1.0; migration
path documented
Term Definition Governance Note
Golden dataset Curated input→expected-
output pairs used by the eval
framework to score prompt
changes
Per prompt; CI-gated
ADR Architecture Decision Record
— immutable record of a
consequential architecture
decision
Numbered; supersession
requires new ADR
SLO Service Level Objective —
internal target for availability /
latency
Reviewed quarterly
Error budget Allowance for incidents +
deployments derived from
SLO (1 − SLO)
50% consumption pauses
non-emergency deploys
RPO / RTO Recovery Point Objective
(max acceptable data loss) /
Recovery Time Objective
(max acceptable downtime)
Validated by quarterly DR
drills
Tenant pinning Region restriction on a
tenant's data; cross-region
replication prohibited for
pinned tenants
Set at provisioning
Sigstore Software supply-chain signing
framework used for connector

- template artifacts
  Verified at install + cold-start

## 29. Resolved Decisions & Next Steps

v2.0 originally listed seven open decisions. As of 2026-06-18, all seven have been
resolved via ADR-0006 through ADR-0012 (see Section 26). This section records the
resolutions and lists the remaining work to translate the architecture into living engineering
artifacts.

### 29.1 Resolved Decisions (ADR-0006 – ADR-0012)

**Table 44. Resolved Open Decisions**

Decision Resolution ADR
API gateway implementation Kong Gateway (OSS or
Enterprise) with Konnect for
multi-region control plane
ADR-006
Identity provider WorkOS — SSO, SCIM,
Admin Portal, MFA via
AuthKit; platform remains
session authority
ADR-007
Decision Resolution ADR
Realtime updates transport Server-Sent Events (SSE)
over HTTP/2; multiplexed per
client; client→server via
REST
ADR-008
Connector sandbox runtime Deno isolates (V8 isolate +
Deno runtime); sub-ms cold-
start; native TS; op-table
capabilities
ADR-009
Search backend PostgreSQL full-text search
(tsvector + GIN) for v2.x;
OpenSearch as documented
escape path
ADR-010
Workflow diff UI JSON Patch storage (per
ADR-005) + semantic diff
renderer in UI; decoupled
storage vs. presentation
ADR-011
Run history retention 13M hot + 7Y cold default;
tenant-configurable to
24M/36M hot for Enterprise;
7Y cold fixed (compliance)
ADR-012
All seven ADRs are in Accepted status and are immutable. Supersession requires a
new ADR that explicitly references and replaces the prior one. The ADR backlog is now
empty — future architectural decisions will be captured as new ADRs on a rolling basis as
they arise during implementation.

### 29.2 Implementation Next Steps

The architecture is the contract; the next step is to translate it into living artifacts under
source control. The implementation team should treat the following as the launch checklist
for Phase 1:
• Convert the REST API reference (Section 13) into a complete OpenAPI 3.1 spec at
services/api-gateway/openapi/openapi.yaml. Generate TypeScript clients via
openapi-generator; commit generated clients to packages/shared-types/.
• Convert the GraphQL SDL excerpt (Section 14.2) into the full schema at services/api-
gateway/graphql/schema.graphql. Set up graphql-codegen for TypeScript types.
• Convert the PostgreSQL schema catalog (Section 10) into a Prisma schema at
packages/shared-db/prisma/schema.prisma. Generate the first migration; seed dev
environment with test tenants.
• Convert the Terraform modules skeleton (Section 24) into actual modules under
infrastructure/terraform/modules/. Stand up dev environment first; staging and prod
follow after dev validates the modules.
• Provision Kong Gateway in dev (DB-less mode for GitOps-friendly config). Wire up
routing rules for the first three services (auth, workflow, execution). Add JWT, rate-
limiting, correlation-id, and prometheus plugins.
• Provision WorkOS project in dev. Implement AuthKit integration for self-serve login +
MFA. Stub SAML/OIDC flows for Enterprise SSO (one test IdP connection). Wire
SCIM directory sync to the memberships table.
• Stand up the Deno isolate runtime in dev (via deno_core or Deno Deploy's isolate
SDK). Port the connector SDK to Deno-compatible APIs (fetch, Web Streams, Web
Crypto). Validate cold-start and resource caps against the targets in Section 5.2.
• Implement SSE transport for execution monitoring (Section 25.2). Validate
multiplexing multiple event streams over a single connection. Test proxy compatibility
(corporate proxies that block WebSocket).
• Implement PostgreSQL FTS for the first searchable domain (workflows). Add tsvector
generated columns + GIN indexes. Build the SearchService abstraction (Section
26.11) so future backend swaps are mechanical.
• Implement the semantic diff renderer for workflow versions (ADR-011). Start with the
four operation types: node moved, node renamed, node config changed, edge
rewired. Validate against golden test cases.
• Implement the tenant-configurable retention policy (ADR-012). Add
retention_hot_months to tenant_settings. Update the partition management job to be
tenant-aware. Validate the cold-query path against archived Parquet.
• Set up the observability stack (Prometheus + Loki/Grafana Loki + OpenTelemetry
collector + Jaeger/Tempo) in the dev environment. Wire up the SLO dashboards
(Section 22.1) for the first three services to ship (auth, workflow, execution).
• Bootstrap the design system package (packages/design-system/) with the tokens
defined in Section 7.3. Build the first five primitives (Button, Input, Dialog, Tabs,
Tooltip) and the AppShell component.
• Stand up the CI/CD pipeline (Section 21.3) in GitHub Actions. PR checks and main-
branch checks are the first priority; release checks and progressive delivery gates
come online as services ship.
Once these artifacts exist and the first three services (auth, workflow, execution) are
deployable end-to-end in dev, the platform has crossed the proof-of-concept threshold and
Phase 1 implementation can proceed in parallel across the remaining services. The
architecture document is the reference; the source-controlled artifacts are the truth.

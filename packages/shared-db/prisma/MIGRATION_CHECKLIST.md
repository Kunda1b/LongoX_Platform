# Prisma Migration Checklist

Per ADR-005 (Section 29.2): Prisma is the canonical schema. Drizzle is a temporary compatibility layer.

## Drizzle Tables vs Prisma Models

| # | Drizzle Table | Drizzle File | Prisma Model | Status |
|---|--------------|-------------|-------------|--------|
| 1 | `tenants` | tenants.ts | `Tenant` | ✅ Present |
| 2 | `tenant_settings` | tenant-settings.ts | `TenantSettings` | ✅ Present |
| 3 | `users` | users.ts | `User` | ✅ Present |
| 4 | `memberships` | memberships.ts | `Membership` | ✅ Present |
| 5 | `roles` | roles.ts | `RbacRole` | ✅ Present |
| 6 | `rbac_permissions` | rbac-permissions.ts | `RbacPermission` | ✅ Present |
| 7 | `workflows` | workflows.ts | `Workflow` | ✅ Present |
| 8 | `workflow_versions` | workflow-versions.ts | `WorkflowVersion` | ✅ Present |
| 9 | `workflow_diffs` | workflow-diffs.ts | `WorkflowDiff` | ✅ Present |
| 10 | `workflow_promotions` | workflow-promotions.ts | `WorkflowPromotion` | ✅ Present |
| 11 | `executions` | executions.ts | `WorkflowExecution` | ✅ Present |
| 12 | `execution_checkpoints` | execution-checkpoints.ts | `NodeExecutionCheckpoint` | ✅ Present |
| 13 | `dlq_entries` | dlq-entries.ts | `DeadLetterQueue` | ✅ Present |
| 14 | `connectors` | connectors.ts | `Connector` | ✅ Present |
| 15 | `connector_versions` | connector-versions.ts | `ConnectorVersion` | ✅ Present |
| 16 | `tenant_connector_installs` | tenant-connector-installs.ts | `TenantConnectorInstall` | ✅ Present |
| 17 | `credentials` | credentials.ts | `Credential` | ✅ Present |
| 18 | `dashboards` | dashboards.ts | `Dashboard` | ✅ Present |
| 19 | `dashboard_versions` | dashboard-versions.ts | `DashboardVersion` | ✅ Present |
| 20 | `data_sources` | data-sources.ts | `DataSource` | ✅ Present |
| 21 | `templates` | templates.ts | `Template` | ✅ Present |
| 22 | `template_versions` | template-versions.ts | `TemplateVersion` | ✅ Present |
| 23 | `environments` | environments.ts | `Environment` | ✅ Present |
| 24 | `environment_releases` | environment-releases.ts | `EnvironmentRelease` | ✅ Present |
| 25 | `approval_tasks` | approval-tasks.ts | `ApprovalTask` | ✅ Present |
| 26 | `usage_events` | usage-events.ts | `UsageEvent` | ✅ Present |
| 27 | `metering_events` | metering-events.ts | `MeteringEvent` | ✅ Present |
| 28 | `billing_plans` | billing-plans.ts | `BillingPlan` | ✅ Present |
| 29 | `billing_accounts` | billing.ts | `BillingAccount` | ✅ Present |
| 30 | `invoices` | billing.ts | `Invoice` | ✅ Present |
| 31 | `invoice_lines` | invoice-lines.ts | `InvoiceLine` | ✅ Present |
| 32 | `usage_rollups` | usage-rollups.ts | `UsageRollup` | ✅ Present |
| 33 | `token_budgets` | token-budgets.ts | `TokenBudget` | ✅ Present |
| 34 | `ai_models` | ai-models.ts | `AiModel` | ✅ Present |
| 35 | `prompts` | prompts.ts | `AiPrompt` | ✅ Present |
| 36 | `prompt_versions` | prompts.ts | `AiPromptVersion` | ✅ Present |
| 37 | `token_usage` | token-usage.ts | — | ❌ MISSING |
| 38 | `consumer_offsets` | consumer-offsets.ts | — | ❌ MISSING |
| 39 | `feature_flags` | feature-flags.ts | `FeatureFlag` | ✅ Present |
| 40 | `notifications` | notifications.ts | `Notification` | ✅ Present |
| 41 | `webhook_endpoints` | webhook-endpoints.ts | `WebhookEndpoint` | ✅ Present |
| 42 | `schedules` | schedules.ts | `Schedule` | ✅ Present |
| 43 | `platform_events` | platform-events.ts | `PlatformEvent` | ✅ Present |
| 44 | `user_mfa` | user-mfa.ts | `UserMfa` | ✅ Present |
| 45 | `registrations` | registrations.ts | `UserRegistration` | ✅ Present |
| 46 | `workspace_invitations` | workspace-invitations.ts | `WorkspaceInvitation` | ✅ Present |
| 47 | `audit_log` | audit-log.ts | `AuditLog` | ✅ Present |
| 48 | `region_policies` | region-policies.ts | `RegionPolicy` | ✅ Present |
| 49 | `regions` | regions.ts | `Region` | ✅ Present |
| 50 | `regional_pools` | regional-pools.ts | `RegionalPool` | ✅ Present |
| 51 | `apps` | apps.ts | `App` | ✅ Present |
| 52 | `email_messages` | email-messages.ts | `EmailMessage` | ✅ Present |
| 53 | `marketplace_listings` | marketplace-listings.ts | `MarketplaceListing` | ✅ Present |
| 54 | `marketplace_reviews` | marketplace-reviews.ts | `MarketplaceReview` | ✅ Present |
| 55 | `analytics_read_models` | analytics-read-models.ts | `AnalyticsReadModel` | ✅ Present |
| 56 | `reporting_read_models` | reporting-read-models.ts | `ReportingReadModel` | ✅ Present |
| 57 | `search_index` | search-index.ts | `SearchIndex` | ✅ Present |
| 58 | `tenant_tiers` | tenant-tiers.ts | `TenantTier` | ✅ Present |
| 59 | `tenant_placement` | tenant-placement.ts | `TenantPlacement` | ✅ Present |
| 60 | `tenant_migrations` | tenant-migrations.ts | `TenantMigration` | ✅ Present |
| 61 | `backup_records` | backup-records.ts | `BackupRecord` | ✅ Present |
| 62 | `release_snapshots` | release-snapshots.ts | `ReleaseSnapshot` | ✅ Present |
| 63 | `retention_config` | retention-config.ts | `RetentionConfig` | ✅ Present |
| 64 | `archive_exports` | archive-exports.ts | `ArchiveExport` | ✅ Present |
| 65 | `gdpr_requests` | gdpr-requests.ts | `GdprRequest` | ✅ Present |
| 66 | `compliance_evidence` | compliance-evidence.ts | `ComplianceEvidence` | ✅ Present |
| 67 | `security_incidents` | security-incidents.ts | `SecurityIncident` | ✅ Present |
| 68 | `audit_exports` | audit-exports.ts | `AuditExport` | ✅ Present |
| 69 | `overage_events` | overage-events.ts | `OverageEvent` | ✅ Present |
| 70 | `enterprise_commitments` | enterprise-commitments.ts | `EnterpriseCommitment` | ✅ Present |
| 71 | `ai_routing_policies` | ai-routing-policies.ts | `AiRoutingPolicy` | ✅ Present |
| 72 | `ai_playground_sessions` | ai-playground-sessions.ts | `AiPlaygroundSession` | ✅ Present |
| 73 | `agent_memory` | agent-memory.ts | `AgentMemory` | ✅ Present |
| 74 | `prompt_approvals` | prompt-approvals.ts | `PromptApproval` | ✅ Present |
| 75 | `ai_evaluation_datasets` | ai-evaluation-datasets.ts | `AiEvalDataset` | ✅ Present |
| 76 | `ai_evaluation_dataset_entries` | ai-evaluation-dataset-entries.ts | `AiEvalDatasetEntry` | ✅ Present |
| 77 | `ai_evaluation_runs` | ai-evaluation-runs.ts | `AiEvalRun` | ✅ Present |
| 78 | `ai_evaluation_run_results` | ai-evaluation-run-results.ts | `AiEvalRunResult` | ✅ Present |
| 79 | `ai_guardrails` | ai-guardrails.ts | `AiGuardrail` | ✅ Present |
| 80 | `ai_provider_routes` | ai-provider-routes.ts | `AiProviderRoute` | ✅ Present |
| 81 | `rag_knowledge_bases` | rag-knowledge-bases.ts | `KnowledgeBase` | ✅ Present |
| 82 | `rag_documents` | rag-documents.ts | `KnowledgeDocument` | ✅ Present |
| 83 | `rag_chunks` | rag-chunks.ts | `VectorEmbedding` | ✅ Present |

## Missing Drizzle Tables (not yet in Prisma)

### 1. `token_usage` (token-usage.ts)
High-priority. This table stores per-request AI token usage records. The Prisma equivalent should be `AiUsage` — but the schema differs:
- Drizzle uses serial `id` (integer), Prisma expects CUID strings
- Drizzle has `model_id` (integer), Prisma uses `modelId` (string) referencing `AiModel`
- Drizzle has `workflow_id` (integer), no equivalent in Prisma `AiUsage`
- Drizzle has `prompt_id` (integer), no equivalent in Prisma `AiUsage`

**Action:** Either:
  a) Map to existing `AiUsage` model and migrate data, or
  b) Create a new `TokenUsage` Prisma model if separate semantics required

### 2. `consumer_offsets` (consumer-offsets.ts)
Low-priority. Internal event-sourcing offset tracking. No corresponding Prisma model.

**Action:** Add a `ConsumerOffset` Prisma model:
```prisma
model ConsumerOffset {
  consumerName String   @id @map("consumer_name")
  eventId      String   @id @map("event_id")
  aggregateId  String   @map("aggregate_id")
  processedAt  DateTime @default(now()) @map("processed_at")
  status       String   @default("processing")
  error        String?

  @@id([consumerName, eventId])
  @@map("consumer_offsets")
}
```

## Prisma-Only Models (no Drizzle equivalent)

These models exist in Prisma but have no Drizzle counterpart. They are ahead-of-schema definitions that already comply with ADR-005:

| Prisma Model | Notes |
|-------------|-------|
| `RolePermission` | Join table between roles and permissions |
| `ConnectorAction` | Connector action definitions |
| `ConnectorTrigger` | Connector trigger definitions |
| `ConnectorExecution` | Connector execution audit trail |
| `ConnectorPollingState` | Polling cursor tracking |
| `SsoConnection` | SSO provider configs |
| `UserSsoIdentity` | User-SSO identity links |
| `NotificationTemplate` | Notification message templates |
| `MarketplaceInstall` | Marketplace install tracking |
| `MarketplaceReview` | Marketplace review entries |
| `RevenueShare` | Seller revenue sharing |
| `AgentDeployment` | Agent deployment tracking |
| `AiGuardrailHit` | Guardrail violation events |
| `AiEvalDatasetEntry` | Eval dataset entries (separated from golden_pairs_json) |
| `AiEvalRunResult` | Per-entry eval results |
| `PromptApproval` | Prompt version approval workflow |
| `TenantTierAssignment` | Explicit tier assignment |
| `RestoreRecord` | DR restore tracking |
| `SearchSuggestion` | Search query log |
| `SecurityIncidentEvidence` | Incident evidence artifacts |
| `BillingAccount` | (separated from Drizzle billing_accounts) |
| `ComplianceEvidence` | Compliance audit artifacts |
| `RegionalPool` | Regional pool health |
| `ReleaseSnapshot` | Helm release snapshots |
| `WorkflowPromotion` | Promotion tracking |
| `EnvironmentRelease` | Release deployment tracking |
| `WebhookDelivery` | Webhook delivery log |

## Migration Plan (Ordered)

### Phase 1 — Schema Alignment
1. Add `ConsumerOffset` model to `schema.prisma`
2. Resolve `token_usage` → decide between `AiUsage` migration or new `TokenUsage` model
3. Run `prisma validate` to confirm schema health
4. Generate migration: `prisma migrate dev --name add_token_usage_consumer_offsets`

### Phase 2 — Data Migration
5. Backfill Drizzle-only tables (`consumer_offsets`, `token_usage`) into new Prisma models
6. Verify data integrity with row-count checks

### Phase 3 — Service Migration
7. Migrate services from `drizzle-orm` imports to `@prisma/client`
8. Remove Drizzle schema files incrementally as services migrate
9. Final cleanup: remove `drizzle-kit` and `drizzle-orm` dependencies

## Pre-Migration Checks

- [ ] Run `pnpm prisma:generate` to generate Prisma Client
- [ ] Run `pnpm prisma:validate` to verify schema health
- [ ] Verify `DATABASE_URL` points to correct Postgres instance
- [ ] Confirm `pgvector` extension is available on the target database

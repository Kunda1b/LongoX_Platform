-- =============================================================================
-- Migration 005: CUID String IDs  (ADR-013 Phase 2)
-- =============================================================================
-- Migrates every serial integer PK to a cuid text PK per architecture.md §10
-- and the canonical Prisma schema.
--
-- Steps:
--   1. gen_cuid() helper
--   2. ADD id_text to every table that has a serial PK
--   3. Backfill id_text with generated CUIDs
--   4. ADD text shadow columns for every FK column; backfill from parent id_text
--   5. DROP all FK constraints (dynamic — avoids hardcoding generated names)
--   6. SWAP PKs in dependency order (parents before children)
--   7. SWAP FK columns (rename old int → *_int, rename shadow → original name, DROP *_int)
--   8. RE-ADD FK constraints (text → text) + restore unique constraints
--   9. DROP gen_cuid()
-- =============================================================================

-- Ensure pgcrypto is available (gen_random_bytes is required by gen_cuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Helper: cuid-compatible string ('c' + 30 hex chars, globally unique)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gen_cuid() RETURNS TEXT LANGUAGE sql AS $
  SELECT 'c' || encode(gen_random_bytes(15), 'hex');
$;

-- ---------------------------------------------------------------------------
-- 2. Add id_text to every table with a serial PK
-- ---------------------------------------------------------------------------
ALTER TABLE tenants                       ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_settings               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE users                         ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE memberships                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE roles                         ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE permissions                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE rbac_permissions              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE user_roles                    ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workflows                     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workflow_versions             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workflow_diffs                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workflow_promotions           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE executions                    ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE execution_checkpoints         ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE dlq_entries                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connectors                    ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connector_actions             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connector_triggers            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connector_versions            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connector_executions          ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE connector_polling_states      ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_connector_installs     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE credentials                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE dashboards                    ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE dashboard_versions            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE data_sources                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE templates                     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE template_versions             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE environments                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE environment_releases          ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE approval_tasks                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE usage_events                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE metering_events               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE billing_plans                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE billing_accounts              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE invoices                      ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE invoice_lines                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE usage_rollups                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE token_budgets                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_models                     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE prompts                       ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE prompt_versions               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE token_usage                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE feature_flags                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE notifications                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE notification_templates        ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE webhook_endpoints             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE webhook_deliveries            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE schedules                     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE platform_events               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE user_mfa                      ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE sso_connections               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE user_sso_identities           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE user_registrations            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workspace_invitations         ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE audit_log                     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE region_policies               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE regions                       ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE replication_configs           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE replication_log               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE dr_policies                   ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE revenue_shares                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE agent_deployments             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE regional_pools                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE apps                          ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE email_messages                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE marketplace_listings          ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE marketplace_installs          ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE marketplace_reviews           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE analytics_events              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE analytics_metrics             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE workflow_analytics            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_analytics                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE reporting_snapshots           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE reporting_exports             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE reporting_kpis                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE search_index                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE search_suggestions            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_tiers                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_tier_assignments       ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_placement              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE tenant_migrations             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE backup_records                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE restore_records               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE release_snapshots             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE retention_config              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE archive_exports               ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE gdpr_requests                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE compliance_evidence           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE security_incidents            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE security_incident_evidence    ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE audit_exports                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE overage_events                ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE enterprise_commitments        ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_routing_policies           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_playground_sessions        ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE agent_memory                  ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE prompt_approvals              ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_evaluation_datasets        ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_evaluation_dataset_entries ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_evaluation_runs            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_evaluation_run_results     ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_guardrails                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_guardrail_hits             ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE ai_provider_routes            ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE rag_knowledge_bases           ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE rag_documents                 ADD COLUMN IF NOT EXISTS id_text TEXT;
ALTER TABLE rag_chunks                    ADD COLUMN IF NOT EXISTS id_text TEXT;

-- ---------------------------------------------------------------------------
-- 3. Backfill id_text with generated CUIDs
-- ---------------------------------------------------------------------------
UPDATE tenants                       SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_settings               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE users                         SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE memberships                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE roles                         SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE permissions                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE rbac_permissions              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE user_roles                    SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workflows                     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workflow_versions             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workflow_diffs                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workflow_promotions           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE executions                    SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE execution_checkpoints         SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE dlq_entries                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connectors                    SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connector_actions             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connector_triggers            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connector_versions            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connector_executions          SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE connector_polling_states      SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_connector_installs     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE credentials                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE dashboards                    SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE dashboard_versions            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE data_sources                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE templates                     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE template_versions             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE environments                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE environment_releases          SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE approval_tasks                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE usage_events                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE metering_events               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE billing_plans                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE billing_accounts              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE invoices                      SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE invoice_lines                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE usage_rollups                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE token_budgets                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_models                     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE prompts                       SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE prompt_versions               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE token_usage                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE feature_flags                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE notifications                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE notification_templates        SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE webhook_endpoints             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE webhook_deliveries            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE schedules                     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE platform_events               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE user_mfa                      SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE sso_connections               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE user_sso_identities           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE user_registrations            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workspace_invitations         SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE audit_log                     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE region_policies               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE regions                       SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE replication_configs           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE replication_log               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE dr_policies                   SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE revenue_shares                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE agent_deployments             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE regional_pools                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE apps                          SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE email_messages                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE marketplace_listings          SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE marketplace_installs          SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE marketplace_reviews           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE analytics_events              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE analytics_metrics             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE workflow_analytics            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_analytics                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE reporting_snapshots           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE reporting_exports             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE reporting_kpis                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE search_index                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE search_suggestions            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_tiers                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_tier_assignments       SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_placement              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE tenant_migrations             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE backup_records                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE restore_records               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE release_snapshots             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE retention_config              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE archive_exports               SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE gdpr_requests                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE compliance_evidence           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE security_incidents            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE security_incident_evidence    SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE audit_exports                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE overage_events                SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE enterprise_commitments        SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_routing_policies           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_playground_sessions        SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE agent_memory                  SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE prompt_approvals              SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_evaluation_datasets        SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_evaluation_dataset_entries SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_evaluation_runs            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_evaluation_run_results     SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_guardrails                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_guardrail_hits             SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE ai_provider_routes            SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE rag_knowledge_bases           SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE rag_documents                 SET id_text = gen_cuid() WHERE id_text IS NULL;
UPDATE rag_chunks                    SET id_text = gen_cuid() WHERE id_text IS NULL;

-- ---------------------------------------------------------------------------
-- 4a. Add text shadow columns for every FK column
--     Naming convention: <column>_new (temporary; renamed in step 7)
-- ---------------------------------------------------------------------------

-- tenant_settings
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS tenant_id_new  TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS user_id_new    TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS role_id_new    TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS invited_by_new TEXT;

-- user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id_new   TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- workflow_versions
ALTER TABLE workflow_versions ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;

-- workflow_diffs
ALTER TABLE workflow_diffs ADD COLUMN IF NOT EXISTS workflow_id_new      TEXT;
ALTER TABLE workflow_diffs ADD COLUMN IF NOT EXISTS from_version_id_new  TEXT;
ALTER TABLE workflow_diffs ADD COLUMN IF NOT EXISTS to_version_id_new    TEXT;

-- executions
ALTER TABLE executions ADD COLUMN IF NOT EXISTS tenant_id_new            TEXT;
ALTER TABLE executions ADD COLUMN IF NOT EXISTS workflow_id_new          TEXT;
ALTER TABLE executions ADD COLUMN IF NOT EXISTS parent_execution_id_new  TEXT;

-- execution_checkpoints
ALTER TABLE execution_checkpoints ADD COLUMN IF NOT EXISTS execution_id_new TEXT;

-- dlq_entries
ALTER TABLE dlq_entries ADD COLUMN IF NOT EXISTS execution_id_new TEXT;
ALTER TABLE dlq_entries ADD COLUMN IF NOT EXISTS workflow_id_new  TEXT;

-- connectors (no FK columns)

-- connector_actions
ALTER TABLE connector_actions ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- connector_triggers
ALTER TABLE connector_triggers ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- connector_versions
ALTER TABLE connector_versions ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- connector_executions
ALTER TABLE connector_executions ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- connector_polling_states
ALTER TABLE connector_polling_states ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- tenant_connector_installs
ALTER TABLE tenant_connector_installs ADD COLUMN IF NOT EXISTS tenant_id_new           TEXT;
ALTER TABLE tenant_connector_installs ADD COLUMN IF NOT EXISTS connector_id_new        TEXT;
ALTER TABLE tenant_connector_installs ADD COLUMN IF NOT EXISTS connector_version_id_new TEXT;
ALTER TABLE tenant_connector_installs ADD COLUMN IF NOT EXISTS installed_by_new        TEXT;

-- credentials
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS connector_id_new TEXT;

-- dashboards
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- dashboard_versions
ALTER TABLE dashboard_versions ADD COLUMN IF NOT EXISTS dashboard_id_new TEXT;
ALTER TABLE dashboard_versions ADD COLUMN IF NOT EXISTS created_by_new   TEXT;

-- data_sources
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS tenant_id_new  TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS created_by_new TEXT;

-- template_versions
ALTER TABLE template_versions ADD COLUMN IF NOT EXISTS template_id_new TEXT;

-- environment_releases
ALTER TABLE environment_releases ADD COLUMN IF NOT EXISTS environment_id_new      TEXT;
ALTER TABLE environment_releases ADD COLUMN IF NOT EXISTS artifact_id_new         TEXT;
ALTER TABLE environment_releases ADD COLUMN IF NOT EXISTS artifact_version_id_new TEXT;
ALTER TABLE environment_releases ADD COLUMN IF NOT EXISTS rollback_of_new         TEXT;

-- approval_tasks
ALTER TABLE approval_tasks ADD COLUMN IF NOT EXISTS workflow_id_new   TEXT;
ALTER TABLE approval_tasks ADD COLUMN IF NOT EXISTS execution_id_new  TEXT;
ALTER TABLE approval_tasks ADD COLUMN IF NOT EXISTS requester_id_new  TEXT;
ALTER TABLE approval_tasks ADD COLUMN IF NOT EXISTS approver_id_new   TEXT;

-- metering_events
ALTER TABLE metering_events ADD COLUMN IF NOT EXISTS tenant_id_new    TEXT;
ALTER TABLE metering_events ADD COLUMN IF NOT EXISTS workflow_id_new  TEXT;
ALTER TABLE metering_events ADD COLUMN IF NOT EXISTS execution_id_new TEXT;
ALTER TABLE metering_events ADD COLUMN IF NOT EXISTS connector_id_new TEXT;
ALTER TABLE metering_events ADD COLUMN IF NOT EXISTS dashboard_id_new TEXT;

-- billing_accounts
ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS plan_id_new   TEXT;

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_account_id_new TEXT;

-- invoice_lines
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- usage_rollups
ALTER TABLE usage_rollups ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- token_budgets
ALTER TABLE token_budgets ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE token_budgets ADD COLUMN IF NOT EXISTS scope_id_new  TEXT;

-- prompt_versions
ALTER TABLE prompt_versions ADD COLUMN IF NOT EXISTS prompt_id_new TEXT;

-- token_usage
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS model_id_new    TEXT;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS prompt_id_new   TEXT;
ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;

-- notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- webhook_endpoints
ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;

-- webhook_deliveries
ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS endpoint_id_new TEXT;

-- schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;

-- user_mfa
ALTER TABLE user_mfa ADD COLUMN IF NOT EXISTS user_id_new TEXT;

-- sso_connections
ALTER TABLE sso_connections ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- user_sso_identities
ALTER TABLE user_sso_identities ADD COLUMN IF NOT EXISTS user_id_new TEXT;

-- user_registrations
ALTER TABLE user_registrations ADD COLUMN IF NOT EXISTS user_id_new   TEXT;
ALTER TABLE user_registrations ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- workspace_invitations
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS tenant_id_new  TEXT;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS invited_by_new TEXT;
ALTER TABLE workspace_invitations ADD COLUMN IF NOT EXISTS role_id_new    TEXT;

-- audit_log
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- replication_log
ALTER TABLE replication_log ADD COLUMN IF NOT EXISTS config_id_new TEXT;

-- revenue_shares
ALTER TABLE revenue_shares ADD COLUMN IF NOT EXISTS listing_id_new       TEXT;
ALTER TABLE revenue_shares ADD COLUMN IF NOT EXISTS seller_tenant_id_new TEXT;

-- agent_deployments
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS listing_id_new  TEXT;
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE agent_deployments ADD COLUMN IF NOT EXISTS deployed_by_new TEXT;

-- email_messages
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- marketplace_listings
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS author_id_new   TEXT;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS resource_id_new TEXT;

-- marketplace_installs
ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS listing_id_new   TEXT;
ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS tenant_id_new    TEXT;
ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS installed_by_new TEXT;

-- marketplace_reviews
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS listing_id_new   TEXT;
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS tenant_id_new    TEXT;
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS user_id_new      TEXT;
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS moderated_by_new TEXT;

-- analytics_events
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS user_id_new   TEXT;

-- analytics_metrics
ALTER TABLE analytics_metrics ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- workflow_analytics
ALTER TABLE workflow_analytics ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;
ALTER TABLE workflow_analytics ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;

-- ai_analytics
ALTER TABLE ai_analytics ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- tenant_tier_assignments
ALTER TABLE tenant_tier_assignments ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE tenant_tier_assignments ADD COLUMN IF NOT EXISTS tier_id_new   TEXT;

-- tenant_placement
ALTER TABLE tenant_placement ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE tenant_placement ADD COLUMN IF NOT EXISTS region_id_new TEXT;

-- tenant_migrations
ALTER TABLE tenant_migrations ADD COLUMN IF NOT EXISTS tenant_id_new    TEXT;
ALTER TABLE tenant_migrations ADD COLUMN IF NOT EXISTS from_tier_id_new TEXT;
ALTER TABLE tenant_migrations ADD COLUMN IF NOT EXISTS to_tier_id_new   TEXT;

-- backup_records
ALTER TABLE backup_records ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- restore_records
ALTER TABLE restore_records ADD COLUMN IF NOT EXISTS backup_id_new TEXT;
ALTER TABLE restore_records ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- retention_config
ALTER TABLE retention_config ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- gdpr_requests
ALTER TABLE gdpr_requests ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;
ALTER TABLE gdpr_requests ADD COLUMN IF NOT EXISTS user_id_new   TEXT;

-- compliance_evidence
ALTER TABLE compliance_evidence ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- security_incidents
ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS resolved_by_new TEXT;

-- security_incident_evidence
ALTER TABLE security_incident_evidence ADD COLUMN IF NOT EXISTS incident_id_new TEXT;

-- audit_exports
ALTER TABLE audit_exports ADD COLUMN IF NOT EXISTS tenant_id_new  TEXT;
ALTER TABLE audit_exports ADD COLUMN IF NOT EXISTS created_by_new TEXT;

-- overage_events
ALTER TABLE overage_events ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- enterprise_commitments
ALTER TABLE enterprise_commitments ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- ai_routing_policies
ALTER TABLE ai_routing_policies ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- ai_playground_sessions
ALTER TABLE ai_playground_sessions ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- agent_memory
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS tenant_id_new   TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS workflow_id_new TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS execution_id_new TEXT;

-- prompt_approvals
ALTER TABLE prompt_approvals ADD COLUMN IF NOT EXISTS prompt_id_new TEXT;

-- ai_evaluation_datasets
ALTER TABLE ai_evaluation_datasets ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- ai_evaluation_dataset_entries
ALTER TABLE ai_evaluation_dataset_entries ADD COLUMN IF NOT EXISTS dataset_id_new TEXT;

-- ai_evaluation_runs
ALTER TABLE ai_evaluation_runs ADD COLUMN IF NOT EXISTS tenant_id_new  TEXT;
ALTER TABLE ai_evaluation_runs ADD COLUMN IF NOT EXISTS dataset_id_new TEXT;
ALTER TABLE ai_evaluation_runs ADD COLUMN IF NOT EXISTS prompt_id_new  TEXT;

-- ai_evaluation_run_results
ALTER TABLE ai_evaluation_run_results ADD COLUMN IF NOT EXISTS run_id_new   TEXT;
ALTER TABLE ai_evaluation_run_results ADD COLUMN IF NOT EXISTS entry_id_new TEXT;

-- ai_guardrails
ALTER TABLE ai_guardrails ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- ai_guardrail_hits
ALTER TABLE ai_guardrail_hits ADD COLUMN IF NOT EXISTS guardrail_id_new TEXT;

-- ai_provider_routes
ALTER TABLE ai_provider_routes ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- rag_knowledge_bases
ALTER TABLE rag_knowledge_bases ADD COLUMN IF NOT EXISTS tenant_id_new TEXT;

-- rag_documents
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS knowledge_base_id_new TEXT;

-- rag_chunks
ALTER TABLE rag_chunks ADD COLUMN IF NOT EXISTS document_id_new      TEXT;
ALTER TABLE rag_chunks ADD COLUMN IF NOT EXISTS knowledge_base_id_new TEXT;

-- role_permissions (composite PK — no id column, but FK cols need migration)
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id_new       TEXT;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_id_new TEXT;

-- ---------------------------------------------------------------------------
-- 4b. Backfill FK shadow columns from parent id_text
--     All JOINs use the still-intact integer id — must happen before step 6
-- ---------------------------------------------------------------------------

-- tenant_settings
UPDATE tenant_settings ts SET tenant_id_new = t.id_text FROM tenants t WHERE ts.tenant_id = t.id;

-- users
UPDATE users u SET tenant_id_new = t.id_text FROM tenants t WHERE u.tenant_id = t.id;

-- memberships
UPDATE memberships m SET tenant_id_new  = t.id_text FROM tenants t WHERE m.tenant_id  = t.id;
UPDATE memberships m SET user_id_new    = u.id_text FROM users   u WHERE m.user_id     = u.id;
UPDATE memberships m SET role_id_new    = r.id_text FROM roles   r WHERE m.role_id     = r.id AND m.role_id   IS NOT NULL;
UPDATE memberships m SET invited_by_new = u.id_text FROM users   u WHERE m.invited_by  = u.id AND m.invited_by IS NOT NULL;

-- user_roles
UPDATE user_roles ur SET role_id_new   = r.id_text FROM roles   r WHERE ur.role_id   = r.id;
UPDATE user_roles ur SET tenant_id_new = t.id_text FROM tenants t WHERE ur.tenant_id = t.id AND ur.tenant_id IS NOT NULL;

-- workflows
UPDATE workflows w SET tenant_id_new = t.id_text FROM tenants t WHERE w.tenant_id = t.id;

-- workflow_versions
UPDATE workflow_versions wv SET workflow_id_new = w.id_text FROM workflows w WHERE wv.workflow_id = w.id;

-- workflow_diffs
UPDATE workflow_diffs wd SET workflow_id_new     = w.id_text  FROM workflows        w  WHERE wd.workflow_id     = w.id;
UPDATE workflow_diffs wd SET from_version_id_new = wv.id_text FROM workflow_versions wv WHERE wd.from_version_id = wv.id;
UPDATE workflow_diffs wd SET to_version_id_new   = wv.id_text FROM workflow_versions wv WHERE wd.to_version_id   = wv.id;

-- executions (parent_execution_id is self-referential)
UPDATE executions e SET tenant_id_new   = t.id_text FROM tenants   t WHERE e.tenant_id   = t.id;
UPDATE executions e SET workflow_id_new = w.id_text FROM workflows  w WHERE e.workflow_id = w.id;
UPDATE executions e SET parent_execution_id_new = p.id_text
  FROM executions p WHERE e.parent_execution_id = p.id AND e.parent_execution_id IS NOT NULL;

-- execution_checkpoints
UPDATE execution_checkpoints ec SET execution_id_new = e.id_text FROM executions e WHERE ec.execution_id = e.id;

-- dlq_entries
UPDATE dlq_entries d SET execution_id_new = e.id_text FROM executions e WHERE d.execution_id = e.id;
UPDATE dlq_entries d SET workflow_id_new  = w.id_text FROM workflows  w WHERE d.workflow_id  = w.id;

-- connector_actions
UPDATE connector_actions ca SET connector_id_new = c.id_text FROM connectors c WHERE ca.connector_id = c.id;

-- connector_triggers
UPDATE connector_triggers ct SET connector_id_new = c.id_text FROM connectors c WHERE ct.connector_id = c.id;

-- connector_versions
UPDATE connector_versions cv SET connector_id_new = c.id_text FROM connectors c WHERE cv.connector_id = c.id;

-- connector_executions
UPDATE connector_executions ce SET connector_id_new = c.id_text FROM connectors c WHERE ce.connector_id = c.id;

-- connector_polling_states
UPDATE connector_polling_states cps SET connector_id_new = c.id_text FROM connectors c WHERE cps.connector_id = c.id;

-- tenant_connector_installs
UPDATE tenant_connector_installs tci SET tenant_id_new            = t.id_text  FROM tenants           t  WHERE tci.tenant_id            = t.id;
UPDATE tenant_connector_installs tci SET connector_id_new         = c.id_text  FROM connectors         c  WHERE tci.connector_id         = c.id;
UPDATE tenant_connector_installs tci SET connector_version_id_new = cv.id_text FROM connector_versions cv WHERE tci.connector_version_id = cv.id AND tci.connector_version_id IS NOT NULL;
UPDATE tenant_connector_installs tci SET installed_by_new         = u.id_text  FROM users              u  WHERE tci.installed_by         = u.id  AND tci.installed_by         IS NOT NULL;

-- credentials
UPDATE credentials cr SET connector_id_new = c.id_text FROM connectors c WHERE cr.connector_id = c.id;

-- dashboards
UPDATE dashboards d SET tenant_id_new = t.id_text FROM tenants t WHERE d.tenant_id = t.id;

-- dashboard_versions
UPDATE dashboard_versions dv SET dashboard_id_new = d.id_text FROM dashboards d WHERE dv.dashboard_id = d.id;
UPDATE dashboard_versions dv SET created_by_new   = u.id_text FROM users      u WHERE dv.created_by   = u.id AND dv.created_by IS NOT NULL;

-- data_sources
UPDATE data_sources ds SET tenant_id_new  = t.id_text FROM tenants t WHERE ds.tenant_id  = t.id;
UPDATE data_sources ds SET created_by_new = u.id_text FROM users   u WHERE ds.created_by = u.id AND ds.created_by IS NOT NULL;

-- template_versions
UPDATE template_versions tv SET template_id_new = t.id_text FROM templates t WHERE tv.template_id = t.id;

-- environment_releases
UPDATE environment_releases er SET environment_id_new = e.id_text FROM environments         e  WHERE er.environment_id = e.id;
-- artifact_id / artifact_version_id are polymorphic — left NULL (no deterministic mapping)
-- rollback_of is self-referential
UPDATE environment_releases er1 SET rollback_of_new = er2.id_text
  FROM environment_releases er2 WHERE er1.rollback_of = er2.id AND er1.rollback_of IS NOT NULL;

-- approval_tasks
UPDATE approval_tasks at SET workflow_id_new  = w.id_text FROM workflows w WHERE at.workflow_id  = w.id;
UPDATE approval_tasks at SET execution_id_new = e.id_text FROM executions e WHERE at.execution_id = e.id AND at.execution_id IS NOT NULL;
UPDATE approval_tasks at SET requester_id_new = u.id_text FROM users u WHERE at.requester_id = u.id AND at.requester_id IS NOT NULL;
UPDATE approval_tasks at SET approver_id_new  = u.id_text FROM users u WHERE at.approver_id  = u.id AND at.approver_id  IS NOT NULL;

-- metering_events
UPDATE metering_events me SET tenant_id_new    = t.id_text FROM tenants    t WHERE me.tenant_id    = t.id;
UPDATE metering_events me SET workflow_id_new  = w.id_text FROM workflows  w WHERE me.workflow_id  = w.id AND me.workflow_id  IS NOT NULL;
UPDATE metering_events me SET execution_id_new = e.id_text FROM executions e WHERE me.execution_id = e.id AND me.execution_id IS NOT NULL;
UPDATE metering_events me SET connector_id_new = c.id_text FROM connectors c WHERE me.connector_id = c.id AND me.connector_id IS NOT NULL;
UPDATE metering_events me SET dashboard_id_new = d.id_text FROM dashboards d WHERE me.dashboard_id = d.id AND me.dashboard_id IS NOT NULL;

-- billing_accounts
UPDATE billing_accounts ba SET tenant_id_new = t.id_text  FROM tenants       t  WHERE ba.tenant_id = t.id;
UPDATE billing_accounts ba SET plan_id_new   = bp.id_text FROM billing_plans bp WHERE ba.plan_id   = bp.id AND ba.plan_id IS NOT NULL;

-- invoices
UPDATE invoices i SET billing_account_id_new = ba.id_text FROM billing_accounts ba WHERE i.billing_account_id = ba.id;

-- invoice_lines
UPDATE invoice_lines il SET tenant_id_new = t.id_text FROM tenants t WHERE il.tenant_id = t.id;

-- usage_rollups
UPDATE usage_rollups ur SET tenant_id_new = t.id_text FROM tenants t WHERE ur.tenant_id = t.id;

-- token_budgets
UPDATE token_budgets tb SET tenant_id_new = t.id_text FROM tenants t WHERE tb.tenant_id = t.id;
-- scope_id is polymorphic — left NULL

-- prompt_versions
UPDATE prompt_versions pv SET prompt_id_new = p.id_text FROM prompts p WHERE pv.prompt_id = p.id;

-- token_usage
UPDATE token_usage tu SET tenant_id_new   = t.id_text FROM tenants   t WHERE tu.tenant_id   = t.id;
UPDATE token_usage tu SET model_id_new    = m.id_text FROM ai_models m WHERE tu.model_id    = m.id AND tu.model_id  IS NOT NULL;
UPDATE token_usage tu SET prompt_id_new   = p.id_text FROM prompts   p WHERE tu.prompt_id   = p.id AND tu.prompt_id IS NOT NULL;
UPDATE token_usage tu SET workflow_id_new = w.id_text FROM workflows  w WHERE tu.workflow_id = w.id AND tu.workflow_id IS NOT NULL;

-- notifications
UPDATE notifications n SET tenant_id_new = t.id_text FROM tenants t WHERE n.tenant_id = t.id;

-- webhook_endpoints
UPDATE webhook_endpoints we SET workflow_id_new = w.id_text FROM workflows w WHERE we.workflow_id = w.id;

-- webhook_deliveries
UPDATE webhook_deliveries wd SET endpoint_id_new = we.id_text FROM webhook_endpoints we WHERE wd.endpoint_id = we.id;

-- schedules
UPDATE schedules s SET tenant_id_new   = t.id_text FROM tenants   t WHERE s.tenant_id   = t.id;
UPDATE schedules s SET workflow_id_new = w.id_text FROM workflows  w WHERE s.workflow_id = w.id;

-- user_mfa
UPDATE user_mfa um SET user_id_new = u.id_text FROM users u WHERE um.user_id = u.id;

-- sso_connections
UPDATE sso_connections sc SET tenant_id_new = t.id_text FROM tenants t WHERE sc.tenant_id = t.id AND sc.tenant_id IS NOT NULL;

-- user_sso_identities
UPDATE user_sso_identities usi SET user_id_new = u.id_text FROM users u WHERE usi.user_id = u.id;

-- user_registrations
UPDATE user_registrations ur SET user_id_new   = u.id_text FROM users   u WHERE ur.user_id   = u.id;
UPDATE user_registrations ur SET tenant_id_new = t.id_text FROM tenants t WHERE ur.tenant_id = t.id;

-- workspace_invitations
UPDATE workspace_invitations wi SET tenant_id_new  = t.id_text FROM tenants t WHERE wi.tenant_id  = t.id;
UPDATE workspace_invitations wi SET invited_by_new = u.id_text FROM users   u WHERE wi.invited_by = u.id;
UPDATE workspace_invitations wi SET role_id_new    = r.id_text FROM roles   r WHERE wi.role_id    = r.id;

-- audit_log
UPDATE audit_log al SET tenant_id_new = t.id_text FROM tenants t WHERE al.tenant_id = t.id;

-- replication_log
UPDATE replication_log rl SET config_id_new = rc.id_text FROM replication_configs rc WHERE rl.config_id = rc.id;

-- revenue_shares
UPDATE revenue_shares rs SET listing_id_new       = ml.id_text FROM marketplace_listings ml WHERE rs.listing_id       = ml.id;
UPDATE revenue_shares rs SET seller_tenant_id_new = t.id_text  FROM tenants              t  WHERE rs.seller_tenant_id = t.id;

-- agent_deployments
UPDATE agent_deployments ad SET listing_id_new  = ml.id_text FROM marketplace_listings ml WHERE ad.listing_id  = ml.id;
UPDATE agent_deployments ad SET tenant_id_new   = t.id_text  FROM tenants              t  WHERE ad.tenant_id   = t.id;
UPDATE agent_deployments ad SET deployed_by_new = u.id_text  FROM users                u  WHERE ad.deployed_by = u.id;

-- email_messages
UPDATE email_messages em SET tenant_id_new = t.id_text FROM tenants t WHERE em.tenant_id = t.id;

-- marketplace_listings
UPDATE marketplace_listings ml SET author_id_new = u.id_text FROM users   u WHERE ml.author_id = u.id AND ml.author_id IS NOT NULL AND ml.author_id != 0;
UPDATE marketplace_listings ml SET tenant_id_new = t.id_text FROM tenants t WHERE ml.tenant_id = t.id AND ml.tenant_id IS NOT NULL;

-- marketplace_installs
UPDATE marketplace_installs mi SET listing_id_new   = ml.id_text FROM marketplace_listings ml WHERE mi.listing_id   = ml.id;
UPDATE marketplace_installs mi SET tenant_id_new    = t.id_text  FROM tenants              t  WHERE mi.tenant_id    = t.id;
UPDATE marketplace_installs mi SET installed_by_new = u.id_text  FROM users                u  WHERE mi.installed_by = u.id AND mi.installed_by IS NOT NULL AND mi.installed_by != 0;

-- marketplace_reviews
UPDATE marketplace_reviews mr SET listing_id_new   = ml.id_text FROM marketplace_listings ml WHERE mr.listing_id   = ml.id;
UPDATE marketplace_reviews mr SET tenant_id_new    = t.id_text  FROM tenants              t  WHERE mr.tenant_id    = t.id;
UPDATE marketplace_reviews mr SET user_id_new      = u.id_text  FROM users                u  WHERE mr.user_id      = u.id;
UPDATE marketplace_reviews mr SET moderated_by_new = u.id_text  FROM users                u  WHERE mr.moderated_by = u.id AND mr.moderated_by IS NOT NULL;

-- analytics
UPDATE analytics_events  ae SET tenant_id_new = t.id_text FROM tenants t WHERE ae.tenant_id = t.id AND ae.tenant_id IS NOT NULL;
UPDATE analytics_events  ae SET user_id_new   = u.id_text FROM users   u WHERE ae.user_id   = u.id AND ae.user_id   IS NOT NULL;
UPDATE analytics_metrics am SET tenant_id_new = t.id_text FROM tenants t WHERE am.tenant_id = t.id AND am.tenant_id IS NOT NULL;
UPDATE workflow_analytics wa SET workflow_id_new = w.id_text FROM workflows w WHERE wa.workflow_id = w.id;
UPDATE workflow_analytics wa SET tenant_id_new   = t.id_text FROM tenants   t WHERE wa.tenant_id   = t.id;
UPDATE ai_analytics       aa SET tenant_id_new   = t.id_text FROM tenants   t WHERE aa.tenant_id   = t.id;

-- tenant tier assignments & placement
UPDATE tenant_tier_assignments tta SET tenant_id_new = t.id_text  FROM tenants      t  WHERE tta.tenant_id = t.id;
UPDATE tenant_tier_assignments tta SET tier_id_new   = tt.id_text FROM tenant_tiers tt WHERE tta.tier_id   = tt.id;
UPDATE tenant_placement        tp  SET tenant_id_new = t.id_text  FROM tenants      t  WHERE tp.tenant_id  = t.id;
UPDATE tenant_placement        tp  SET region_id_new = r.id_text  FROM regions      r  WHERE tp.region_id  = r.id AND tp.region_id IS NOT NULL;
UPDATE tenant_migrations       tm  SET tenant_id_new    = t.id_text  FROM tenants      t  WHERE tm.tenant_id    = t.id;
UPDATE tenant_migrations       tm  SET from_tier_id_new = tt.id_text FROM tenant_tiers tt WHERE tm.from_tier_id = tt.id;
UPDATE tenant_migrations       tm  SET to_tier_id_new   = tt.id_text FROM tenant_tiers tt WHERE tm.to_tier_id   = tt.id;

-- backup / restore
UPDATE backup_records  br  SET tenant_id_new = t.id_text  FROM tenants       t  WHERE br.tenant_id = t.id;
UPDATE restore_records rr  SET backup_id_new = br.id_text FROM backup_records br WHERE rr.backup_id = br.id;
UPDATE restore_records rr  SET tenant_id_new = t.id_text  FROM tenants        t  WHERE rr.tenant_id = t.id;

-- retention / compliance / security / audit
UPDATE retention_config       rc  SET tenant_id_new   = t.id_text FROM tenants t WHERE rc.tenant_id   = t.id;
UPDATE gdpr_requests          gr  SET tenant_id_new   = t.id_text FROM tenants t WHERE gr.tenant_id   = t.id;
UPDATE gdpr_requests          gr  SET user_id_new     = u.id_text FROM users   u WHERE gr.user_id     = u.id;
UPDATE compliance_evidence    ce  SET tenant_id_new   = t.id_text FROM tenants t WHERE ce.tenant_id   = t.id;
UPDATE security_incidents     si  SET tenant_id_new   = t.id_text FROM tenants t WHERE si.tenant_id   = t.id;
UPDATE security_incidents     si  SET resolved_by_new = u.id_text FROM users   u WHERE si.resolved_by = u.id AND si.resolved_by IS NOT NULL;
UPDATE security_incident_evidence sie SET incident_id_new = si.id_text FROM security_incidents si WHERE sie.incident_id = si.id;
UPDATE audit_exports          ae  SET tenant_id_new   = t.id_text FROM tenants t WHERE ae.tenant_id   = t.id;
UPDATE audit_exports          ae  SET created_by_new  = u.id_text FROM users   u WHERE ae.created_by  = u.id AND ae.created_by IS NOT NULL;
UPDATE overage_events         oe  SET tenant_id_new   = t.id_text FROM tenants t WHERE oe.tenant_id   = t.id;
UPDATE enterprise_commitments ec  SET tenant_id_new   = t.id_text FROM tenants t WHERE ec.tenant_id   = t.id;

-- AI
UPDATE ai_routing_policies    arp SET tenant_id_new = t.id_text FROM tenants t WHERE arp.tenant_id = t.id;
UPDATE ai_playground_sessions aps SET tenant_id_new = t.id_text FROM tenants t WHERE aps.tenant_id = t.id;
UPDATE agent_memory           am  SET tenant_id_new    = t.id_text FROM tenants   t WHERE am.tenant_id    = t.id;
UPDATE agent_memory           am  SET workflow_id_new  = w.id_text FROM workflows  w WHERE am.workflow_id  = w.id AND am.workflow_id  IS NOT NULL;
UPDATE agent_memory           am  SET execution_id_new = e.id_text FROM executions e WHERE am.execution_id = e.id AND am.execution_id IS NOT NULL;
UPDATE prompt_approvals       pa  SET prompt_id_new    = p.id_text FROM prompts    p WHERE pa.prompt_id    = p.id;
UPDATE ai_evaluation_datasets aed SET tenant_id_new    = t.id_text FROM tenants    t WHERE aed.tenant_id   = t.id;
UPDATE ai_evaluation_dataset_entries aede SET dataset_id_new = aed.id_text FROM ai_evaluation_datasets aed WHERE aede.dataset_id = aed.id;
UPDATE ai_evaluation_runs     aer SET tenant_id_new  = t.id_text   FROM tenants               t   WHERE aer.tenant_id  = t.id;
UPDATE ai_evaluation_runs     aer SET dataset_id_new = aed.id_text FROM ai_evaluation_datasets aed WHERE aer.dataset_id = aed.id;
UPDATE ai_evaluation_runs     aer SET prompt_id_new  = p.id_text   FROM prompts                p   WHERE aer.prompt_id  = p.id;
UPDATE ai_evaluation_run_results aerr SET run_id_new   = aer.id_text  FROM ai_evaluation_runs            aer  WHERE aerr.run_id   = aer.id;
UPDATE ai_evaluation_run_results aerr SET entry_id_new = aede.id_text FROM ai_evaluation_dataset_entries aede WHERE aerr.entry_id = aede.id;
UPDATE ai_guardrails          ag  SET tenant_id_new    = t.id_text  FROM tenants      t  WHERE ag.tenant_id    = t.id;
UPDATE ai_guardrail_hits      agh SET guardrail_id_new = ag.id_text FROM ai_guardrails ag WHERE agh.guardrail_id = ag.id;
UPDATE ai_provider_routes     apr SET tenant_id_new    = t.id_text  FROM tenants       t  WHERE apr.tenant_id   = t.id;

-- RAG
UPDATE rag_knowledge_bases rkb SET tenant_id_new        = t.id_text   FROM tenants            t   WHERE rkb.tenant_id         = t.id;
UPDATE rag_documents       rd  SET knowledge_base_id_new = rkb.id_text FROM rag_knowledge_bases rkb WHERE rd.knowledge_base_id  = rkb.id;
UPDATE rag_chunks          rc  SET document_id_new       = rd.id_text  FROM rag_documents       rd  WHERE rc.document_id        = rd.id;
UPDATE rag_chunks          rc  SET knowledge_base_id_new = rkb.id_text FROM rag_knowledge_bases rkb WHERE rc.knowledge_base_id  = rkb.id;

-- role_permissions (composite PK table)
UPDATE role_permissions rp SET role_id_new       = r.id_text FROM roles       r WHERE rp.role_id       = r.id;
UPDATE role_permissions rp SET permission_id_new = p.id_text FROM permissions p WHERE rp.permission_id = p.id;

-- ---------------------------------------------------------------------------
-- 5. Drop ALL FK constraints dynamically
--    (avoids hardcoding Drizzle-generated names like "users_tenant_id_tenants_id_fk")
-- ---------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Swap PKs — parent tables first, then children
--    Pattern: NOT NULL id_text → DROP old PK → RENAME id→id_int →
--             RENAME id_text→id → ADD PK → DROP id_int
-- ---------------------------------------------------------------------------

-- ── Level 0: no FK parents ─────────────────────────────────────────────────

ALTER TABLE tenants ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE tenants DROP CONSTRAINT tenants_pkey;
ALTER TABLE tenants RENAME COLUMN id TO id_int;
ALTER TABLE tenants RENAME COLUMN id_text TO id;
ALTER TABLE tenants ADD PRIMARY KEY (id);
ALTER TABLE tenants DROP COLUMN id_int;

ALTER TABLE ai_models ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE ai_models DROP CONSTRAINT ai_models_pkey;
ALTER TABLE ai_models RENAME COLUMN id TO id_int;
ALTER TABLE ai_models RENAME COLUMN id_text TO id;
ALTER TABLE ai_models ADD PRIMARY KEY (id);
ALTER TABLE ai_models DROP COLUMN id_int;

ALTER TABLE billing_plans ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE billing_plans DROP CONSTRAINT billing_plans_pkey;
ALTER TABLE billing_plans RENAME COLUMN id TO id_int;
ALTER TABLE billing_plans RENAME COLUMN id_text TO id;
ALTER TABLE billing_plans ADD PRIMARY KEY (id);
ALTER TABLE billing_plans DROP COLUMN id_int;

ALTER TABLE connectors ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE connectors DROP CONSTRAINT connectors_pkey;
ALTER TABLE connectors RENAME COLUMN id TO id_int;
ALTER TABLE connectors RENAME COLUMN id_text TO id;
ALTER TABLE connectors ADD PRIMARY KEY (id);
ALTER TABLE connectors DROP COLUMN id_int;

ALTER TABLE prompts ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE prompts DROP CONSTRAINT prompts_pkey;
ALTER TABLE prompts RENAME COLUMN id TO id_int;
ALTER TABLE prompts RENAME COLUMN id_text TO id;
ALTER TABLE prompts ADD PRIMARY KEY (id);
ALTER TABLE prompts DROP COLUMN id_int;

ALTER TABLE regions ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE regions DROP CONSTRAINT regions_pkey;
ALTER TABLE regions RENAME COLUMN id TO id_int;
ALTER TABLE regions RENAME COLUMN id_text TO id;
ALTER TABLE regions ADD PRIMARY KEY (id);
ALTER TABLE regions DROP COLUMN id_int;

ALTER TABLE rbac_permissions ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE rbac_permissions DROP CONSTRAINT rbac_permissions_pkey;
ALTER TABLE rbac_permissions RENAME COLUMN id TO id_int;
ALTER TABLE rbac_permissions RENAME COLUMN id_text TO id;
ALTER TABLE rbac_permissions ADD PRIMARY KEY (id);
ALTER TABLE rbac_permissions DROP COLUMN id_int;

ALTER TABLE roles ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE roles DROP CONSTRAINT roles_pkey;
ALTER TABLE roles RENAME COLUMN id TO id_int;
ALTER TABLE roles RENAME COLUMN id_text TO id;
ALTER TABLE roles ADD PRIMARY KEY (id);
ALTER TABLE roles DROP COLUMN id_int;

ALTER TABLE permissions ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE permissions DROP CONSTRAINT permissions_pkey;
ALTER TABLE permissions RENAME COLUMN id TO id_int;
ALTER TABLE permissions RENAME COLUMN id_text TO id;
ALTER TABLE permissions ADD PRIMARY KEY (id);
ALTER TABLE permissions DROP COLUMN id_int;

ALTER TABLE templates ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE templates DROP CONSTRAINT templates_pkey;
ALTER TABLE templates RENAME COLUMN id TO id_int;
ALTER TABLE templates RENAME COLUMN id_text TO id;
ALTER TABLE templates ADD PRIMARY KEY (id);
ALTER TABLE templates DROP COLUMN id_int;

ALTER TABLE environments ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE environments DROP CONSTRAINT environments_pkey;
ALTER TABLE environments RENAME COLUMN id TO id_int;
ALTER TABLE environments RENAME COLUMN id_text TO id;
ALTER TABLE environments ADD PRIMARY KEY (id);
ALTER TABLE environments DROP COLUMN id_int;

ALTER TABLE marketplace_listings ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE marketplace_listings DROP CONSTRAINT marketplace_listings_pkey;
ALTER TABLE marketplace_listings RENAME COLUMN id TO id_int;
ALTER TABLE marketplace_listings RENAME COLUMN id_text TO id;
ALTER TABLE marketplace_listings ADD PRIMARY KEY (id);
ALTER TABLE marketplace_listings DROP COLUMN id_int;

ALTER TABLE apps ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE apps DROP CONSTRAINT apps_pkey;
ALTER TABLE apps RENAME COLUMN id TO id_int;
ALTER TABLE apps RENAME COLUMN id_text TO id;
ALTER TABLE apps ADD PRIMARY KEY (id);
ALTER TABLE apps DROP COLUMN id_int;

ALTER TABLE feature_flags ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE feature_flags DROP CONSTRAINT feature_flags_pkey;
ALTER TABLE feature_flags RENAME COLUMN id TO id_int;
ALTER TABLE feature_flags RENAME COLUMN id_text TO id;
ALTER TABLE feature_flags ADD PRIMARY KEY (id);
ALTER TABLE feature_flags DROP COLUMN id_int;

ALTER TABLE notification_templates ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE notification_templates DROP CONSTRAINT notification_templates_pkey;
ALTER TABLE notification_templates RENAME COLUMN id TO id_int;
ALTER TABLE notification_templates RENAME COLUMN id_text TO id;
ALTER TABLE notification_templates ADD PRIMARY KEY (id);
ALTER TABLE notification_templates DROP COLUMN id_int;

ALTER TABLE region_policies ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE region_policies DROP CONSTRAINT region_policies_pkey;
ALTER TABLE region_policies RENAME COLUMN id TO id_int;
ALTER TABLE region_policies RENAME COLUMN id_text TO id;
ALTER TABLE region_policies ADD PRIMARY KEY (id);
ALTER TABLE region_policies DROP COLUMN id_int;

ALTER TABLE regional_pools ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE regional_pools DROP CONSTRAINT regional_pools_pkey;
ALTER TABLE regional_pools RENAME COLUMN id TO id_int;
ALTER TABLE regional_pools RENAME COLUMN id_text TO id;
ALTER TABLE regional_pools ADD PRIMARY KEY (id);
ALTER TABLE regional_pools DROP COLUMN id_int;

ALTER TABLE release_snapshots ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE release_snapshots DROP CONSTRAINT release_snapshots_pkey;
ALTER TABLE release_snapshots RENAME COLUMN id TO id_int;
ALTER TABLE release_snapshots RENAME COLUMN id_text TO id;
ALTER TABLE release_snapshots ADD PRIMARY KEY (id);
ALTER TABLE release_snapshots DROP COLUMN id_int;

ALTER TABLE archive_exports ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE archive_exports DROP CONSTRAINT archive_exports_pkey;
ALTER TABLE archive_exports RENAME COLUMN id TO id_int;
ALTER TABLE archive_exports RENAME COLUMN id_text TO id;
ALTER TABLE archive_exports ADD PRIMARY KEY (id);
ALTER TABLE archive_exports DROP COLUMN id_int;

ALTER TABLE platform_events ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE platform_events DROP CONSTRAINT platform_events_pkey;
ALTER TABLE platform_events RENAME COLUMN id TO id_int;
ALTER TABLE platform_events RENAME COLUMN id_text TO id;
ALTER TABLE platform_events ADD PRIMARY KEY (id);
ALTER TABLE platform_events DROP COLUMN id_int;

ALTER TABLE replication_configs ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE replication_configs DROP CONSTRAINT replication_configs_pkey;
ALTER TABLE replication_configs RENAME COLUMN id TO id_int;
ALTER TABLE replication_configs RENAME COLUMN id_text TO id;
ALTER TABLE replication_configs ADD PRIMARY KEY (id);
ALTER TABLE replication_configs DROP COLUMN id_int;

ALTER TABLE dr_policies ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE dr_policies DROP CONSTRAINT dr_policies_pkey;
ALTER TABLE dr_policies RENAME COLUMN id TO id_int;
ALTER TABLE dr_policies RENAME COLUMN id_text TO id;
ALTER TABLE dr_policies ADD PRIMARY KEY (id);
ALTER TABLE dr_policies DROP COLUMN id_int;

ALTER TABLE sso_connections ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE sso_connections DROP CONSTRAINT sso_connections_pkey;
ALTER TABLE sso_connections RENAME COLUMN id TO id_int;
ALTER TABLE sso_connections RENAME COLUMN id_text TO id;
ALTER TABLE sso_connections ADD PRIMARY KEY (id);
ALTER TABLE sso_connections DROP COLUMN id_int;

ALTER TABLE tenant_tiers ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE tenant_tiers DROP CONSTRAINT tenant_tiers_pkey;
ALTER TABLE tenant_tiers RENAME COLUMN id TO id_int;
ALTER TABLE tenant_tiers RENAME COLUMN id_text TO id;
ALTER TABLE tenant_tiers ADD PRIMARY KEY (id);
ALTER TABLE tenant_tiers DROP COLUMN id_int;

ALTER TABLE replication_log ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE replication_log DROP CONSTRAINT replication_log_pkey;
ALTER TABLE replication_log RENAME COLUMN id TO id_int;
ALTER TABLE replication_log RENAME COLUMN id_text TO id;
ALTER TABLE replication_log ADD PRIMARY KEY (id);
ALTER TABLE replication_log DROP COLUMN id_int;

ALTER TABLE revenue_shares ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE revenue_shares DROP CONSTRAINT revenue_shares_pkey;
ALTER TABLE revenue_shares RENAME COLUMN id TO id_int;
ALTER TABLE revenue_shares RENAME COLUMN id_text TO id;
ALTER TABLE revenue_shares ADD PRIMARY KEY (id);
ALTER TABLE revenue_shares DROP COLUMN id_int;

ALTER TABLE agent_deployments ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE agent_deployments DROP CONSTRAINT agent_deployments_pkey;
ALTER TABLE agent_deployments RENAME COLUMN id TO id_int;
ALTER TABLE agent_deployments RENAME COLUMN id_text TO id;
ALTER TABLE agent_deployments ADD PRIMARY KEY (id);
ALTER TABLE agent_deployments DROP COLUMN id_int;

-- No-FK tables (process at any level)
ALTER TABLE usage_events              ALTER COLUMN id_text SET NOT NULL; ALTER TABLE usage_events              DROP CONSTRAINT usage_events_pkey;              ALTER TABLE usage_events              RENAME COLUMN id TO id_int; ALTER TABLE usage_events              RENAME COLUMN id_text TO id; ALTER TABLE usage_events              ADD PRIMARY KEY (id); ALTER TABLE usage_events              DROP COLUMN id_int;
ALTER TABLE workflow_promotions       ALTER COLUMN id_text SET NOT NULL; ALTER TABLE workflow_promotions       DROP CONSTRAINT workflow_promotions_pkey;       ALTER TABLE workflow_promotions       RENAME COLUMN id TO id_int; ALTER TABLE workflow_promotions       RENAME COLUMN id_text TO id; ALTER TABLE workflow_promotions       ADD PRIMARY KEY (id); ALTER TABLE workflow_promotions       DROP COLUMN id_int;
ALTER TABLE connector_executions      ALTER COLUMN id_text SET NOT NULL; ALTER TABLE connector_executions      DROP CONSTRAINT connector_executions_pkey;      ALTER TABLE connector_executions      RENAME COLUMN id TO id_int; ALTER TABLE connector_executions      RENAME COLUMN id_text TO id; ALTER TABLE connector_executions      ADD PRIMARY KEY (id); ALTER TABLE connector_executions      DROP COLUMN id_int;
ALTER TABLE connector_polling_states  ALTER COLUMN id_text SET NOT NULL; ALTER TABLE connector_polling_states  DROP CONSTRAINT connector_polling_states_pkey;  ALTER TABLE connector_polling_states  RENAME COLUMN id TO id_int; ALTER TABLE connector_polling_states  RENAME COLUMN id_text TO id; ALTER TABLE connector_polling_states  ADD PRIMARY KEY (id); ALTER TABLE connector_polling_states  DROP COLUMN id_int;
ALTER TABLE credentials               ALTER COLUMN id_text SET NOT NULL; ALTER TABLE credentials               DROP CONSTRAINT credentials_pkey;               ALTER TABLE credentials               RENAME COLUMN id TO id_int; ALTER TABLE credentials               RENAME COLUMN id_text TO id; ALTER TABLE credentials               ADD PRIMARY KEY (id); ALTER TABLE credentials               DROP COLUMN id_int;
ALTER TABLE analytics_events          ALTER COLUMN id_text SET NOT NULL; ALTER TABLE analytics_events          DROP CONSTRAINT analytics_events_pkey;          ALTER TABLE analytics_events          RENAME COLUMN id TO id_int; ALTER TABLE analytics_events          RENAME COLUMN id_text TO id; ALTER TABLE analytics_events          ADD PRIMARY KEY (id); ALTER TABLE analytics_events          DROP COLUMN id_int;
ALTER TABLE analytics_metrics         ALTER COLUMN id_text SET NOT NULL; ALTER TABLE analytics_metrics         DROP CONSTRAINT analytics_metrics_pkey;         ALTER TABLE analytics_metrics         RENAME COLUMN id TO id_int; ALTER TABLE analytics_metrics         RENAME COLUMN id_text TO id; ALTER TABLE analytics_metrics         ADD PRIMARY KEY (id); ALTER TABLE analytics_metrics         DROP COLUMN id_int;
ALTER TABLE reporting_snapshots       ALTER COLUMN id_text SET NOT NULL; ALTER TABLE reporting_snapshots       DROP CONSTRAINT reporting_snapshots_pkey;       ALTER TABLE reporting_snapshots       RENAME COLUMN id TO id_int; ALTER TABLE reporting_snapshots       RENAME COLUMN id_text TO id; ALTER TABLE reporting_snapshots       ADD PRIMARY KEY (id); ALTER TABLE reporting_snapshots       DROP COLUMN id_int;
ALTER TABLE reporting_exports         ALTER COLUMN id_text SET NOT NULL; ALTER TABLE reporting_exports         DROP CONSTRAINT reporting_exports_pkey;         ALTER TABLE reporting_exports         RENAME COLUMN id TO id_int; ALTER TABLE reporting_exports         RENAME COLUMN id_text TO id; ALTER TABLE reporting_exports         ADD PRIMARY KEY (id); ALTER TABLE reporting_exports         DROP COLUMN id_int;
ALTER TABLE reporting_kpis            ALTER COLUMN id_text SET NOT NULL; ALTER TABLE reporting_kpis            DROP CONSTRAINT reporting_kpis_pkey;            ALTER TABLE reporting_kpis            RENAME COLUMN id TO id_int; ALTER TABLE reporting_kpis            RENAME COLUMN id_text TO id; ALTER TABLE reporting_kpis            ADD PRIMARY KEY (id); ALTER TABLE reporting_kpis            DROP COLUMN id_int;
ALTER TABLE search_index              ALTER COLUMN id_text SET NOT NULL; ALTER TABLE search_index              DROP CONSTRAINT search_index_pkey;              ALTER TABLE search_index              RENAME COLUMN id TO id_int; ALTER TABLE search_index              RENAME COLUMN id_text TO id; ALTER TABLE search_index              ADD PRIMARY KEY (id); ALTER TABLE search_index              DROP COLUMN id_int;
ALTER TABLE search_suggestions        ALTER COLUMN id_text SET NOT NULL; ALTER TABLE search_suggestions        DROP CONSTRAINT search_suggestions_pkey;        ALTER TABLE search_suggestions        RENAME COLUMN id TO id_int; ALTER TABLE search_suggestions        RENAME COLUMN id_text TO id; ALTER TABLE search_suggestions        ADD PRIMARY KEY (id); ALTER TABLE search_suggestions        DROP COLUMN id_int;
ALTER TABLE dlq_entries               ALTER COLUMN id_text SET NOT NULL; ALTER TABLE dlq_entries               DROP CONSTRAINT dlq_entries_pkey;               ALTER TABLE dlq_entries               RENAME COLUMN id TO id_int; ALTER TABLE dlq_entries               RENAME COLUMN id_text TO id; ALTER TABLE dlq_entries               ADD PRIMARY KEY (id); ALTER TABLE dlq_entries               DROP COLUMN id_int;
ALTER TABLE webhook_deliveries        ALTER COLUMN id_text SET NOT NULL; ALTER TABLE webhook_deliveries        DROP CONSTRAINT webhook_deliveries_pkey;        ALTER TABLE webhook_deliveries        RENAME COLUMN id TO id_int; ALTER TABLE webhook_deliveries        RENAME COLUMN id_text TO id; ALTER TABLE webhook_deliveries        ADD PRIMARY KEY (id); ALTER TABLE webhook_deliveries        DROP COLUMN id_int;
ALTER TABLE tenant_tier_assignments   ALTER COLUMN id_text SET NOT NULL; ALTER TABLE tenant_tier_assignments   DROP CONSTRAINT tenant_tier_assignments_pkey;   ALTER TABLE tenant_tier_assignments   RENAME COLUMN id TO id_int; ALTER TABLE tenant_tier_assignments   RENAME COLUMN id_text TO id; ALTER TABLE tenant_tier_assignments   ADD PRIMARY KEY (id); ALTER TABLE tenant_tier_assignments   DROP COLUMN id_int;

-- ── Level 1: FK → Level 0 ──────────────────────────────────────────────────

ALTER TABLE tenant_settings ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE tenant_settings DROP CONSTRAINT tenant_settings_pkey;
ALTER TABLE tenant_settings RENAME COLUMN id TO id_int;
ALTER TABLE tenant_settings RENAME COLUMN id_text TO id;
ALTER TABLE tenant_settings ADD PRIMARY KEY (id);
ALTER TABLE tenant_settings DROP COLUMN id_int;

ALTER TABLE users ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users RENAME COLUMN id TO id_int;
ALTER TABLE users RENAME COLUMN id_text TO id;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users DROP COLUMN id_int;

ALTER TABLE workflows ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE workflows DROP CONSTRAINT workflows_pkey;
ALTER TABLE workflows RENAME COLUMN id TO id_int;
ALTER TABLE workflows RENAME COLUMN id_text TO id;
ALTER TABLE workflows ADD PRIMARY KEY (id);
ALTER TABLE workflows DROP COLUMN id_int;

ALTER TABLE billing_accounts ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE billing_accounts DROP CONSTRAINT billing_accounts_pkey;
ALTER TABLE billing_accounts RENAME COLUMN id TO id_int;
ALTER TABLE billing_accounts RENAME COLUMN id_text TO id;
ALTER TABLE billing_accounts ADD PRIMARY KEY (id);
ALTER TABLE billing_accounts DROP COLUMN id_int;

ALTER TABLE dashboards ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE dashboards DROP CONSTRAINT dashboards_pkey;
ALTER TABLE dashboards RENAME COLUMN id TO id_int;
ALTER TABLE dashboards RENAME COLUMN id_text TO id;
ALTER TABLE dashboards ADD PRIMARY KEY (id);
ALTER TABLE dashboards DROP COLUMN id_int;

ALTER TABLE rag_knowledge_bases ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE rag_knowledge_bases DROP CONSTRAINT rag_knowledge_bases_pkey;
ALTER TABLE rag_knowledge_bases RENAME COLUMN id TO id_int;
ALTER TABLE rag_knowledge_bases RENAME COLUMN id_text TO id;
ALTER TABLE rag_knowledge_bases ADD PRIMARY KEY (id);
ALTER TABLE rag_knowledge_bases DROP COLUMN id_int;

ALTER TABLE ai_evaluation_datasets ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE ai_evaluation_datasets DROP CONSTRAINT ai_evaluation_datasets_pkey;
ALTER TABLE ai_evaluation_datasets RENAME COLUMN id TO id_int;
ALTER TABLE ai_evaluation_datasets RENAME COLUMN id_text TO id;
ALTER TABLE ai_evaluation_datasets ADD PRIMARY KEY (id);
ALTER TABLE ai_evaluation_datasets DROP COLUMN id_int;

ALTER TABLE ai_guardrails ALTER COLUMN id_text SET NOT NULL;
ALTER TABLE ai_guardrails DROP CONSTRAINT ai_guardrails_pkey;
ALTER TABLE ai_guardrails RENAME COLUMN id TO id_int;
ALTER TABLE ai_guardrails RENAME COLUMN id_text TO id;
ALTER TABLE ai_guardrails ADD PRIMARY KEY (id);
ALTER TABLE ai_guardrails DROP COLUMN id_int;

ALTER TABLE notifications ALTER COLUMN id_text SET NOT NULL; ALTER TABLE notifications DROP CONSTRAINT notifications_pkey; ALTER TABLE notifications RENAME COLUMN id TO id_int; ALTER TABLE notifications RENAME COLUMN id_text TO id; ALTER TABLE notifications ADD PRIMARY KEY (id); ALTER TABLE notifications DROP COLUMN id_int;
ALTER TABLE token_budgets ALTER COLUMN id_text SET NOT NULL; ALTER TABLE token_budgets DROP CONSTRAINT token_budgets_pkey; ALTER TABLE token_budgets RENAME COLUMN id TO id_int; ALTER TABLE token_budgets RENAME COLUMN id_text TO id; ALTER TABLE token_budgets ADD PRIMARY KEY (id); ALTER TABLE token_budgets DROP COLUMN id_int;
ALTER TABLE metering_events ALTER COLUMN id_text SET NOT NULL; ALTER TABLE metering_events DROP CONSTRAINT metering_events_pkey; ALTER TABLE metering_events RENAME COLUMN id TO id_int; ALTER TABLE metering_events RENAME COLUMN id_text TO id; ALTER TABLE metering_events ADD PRIMARY KEY (id); ALTER TABLE metering_events DROP COLUMN id_int;
ALTER TABLE usage_rollups ALTER COLUMN id_text SET NOT NULL; ALTER TABLE usage_rollups DROP CONSTRAINT usage_rollups_pkey; ALTER TABLE usage_rollups RENAME COLUMN id TO id_int; ALTER TABLE usage_rollups RENAME COLUMN id_text TO id; ALTER TABLE usage_rollups ADD PRIMARY KEY (id); ALTER TABLE usage_rollups DROP COLUMN id_int;
ALTER TABLE audit_log ALTER COLUMN id_text SET NOT NULL; ALTER TABLE audit_log DROP CONSTRAINT audit_log_pkey; ALTER TABLE audit_log RENAME COLUMN id TO id_int; ALTER TABLE audit_log RENAME COLUMN id_text TO id; ALTER TABLE audit_log ADD PRIMARY KEY (id); ALTER TABLE audit_log DROP COLUMN id_int;
ALTER TABLE audit_exports ALTER COLUMN id_text SET NOT NULL; ALTER TABLE audit_exports DROP CONSTRAINT audit_exports_pkey; ALTER TABLE audit_exports RENAME COLUMN id TO id_int; ALTER TABLE audit_exports RENAME COLUMN id_text TO id; ALTER TABLE audit_exports ADD PRIMARY KEY (id); ALTER TABLE audit_exports DROP COLUMN id_int;
ALTER TABLE ai_routing_policies ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_routing_policies DROP CONSTRAINT ai_routing_policies_pkey; ALTER TABLE ai_routing_policies RENAME COLUMN id TO id_int; ALTER TABLE ai_routing_policies RENAME COLUMN id_text TO id; ALTER TABLE ai_routing_policies ADD PRIMARY KEY (id); ALTER TABLE ai_routing_policies DROP COLUMN id_int;
ALTER TABLE ai_playground_sessions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_playground_sessions DROP CONSTRAINT ai_playground_sessions_pkey; ALTER TABLE ai_playground_sessions RENAME COLUMN id TO id_int; ALTER TABLE ai_playground_sessions RENAME COLUMN id_text TO id; ALTER TABLE ai_playground_sessions ADD PRIMARY KEY (id); ALTER TABLE ai_playground_sessions DROP COLUMN id_int;
ALTER TABLE agent_memory ALTER COLUMN id_text SET NOT NULL; ALTER TABLE agent_memory DROP CONSTRAINT agent_memory_pkey; ALTER TABLE agent_memory RENAME COLUMN id TO id_int; ALTER TABLE agent_memory RENAME COLUMN id_text TO id; ALTER TABLE agent_memory ADD PRIMARY KEY (id); ALTER TABLE agent_memory DROP COLUMN id_int;
ALTER TABLE overage_events ALTER COLUMN id_text SET NOT NULL; ALTER TABLE overage_events DROP CONSTRAINT overage_events_pkey; ALTER TABLE overage_events RENAME COLUMN id TO id_int; ALTER TABLE overage_events RENAME COLUMN id_text TO id; ALTER TABLE overage_events ADD PRIMARY KEY (id); ALTER TABLE overage_events DROP COLUMN id_int;
ALTER TABLE enterprise_commitments ALTER COLUMN id_text SET NOT NULL; ALTER TABLE enterprise_commitments DROP CONSTRAINT enterprise_commitments_pkey; ALTER TABLE enterprise_commitments RENAME COLUMN id TO id_int; ALTER TABLE enterprise_commitments RENAME COLUMN id_text TO id; ALTER TABLE enterprise_commitments ADD PRIMARY KEY (id); ALTER TABLE enterprise_commitments DROP COLUMN id_int;
ALTER TABLE ai_provider_routes ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_provider_routes DROP CONSTRAINT ai_provider_routes_pkey; ALTER TABLE ai_provider_routes RENAME COLUMN id TO id_int; ALTER TABLE ai_provider_routes RENAME COLUMN id_text TO id; ALTER TABLE ai_provider_routes ADD PRIMARY KEY (id); ALTER TABLE ai_provider_routes DROP COLUMN id_int;
ALTER TABLE compliance_evidence ALTER COLUMN id_text SET NOT NULL; ALTER TABLE compliance_evidence DROP CONSTRAINT compliance_evidence_pkey; ALTER TABLE compliance_evidence RENAME COLUMN id TO id_int; ALTER TABLE compliance_evidence RENAME COLUMN id_text TO id; ALTER TABLE compliance_evidence ADD PRIMARY KEY (id); ALTER TABLE compliance_evidence DROP COLUMN id_int;
ALTER TABLE data_sources ALTER COLUMN id_text SET NOT NULL; ALTER TABLE data_sources DROP CONSTRAINT data_sources_pkey; ALTER TABLE data_sources RENAME COLUMN id TO id_int; ALTER TABLE data_sources RENAME COLUMN id_text TO id; ALTER TABLE data_sources ADD PRIMARY KEY (id); ALTER TABLE data_sources DROP COLUMN id_int;
ALTER TABLE email_messages ALTER COLUMN id_text SET NOT NULL; ALTER TABLE email_messages DROP CONSTRAINT email_messages_pkey; ALTER TABLE email_messages RENAME COLUMN id TO id_int; ALTER TABLE email_messages RENAME COLUMN id_text TO id; ALTER TABLE email_messages ADD PRIMARY KEY (id); ALTER TABLE email_messages DROP COLUMN id_int;
ALTER TABLE token_usage ALTER COLUMN id_text SET NOT NULL; ALTER TABLE token_usage DROP CONSTRAINT token_usage_pkey; ALTER TABLE token_usage RENAME COLUMN id TO id_int; ALTER TABLE token_usage RENAME COLUMN id_text TO id; ALTER TABLE token_usage ADD PRIMARY KEY (id); ALTER TABLE token_usage DROP COLUMN id_int;
ALTER TABLE tenant_placement ALTER COLUMN id_text SET NOT NULL; ALTER TABLE tenant_placement DROP CONSTRAINT tenant_placement_pkey; ALTER TABLE tenant_placement RENAME COLUMN id TO id_int; ALTER TABLE tenant_placement RENAME COLUMN id_text TO id; ALTER TABLE tenant_placement ADD PRIMARY KEY (id); ALTER TABLE tenant_placement DROP COLUMN id_int;
ALTER TABLE tenant_migrations ALTER COLUMN id_text SET NOT NULL; ALTER TABLE tenant_migrations DROP CONSTRAINT tenant_migrations_pkey; ALTER TABLE tenant_migrations RENAME COLUMN id TO id_int; ALTER TABLE tenant_migrations RENAME COLUMN id_text TO id; ALTER TABLE tenant_migrations ADD PRIMARY KEY (id); ALTER TABLE tenant_migrations DROP COLUMN id_int;
ALTER TABLE backup_records ALTER COLUMN id_text SET NOT NULL; ALTER TABLE backup_records DROP CONSTRAINT backup_records_pkey; ALTER TABLE backup_records RENAME COLUMN id TO id_int; ALTER TABLE backup_records RENAME COLUMN id_text TO id; ALTER TABLE backup_records ADD PRIMARY KEY (id); ALTER TABLE backup_records DROP COLUMN id_int;
ALTER TABLE retention_config ALTER COLUMN id_text SET NOT NULL; ALTER TABLE retention_config DROP CONSTRAINT retention_config_pkey; ALTER TABLE retention_config RENAME COLUMN id TO id_int; ALTER TABLE retention_config RENAME COLUMN id_text TO id; ALTER TABLE retention_config ADD PRIMARY KEY (id); ALTER TABLE retention_config DROP COLUMN id_int;
ALTER TABLE security_incidents ALTER COLUMN id_text SET NOT NULL; ALTER TABLE security_incidents DROP CONSTRAINT security_incidents_pkey; ALTER TABLE security_incidents RENAME COLUMN id TO id_int; ALTER TABLE security_incidents RENAME COLUMN id_text TO id; ALTER TABLE security_incidents ADD PRIMARY KEY (id); ALTER TABLE security_incidents DROP COLUMN id_int;
ALTER TABLE connector_actions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE connector_actions DROP CONSTRAINT connector_actions_pkey; ALTER TABLE connector_actions RENAME COLUMN id TO id_int; ALTER TABLE connector_actions RENAME COLUMN id_text TO id; ALTER TABLE connector_actions ADD PRIMARY KEY (id); ALTER TABLE connector_actions DROP COLUMN id_int;
ALTER TABLE connector_triggers ALTER COLUMN id_text SET NOT NULL; ALTER TABLE connector_triggers DROP CONSTRAINT connector_triggers_pkey; ALTER TABLE connector_triggers RENAME COLUMN id TO id_int; ALTER TABLE connector_triggers RENAME COLUMN id_text TO id; ALTER TABLE connector_triggers ADD PRIMARY KEY (id); ALTER TABLE connector_triggers DROP COLUMN id_int;
ALTER TABLE connector_versions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE connector_versions DROP CONSTRAINT connector_versions_pkey; ALTER TABLE connector_versions RENAME COLUMN id TO id_int; ALTER TABLE connector_versions RENAME COLUMN id_text TO id; ALTER TABLE connector_versions ADD PRIMARY KEY (id); ALTER TABLE connector_versions DROP COLUMN id_int;
ALTER TABLE prompt_approvals ALTER COLUMN id_text SET NOT NULL; ALTER TABLE prompt_approvals DROP CONSTRAINT prompt_approvals_pkey; ALTER TABLE prompt_approvals RENAME COLUMN id TO id_int; ALTER TABLE prompt_approvals RENAME COLUMN id_text TO id; ALTER TABLE prompt_approvals ADD PRIMARY KEY (id); ALTER TABLE prompt_approvals DROP COLUMN id_int;
ALTER TABLE environment_releases ALTER COLUMN id_text SET NOT NULL; ALTER TABLE environment_releases DROP CONSTRAINT environment_releases_pkey; ALTER TABLE environment_releases RENAME COLUMN id TO id_int; ALTER TABLE environment_releases RENAME COLUMN id_text TO id; ALTER TABLE environment_releases ADD PRIMARY KEY (id); ALTER TABLE environment_releases DROP COLUMN id_int;
ALTER TABLE marketplace_installs ALTER COLUMN id_text SET NOT NULL; ALTER TABLE marketplace_installs DROP CONSTRAINT marketplace_installs_pkey; ALTER TABLE marketplace_installs RENAME COLUMN id TO id_int; ALTER TABLE marketplace_installs RENAME COLUMN id_text TO id; ALTER TABLE marketplace_installs ADD PRIMARY KEY (id); ALTER TABLE marketplace_installs DROP COLUMN id_int;
ALTER TABLE marketplace_reviews ALTER COLUMN id_text SET NOT NULL; ALTER TABLE marketplace_reviews DROP CONSTRAINT marketplace_reviews_pkey; ALTER TABLE marketplace_reviews RENAME COLUMN id TO id_int; ALTER TABLE marketplace_reviews RENAME COLUMN id_text TO id; ALTER TABLE marketplace_reviews ADD PRIMARY KEY (id); ALTER TABLE marketplace_reviews DROP COLUMN id_int;
ALTER TABLE workflow_analytics ALTER COLUMN id_text SET NOT NULL; ALTER TABLE workflow_analytics DROP CONSTRAINT workflow_analytics_pkey; ALTER TABLE workflow_analytics RENAME COLUMN id TO id_int; ALTER TABLE workflow_analytics RENAME COLUMN id_text TO id; ALTER TABLE workflow_analytics ADD PRIMARY KEY (id); ALTER TABLE workflow_analytics DROP COLUMN id_int;
ALTER TABLE ai_analytics ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_analytics DROP CONSTRAINT ai_analytics_pkey; ALTER TABLE ai_analytics RENAME COLUMN id TO id_int; ALTER TABLE ai_analytics RENAME COLUMN id_text TO id; ALTER TABLE ai_analytics ADD PRIMARY KEY (id); ALTER TABLE ai_analytics DROP COLUMN id_int;
ALTER TABLE webhook_endpoints ALTER COLUMN id_text SET NOT NULL; ALTER TABLE webhook_endpoints DROP CONSTRAINT webhook_endpoints_pkey; ALTER TABLE webhook_endpoints RENAME COLUMN id TO id_int; ALTER TABLE webhook_endpoints RENAME COLUMN id_text TO id; ALTER TABLE webhook_endpoints ADD PRIMARY KEY (id); ALTER TABLE webhook_endpoints DROP COLUMN id_int;
ALTER TABLE schedules ALTER COLUMN id_text SET NOT NULL; ALTER TABLE schedules DROP CONSTRAINT schedules_pkey; ALTER TABLE schedules RENAME COLUMN id TO id_int; ALTER TABLE schedules RENAME COLUMN id_text TO id; ALTER TABLE schedules ADD PRIMARY KEY (id); ALTER TABLE schedules DROP COLUMN id_int;

-- ── Level 2: FK → Level 1 ──────────────────────────────────────────────────

ALTER TABLE memberships ALTER COLUMN id_text SET NOT NULL; ALTER TABLE memberships DROP CONSTRAINT memberships_pkey; ALTER TABLE memberships RENAME COLUMN id TO id_int; ALTER TABLE memberships RENAME COLUMN id_text TO id; ALTER TABLE memberships ADD PRIMARY KEY (id); ALTER TABLE memberships DROP COLUMN id_int;
ALTER TABLE workflow_versions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE workflow_versions DROP CONSTRAINT workflow_versions_pkey; ALTER TABLE workflow_versions RENAME COLUMN id TO id_int; ALTER TABLE workflow_versions RENAME COLUMN id_text TO id; ALTER TABLE workflow_versions ADD PRIMARY KEY (id); ALTER TABLE workflow_versions DROP COLUMN id_int;
ALTER TABLE executions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE executions DROP CONSTRAINT executions_pkey; ALTER TABLE executions RENAME COLUMN id TO id_int; ALTER TABLE executions RENAME COLUMN id_text TO id; ALTER TABLE executions ADD PRIMARY KEY (id); ALTER TABLE executions DROP COLUMN id_int;
ALTER TABLE user_mfa ALTER COLUMN id_text SET NOT NULL; ALTER TABLE user_mfa DROP CONSTRAINT user_mfa_pkey; ALTER TABLE user_mfa RENAME COLUMN id TO id_int; ALTER TABLE user_mfa RENAME COLUMN id_text TO id; ALTER TABLE user_mfa ADD PRIMARY KEY (id); ALTER TABLE user_mfa DROP COLUMN id_int;
ALTER TABLE user_sso_identities ALTER COLUMN id_text SET NOT NULL; ALTER TABLE user_sso_identities DROP CONSTRAINT user_sso_identities_pkey; ALTER TABLE user_sso_identities RENAME COLUMN id TO id_int; ALTER TABLE user_sso_identities RENAME COLUMN id_text TO id; ALTER TABLE user_sso_identities ADD PRIMARY KEY (id); ALTER TABLE user_sso_identities DROP COLUMN id_int;
ALTER TABLE user_registrations ALTER COLUMN id_text SET NOT NULL; ALTER TABLE user_registrations DROP CONSTRAINT user_registrations_pkey; ALTER TABLE user_registrations RENAME COLUMN id TO id_int; ALTER TABLE user_registrations RENAME COLUMN id_text TO id; ALTER TABLE user_registrations ADD PRIMARY KEY (id); ALTER TABLE user_registrations DROP COLUMN id_int;
ALTER TABLE workspace_invitations ALTER COLUMN id_text SET NOT NULL; ALTER TABLE workspace_invitations DROP CONSTRAINT workspace_invitations_pkey; ALTER TABLE workspace_invitations RENAME COLUMN id TO id_int; ALTER TABLE workspace_invitations RENAME COLUMN id_text TO id; ALTER TABLE workspace_invitations ADD PRIMARY KEY (id); ALTER TABLE workspace_invitations DROP COLUMN id_int;
ALTER TABLE approval_tasks ALTER COLUMN id_text SET NOT NULL; ALTER TABLE approval_tasks DROP CONSTRAINT approval_tasks_pkey; ALTER TABLE approval_tasks RENAME COLUMN id TO id_int; ALTER TABLE approval_tasks RENAME COLUMN id_text TO id; ALTER TABLE approval_tasks ADD PRIMARY KEY (id); ALTER TABLE approval_tasks DROP COLUMN id_int;
ALTER TABLE dashboard_versions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE dashboard_versions DROP CONSTRAINT dashboard_versions_pkey; ALTER TABLE dashboard_versions RENAME COLUMN id TO id_int; ALTER TABLE dashboard_versions RENAME COLUMN id_text TO id; ALTER TABLE dashboard_versions ADD PRIMARY KEY (id); ALTER TABLE dashboard_versions DROP COLUMN id_int;
ALTER TABLE tenant_connector_installs ALTER COLUMN id_text SET NOT NULL; ALTER TABLE tenant_connector_installs DROP CONSTRAINT tenant_connector_installs_pkey; ALTER TABLE tenant_connector_installs RENAME COLUMN id TO id_int; ALTER TABLE tenant_connector_installs RENAME COLUMN id_text TO id; ALTER TABLE tenant_connector_installs ADD PRIMARY KEY (id); ALTER TABLE tenant_connector_installs DROP COLUMN id_int;
ALTER TABLE rag_documents ALTER COLUMN id_text SET NOT NULL; ALTER TABLE rag_documents DROP CONSTRAINT rag_documents_pkey; ALTER TABLE rag_documents RENAME COLUMN id TO id_int; ALTER TABLE rag_documents RENAME COLUMN id_text TO id; ALTER TABLE rag_documents ADD PRIMARY KEY (id); ALTER TABLE rag_documents DROP COLUMN id_int;
ALTER TABLE ai_evaluation_dataset_entries ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_evaluation_dataset_entries DROP CONSTRAINT ai_evaluation_dataset_entries_pkey; ALTER TABLE ai_evaluation_dataset_entries RENAME COLUMN id TO id_int; ALTER TABLE ai_evaluation_dataset_entries RENAME COLUMN id_text TO id; ALTER TABLE ai_evaluation_dataset_entries ADD PRIMARY KEY (id); ALTER TABLE ai_evaluation_dataset_entries DROP COLUMN id_int;
ALTER TABLE ai_guardrail_hits ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_guardrail_hits DROP CONSTRAINT ai_guardrail_hits_pkey; ALTER TABLE ai_guardrail_hits RENAME COLUMN id TO id_int; ALTER TABLE ai_guardrail_hits RENAME COLUMN id_text TO id; ALTER TABLE ai_guardrail_hits ADD PRIMARY KEY (id); ALTER TABLE ai_guardrail_hits DROP COLUMN id_int;
ALTER TABLE restore_records ALTER COLUMN id_text SET NOT NULL; ALTER TABLE restore_records DROP CONSTRAINT restore_records_pkey; ALTER TABLE restore_records RENAME COLUMN id TO id_int; ALTER TABLE restore_records RENAME COLUMN id_text TO id; ALTER TABLE restore_records ADD PRIMARY KEY (id); ALTER TABLE restore_records DROP COLUMN id_int;
ALTER TABLE security_incident_evidence ALTER COLUMN id_text SET NOT NULL; ALTER TABLE security_incident_evidence DROP CONSTRAINT security_incident_evidence_pkey; ALTER TABLE security_incident_evidence RENAME COLUMN id TO id_int; ALTER TABLE security_incident_evidence RENAME COLUMN id_text TO id; ALTER TABLE security_incident_evidence ADD PRIMARY KEY (id); ALTER TABLE security_incident_evidence DROP COLUMN id_int;
ALTER TABLE invoices ALTER COLUMN id_text SET NOT NULL; ALTER TABLE invoices DROP CONSTRAINT invoices_pkey; ALTER TABLE invoices RENAME COLUMN id TO id_int; ALTER TABLE invoices RENAME COLUMN id_text TO id; ALTER TABLE invoices ADD PRIMARY KEY (id); ALTER TABLE invoices DROP COLUMN id_int;
ALTER TABLE gdpr_requests ALTER COLUMN id_text SET NOT NULL; ALTER TABLE gdpr_requests DROP CONSTRAINT gdpr_requests_pkey; ALTER TABLE gdpr_requests RENAME COLUMN id TO id_int; ALTER TABLE gdpr_requests RENAME COLUMN id_text TO id; ALTER TABLE gdpr_requests ADD PRIMARY KEY (id); ALTER TABLE gdpr_requests DROP COLUMN id_int;
ALTER TABLE user_roles ALTER COLUMN id_text SET NOT NULL; ALTER TABLE user_roles DROP CONSTRAINT user_roles_pkey; ALTER TABLE user_roles RENAME COLUMN id TO id_int; ALTER TABLE user_roles RENAME COLUMN id_text TO id; ALTER TABLE user_roles ADD PRIMARY KEY (id); ALTER TABLE user_roles DROP COLUMN id_int;
ALTER TABLE ai_evaluation_runs ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_evaluation_runs DROP CONSTRAINT ai_evaluation_runs_pkey; ALTER TABLE ai_evaluation_runs RENAME COLUMN id TO id_int; ALTER TABLE ai_evaluation_runs RENAME COLUMN id_text TO id; ALTER TABLE ai_evaluation_runs ADD PRIMARY KEY (id); ALTER TABLE ai_evaluation_runs DROP COLUMN id_int;
ALTER TABLE invoice_lines ALTER COLUMN id_text SET NOT NULL; ALTER TABLE invoice_lines DROP CONSTRAINT invoice_lines_pkey; ALTER TABLE invoice_lines RENAME COLUMN id TO id_int; ALTER TABLE invoice_lines RENAME COLUMN id_text TO id; ALTER TABLE invoice_lines ADD PRIMARY KEY (id); ALTER TABLE invoice_lines DROP COLUMN id_int;
ALTER TABLE execution_checkpoints ALTER COLUMN id_text SET NOT NULL; ALTER TABLE execution_checkpoints DROP CONSTRAINT execution_checkpoints_pkey; ALTER TABLE execution_checkpoints RENAME COLUMN id TO id_int; ALTER TABLE execution_checkpoints RENAME COLUMN id_text TO id; ALTER TABLE execution_checkpoints ADD PRIMARY KEY (id); ALTER TABLE execution_checkpoints DROP COLUMN id_int;

-- ── Level 3: FK → Level 2 ──────────────────────────────────────────────────

ALTER TABLE workflow_diffs ALTER COLUMN id_text SET NOT NULL; ALTER TABLE workflow_diffs DROP CONSTRAINT workflow_diffs_pkey; ALTER TABLE workflow_diffs RENAME COLUMN id TO id_int; ALTER TABLE workflow_diffs RENAME COLUMN id_text TO id; ALTER TABLE workflow_diffs ADD PRIMARY KEY (id); ALTER TABLE workflow_diffs DROP COLUMN id_int;
ALTER TABLE rag_chunks ALTER COLUMN id_text SET NOT NULL; ALTER TABLE rag_chunks DROP CONSTRAINT rag_chunks_pkey; ALTER TABLE rag_chunks RENAME COLUMN id TO id_int; ALTER TABLE rag_chunks RENAME COLUMN id_text TO id; ALTER TABLE rag_chunks ADD PRIMARY KEY (id); ALTER TABLE rag_chunks DROP COLUMN id_int;
ALTER TABLE ai_evaluation_run_results ALTER COLUMN id_text SET NOT NULL; ALTER TABLE ai_evaluation_run_results DROP CONSTRAINT ai_evaluation_run_results_pkey; ALTER TABLE ai_evaluation_run_results RENAME COLUMN id TO id_int; ALTER TABLE ai_evaluation_run_results RENAME COLUMN id_text TO id; ALTER TABLE ai_evaluation_run_results ADD PRIMARY KEY (id); ALTER TABLE ai_evaluation_run_results DROP COLUMN id_int;
ALTER TABLE prompt_versions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE prompt_versions DROP CONSTRAINT prompt_versions_pkey; ALTER TABLE prompt_versions RENAME COLUMN id TO id_int; ALTER TABLE prompt_versions RENAME COLUMN id_text TO id; ALTER TABLE prompt_versions ADD PRIMARY KEY (id); ALTER TABLE prompt_versions DROP COLUMN id_int;
ALTER TABLE template_versions ALTER COLUMN id_text SET NOT NULL; ALTER TABLE template_versions DROP CONSTRAINT template_versions_pkey; ALTER TABLE template_versions RENAME COLUMN id TO id_int; ALTER TABLE template_versions RENAME COLUMN id_text TO id; ALTER TABLE template_versions ADD PRIMARY KEY (id); ALTER TABLE template_versions DROP COLUMN id_int;

-- ---------------------------------------------------------------------------
-- 7. Swap FK columns
--    Pattern: RENAME old → *_int  →  RENAME shadow → original  →  DROP *_int
-- ---------------------------------------------------------------------------

-- Macro helper: each block is (table, old_col)
-- tenant_settings
ALTER TABLE tenant_settings RENAME COLUMN tenant_id TO tenant_id_int; ALTER TABLE tenant_settings RENAME COLUMN tenant_id_new TO tenant_id; ALTER TABLE tenant_settings DROP COLUMN tenant_id_int;

-- users
ALTER TABLE users RENAME COLUMN tenant_id TO tenant_id_int; ALTER TABLE users RENAME COLUMN tenant_id_new TO tenant_id; ALTER TABLE users DROP COLUMN tenant_id_int;

-- memberships
ALTER TABLE memberships RENAME COLUMN tenant_id  TO tenant_id_int;  ALTER TABLE memberships RENAME COLUMN tenant_id_new  TO tenant_id;  ALTER TABLE memberships DROP COLUMN tenant_id_int;
ALTER TABLE memberships RENAME COLUMN user_id    TO user_id_int;    ALTER TABLE memberships RENAME COLUMN user_id_new    TO user_id;    ALTER TABLE memberships DROP COLUMN user_id_int;
ALTER TABLE memberships RENAME COLUMN role_id    TO role_id_int;    ALTER TABLE memberships RENAME COLUMN role_id_new    TO role_id;    ALTER TABLE memberships DROP COLUMN role_id_int;
ALTER TABLE memberships RENAME COLUMN invited_by TO invited_by_int; ALTER TABLE memberships RENAME COLUMN invited_by_new TO invited_by; ALTER TABLE memberships DROP COLUMN invited_by_int;

-- user_roles
ALTER TABLE user_roles RENAME COLUMN role_id   TO role_id_int;   ALTER TABLE user_roles RENAME COLUMN role_id_new   TO role_id;   ALTER TABLE user_roles DROP COLUMN role_id_int;
ALTER TABLE user_roles RENAME COLUMN tenant_id TO tenant_id_int; ALTER TABLE user_roles RENAME COLUMN tenant_id_new TO tenant_id; ALTER TABLE user_roles DROP COLUMN tenant_id_int;

-- workflows
ALTER TABLE workflows RENAME COLUMN tenant_id TO tenant_id_int; ALTER TABLE workflows RENAME COLUMN tenant_id_new TO tenant_id; ALTER TABLE workflows DROP COLUMN tenant_id_int;

-- workflow_versions
ALTER TABLE workflow_versions RENAME COLUMN workflow_id TO workflow_id_int; ALTER TABLE workflow_versions RENAME COLUMN workflow_id_new TO workflow_id; ALTER TABLE workflow_versions DROP COLUMN workflow_id_int;

-- workflow_diffs
ALTER TABLE workflow_diffs RENAME COLUMN workflow_id     TO workflow_id_int;     ALTER TABLE workflow_diffs RENAME COLUMN workflow_id_new     TO workflow_id;     ALTER TABLE workflow_diffs DROP COLUMN workflow_id_int;
ALTER TABLE workflow_diffs RENAME COLUMN from_version_id TO from_version_id_int; ALTER TABLE workflow_diffs RENAME COLUMN from_version_id_new TO from_version_id; ALTER TABLE workflow_diffs DROP COLUMN from_version_id_int;
ALTER TABLE workflow_diffs RENAME COLUMN to_version_id   TO to_version_id_int;   ALTER TABLE workflow_diffs RENAME COLUMN to_version_id_new   TO to_version_id;   ALTER TABLE workflow_diffs DROP COLUMN to_version_id_int;

-- executions
ALTER TABLE executions RENAME COLUMN tenant_id            TO tenant_id_int;            ALTER TABLE executions RENAME COLUMN tenant_id_new            TO tenant_id;            ALTER TABLE executions DROP COLUMN tenant_id_int;
ALTER TABLE executions RENAME COLUMN workflow_id          TO workflow_id_int;          ALTER TABLE executions RENAME COLUMN workflow_id_new          TO workflow_id;          ALTER TABLE executions DROP COLUMN workflow_id_int;
ALTER TABLE executions RENAME COLUMN parent_execution_id  TO parent_execution_id_int;  ALTER TABLE executions RENAME COLUMN parent_execution_id_new  TO parent_execution_id;  ALTER TABLE executions DROP COLUMN parent_execution_id_int;

-- execution_checkpoints
ALTER TABLE execution_checkpoints RENAME COLUMN execution_id TO execution_id_int; ALTER TABLE execution_checkpoints RENAME COLUMN execution_id_new TO execution_id; ALTER TABLE execution_checkpoints DROP COLUMN execution_id_int;

-- dlq_entries
ALTER TABLE dlq_entries RENAME COLUMN execution_id TO execution_id_int; ALTER TABLE dlq_entries RENAME COLUMN execution_id_new TO execution_id; ALTER TABLE dlq_entries DROP COLUMN execution_id_int;
ALTER TABLE dlq_entries RENAME COLUMN workflow_id  TO workflow_id_int;  ALTER TABLE dlq_entries RENAME COLUMN workflow_id_new  TO workflow_id;  ALTER TABLE dlq_entries DROP COLUMN workflow_id_int;

-- connector_actions / triggers / versions
ALTER TABLE connector_actions         RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE connector_actions         RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE connector_actions         DROP COLUMN connector_id_int;
ALTER TABLE connector_triggers        RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE connector_triggers        RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE connector_triggers        DROP COLUMN connector_id_int;
ALTER TABLE connector_versions        RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE connector_versions        RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE connector_versions        DROP COLUMN connector_id_int;
ALTER TABLE connector_executions      RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE connector_executions      RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE connector_executions      DROP COLUMN connector_id_int;
ALTER TABLE connector_polling_states  RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE connector_polling_states  RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE connector_polling_states  DROP COLUMN connector_id_int;

-- tenant_connector_installs
ALTER TABLE tenant_connector_installs RENAME COLUMN tenant_id             TO tenant_id_int;             ALTER TABLE tenant_connector_installs RENAME COLUMN tenant_id_new             TO tenant_id;             ALTER TABLE tenant_connector_installs DROP COLUMN tenant_id_int;
ALTER TABLE tenant_connector_installs RENAME COLUMN connector_id          TO connector_id_int;          ALTER TABLE tenant_connector_installs RENAME COLUMN connector_id_new          TO connector_id;          ALTER TABLE tenant_connector_installs DROP COLUMN connector_id_int;
ALTER TABLE tenant_connector_installs RENAME COLUMN connector_version_id  TO connector_version_id_int;  ALTER TABLE tenant_connector_installs RENAME COLUMN connector_version_id_new  TO connector_version_id;  ALTER TABLE tenant_connector_installs DROP COLUMN connector_version_id_int;
ALTER TABLE tenant_connector_installs RENAME COLUMN installed_by          TO installed_by_int;          ALTER TABLE tenant_connector_installs RENAME COLUMN installed_by_new          TO installed_by;          ALTER TABLE tenant_connector_installs DROP COLUMN installed_by_int;

-- credentials
ALTER TABLE credentials RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE credentials RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE credentials DROP COLUMN connector_id_int;

-- dashboards / dashboard_versions / data_sources
ALTER TABLE dashboards         RENAME COLUMN tenant_id     TO tenant_id_int;     ALTER TABLE dashboards         RENAME COLUMN tenant_id_new     TO tenant_id;     ALTER TABLE dashboards         DROP COLUMN tenant_id_int;
ALTER TABLE dashboard_versions RENAME COLUMN dashboard_id  TO dashboard_id_int;  ALTER TABLE dashboard_versions RENAME COLUMN dashboard_id_new  TO dashboard_id;  ALTER TABLE dashboard_versions DROP COLUMN dashboard_id_int;
ALTER TABLE dashboard_versions RENAME COLUMN created_by    TO created_by_int;    ALTER TABLE dashboard_versions RENAME COLUMN created_by_new    TO created_by;    ALTER TABLE dashboard_versions DROP COLUMN created_by_int;
ALTER TABLE data_sources       RENAME COLUMN tenant_id     TO tenant_id_int;     ALTER TABLE data_sources       RENAME COLUMN tenant_id_new     TO tenant_id;     ALTER TABLE data_sources       DROP COLUMN tenant_id_int;
ALTER TABLE data_sources       RENAME COLUMN created_by    TO created_by_int;    ALTER TABLE data_sources       RENAME COLUMN created_by_new    TO created_by;    ALTER TABLE data_sources       DROP COLUMN created_by_int;

-- template_versions
ALTER TABLE template_versions RENAME COLUMN template_id TO template_id_int; ALTER TABLE template_versions RENAME COLUMN template_id_new TO template_id; ALTER TABLE template_versions DROP COLUMN template_id_int;

-- environment_releases
ALTER TABLE environment_releases RENAME COLUMN environment_id      TO environment_id_int;      ALTER TABLE environment_releases RENAME COLUMN environment_id_new      TO environment_id;      ALTER TABLE environment_releases DROP COLUMN environment_id_int;
ALTER TABLE environment_releases RENAME COLUMN artifact_id         TO artifact_id_int;         ALTER TABLE environment_releases RENAME COLUMN artifact_id_new         TO artifact_id;         ALTER TABLE environment_releases DROP COLUMN artifact_id_int;
ALTER TABLE environment_releases RENAME COLUMN artifact_version_id TO artifact_version_id_int; ALTER TABLE environment_releases RENAME COLUMN artifact_version_id_new TO artifact_version_id; ALTER TABLE environment_releases DROP COLUMN artifact_version_id_int;
ALTER TABLE environment_releases RENAME COLUMN rollback_of         TO rollback_of_int;         ALTER TABLE environment_releases RENAME COLUMN rollback_of_new         TO rollback_of;         ALTER TABLE environment_releases DROP COLUMN rollback_of_int;

-- approval_tasks
ALTER TABLE approval_tasks RENAME COLUMN workflow_id   TO workflow_id_int;   ALTER TABLE approval_tasks RENAME COLUMN workflow_id_new   TO workflow_id;   ALTER TABLE approval_tasks DROP COLUMN workflow_id_int;
ALTER TABLE approval_tasks RENAME COLUMN execution_id  TO execution_id_int;  ALTER TABLE approval_tasks RENAME COLUMN execution_id_new  TO execution_id;  ALTER TABLE approval_tasks DROP COLUMN execution_id_int;
ALTER TABLE approval_tasks RENAME COLUMN requester_id  TO requester_id_int;  ALTER TABLE approval_tasks RENAME COLUMN requester_id_new  TO requester_id;  ALTER TABLE approval_tasks DROP COLUMN requester_id_int;
ALTER TABLE approval_tasks RENAME COLUMN approver_id   TO approver_id_int;   ALTER TABLE approval_tasks RENAME COLUMN approver_id_new   TO approver_id;   ALTER TABLE approval_tasks DROP COLUMN approver_id_int;

-- metering_events
ALTER TABLE metering_events RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE metering_events RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE metering_events DROP COLUMN tenant_id_int;
ALTER TABLE metering_events RENAME COLUMN workflow_id  TO workflow_id_int;  ALTER TABLE metering_events RENAME COLUMN workflow_id_new  TO workflow_id;  ALTER TABLE metering_events DROP COLUMN workflow_id_int;
ALTER TABLE metering_events RENAME COLUMN execution_id TO execution_id_int; ALTER TABLE metering_events RENAME COLUMN execution_id_new TO execution_id; ALTER TABLE metering_events DROP COLUMN execution_id_int;
ALTER TABLE metering_events RENAME COLUMN connector_id TO connector_id_int; ALTER TABLE metering_events RENAME COLUMN connector_id_new TO connector_id; ALTER TABLE metering_events DROP COLUMN connector_id_int;
ALTER TABLE metering_events RENAME COLUMN dashboard_id TO dashboard_id_int; ALTER TABLE metering_events RENAME COLUMN dashboard_id_new TO dashboard_id; ALTER TABLE metering_events DROP COLUMN dashboard_id_int;

-- billing
ALTER TABLE billing_accounts RENAME COLUMN tenant_id           TO tenant_id_int;           ALTER TABLE billing_accounts RENAME COLUMN tenant_id_new           TO tenant_id;           ALTER TABLE billing_accounts DROP COLUMN tenant_id_int;
ALTER TABLE billing_accounts RENAME COLUMN plan_id             TO plan_id_int;             ALTER TABLE billing_accounts RENAME COLUMN plan_id_new             TO plan_id;             ALTER TABLE billing_accounts DROP COLUMN plan_id_int;
ALTER TABLE invoices          RENAME COLUMN billing_account_id  TO billing_account_id_int;  ALTER TABLE invoices          RENAME COLUMN billing_account_id_new  TO billing_account_id;  ALTER TABLE invoices          DROP COLUMN billing_account_id_int;
ALTER TABLE invoice_lines     RENAME COLUMN tenant_id           TO tenant_id_int;           ALTER TABLE invoice_lines     RENAME COLUMN tenant_id_new           TO tenant_id;           ALTER TABLE invoice_lines     DROP COLUMN tenant_id_int;
ALTER TABLE usage_rollups     RENAME COLUMN tenant_id           TO tenant_id_int;           ALTER TABLE usage_rollups     RENAME COLUMN tenant_id_new           TO tenant_id;           ALTER TABLE usage_rollups     DROP COLUMN tenant_id_int;
ALTER TABLE token_budgets     RENAME COLUMN tenant_id           TO tenant_id_int;           ALTER TABLE token_budgets     RENAME COLUMN tenant_id_new           TO tenant_id;           ALTER TABLE token_budgets     DROP COLUMN tenant_id_int;
ALTER TABLE token_budgets     RENAME COLUMN scope_id            TO scope_id_int;            ALTER TABLE token_budgets     RENAME COLUMN scope_id_new            TO scope_id;            ALTER TABLE token_budgets     DROP COLUMN scope_id_int;

-- prompts
ALTER TABLE prompt_versions RENAME COLUMN prompt_id TO prompt_id_int; ALTER TABLE prompt_versions RENAME COLUMN prompt_id_new TO prompt_id; ALTER TABLE prompt_versions DROP COLUMN prompt_id_int;

-- token_usage
ALTER TABLE token_usage RENAME COLUMN tenant_id   TO tenant_id_int;   ALTER TABLE token_usage RENAME COLUMN tenant_id_new   TO tenant_id;   ALTER TABLE token_usage DROP COLUMN tenant_id_int;
ALTER TABLE token_usage RENAME COLUMN model_id    TO model_id_int;    ALTER TABLE token_usage RENAME COLUMN model_id_new    TO model_id;    ALTER TABLE token_usage DROP COLUMN model_id_int;
ALTER TABLE token_usage RENAME COLUMN prompt_id   TO prompt_id_int;   ALTER TABLE token_usage RENAME COLUMN prompt_id_new   TO prompt_id;   ALTER TABLE token_usage DROP COLUMN prompt_id_int;
ALTER TABLE token_usage RENAME COLUMN workflow_id TO workflow_id_int; ALTER TABLE token_usage RENAME COLUMN workflow_id_new TO workflow_id; ALTER TABLE token_usage DROP COLUMN workflow_id_int;

-- notifications / webhooks / schedules
ALTER TABLE notifications    RENAME COLUMN tenant_id   TO tenant_id_int;   ALTER TABLE notifications    RENAME COLUMN tenant_id_new   TO tenant_id;   ALTER TABLE notifications    DROP COLUMN tenant_id_int;
ALTER TABLE webhook_endpoints RENAME COLUMN workflow_id TO workflow_id_int; ALTER TABLE webhook_endpoints RENAME COLUMN workflow_id_new TO workflow_id; ALTER TABLE webhook_endpoints DROP COLUMN workflow_id_int;
ALTER TABLE webhook_deliveries RENAME COLUMN endpoint_id TO endpoint_id_int; ALTER TABLE webhook_deliveries RENAME COLUMN endpoint_id_new TO endpoint_id; ALTER TABLE webhook_deliveries DROP COLUMN endpoint_id_int;
ALTER TABLE schedules        RENAME COLUMN tenant_id   TO tenant_id_int;   ALTER TABLE schedules        RENAME COLUMN tenant_id_new   TO tenant_id;   ALTER TABLE schedules        DROP COLUMN tenant_id_int;
ALTER TABLE schedules        RENAME COLUMN workflow_id TO workflow_id_int; ALTER TABLE schedules        RENAME COLUMN workflow_id_new TO workflow_id; ALTER TABLE schedules        DROP COLUMN workflow_id_int;

-- auth / identity
ALTER TABLE user_mfa             RENAME COLUMN user_id    TO user_id_int;    ALTER TABLE user_mfa             RENAME COLUMN user_id_new    TO user_id;    ALTER TABLE user_mfa             DROP COLUMN user_id_int;
ALTER TABLE sso_connections      RENAME COLUMN tenant_id  TO tenant_id_int;  ALTER TABLE sso_connections      RENAME COLUMN tenant_id_new  TO tenant_id;  ALTER TABLE sso_connections      DROP COLUMN tenant_id_int;
ALTER TABLE user_sso_identities  RENAME COLUMN user_id    TO user_id_int;    ALTER TABLE user_sso_identities  RENAME COLUMN user_id_new    TO user_id;    ALTER TABLE user_sso_identities  DROP COLUMN user_id_int;
ALTER TABLE user_registrations   RENAME COLUMN user_id    TO user_id_int;    ALTER TABLE user_registrations   RENAME COLUMN user_id_new    TO user_id;    ALTER TABLE user_registrations   DROP COLUMN user_id_int;
ALTER TABLE user_registrations   RENAME COLUMN tenant_id  TO tenant_id_int;  ALTER TABLE user_registrations   RENAME COLUMN tenant_id_new  TO tenant_id;  ALTER TABLE user_registrations   DROP COLUMN tenant_id_int;
ALTER TABLE workspace_invitations RENAME COLUMN tenant_id  TO tenant_id_int;  ALTER TABLE workspace_invitations RENAME COLUMN tenant_id_new  TO tenant_id;  ALTER TABLE workspace_invitations DROP COLUMN tenant_id_int;
ALTER TABLE workspace_invitations RENAME COLUMN invited_by TO invited_by_int; ALTER TABLE workspace_invitations RENAME COLUMN invited_by_new TO invited_by; ALTER TABLE workspace_invitations DROP COLUMN invited_by_int;
ALTER TABLE workspace_invitations RENAME COLUMN role_id    TO role_id_int;    ALTER TABLE workspace_invitations RENAME COLUMN role_id_new    TO role_id;    ALTER TABLE workspace_invitations DROP COLUMN role_id_int;

-- audit / regions / infra
ALTER TABLE audit_log          RENAME COLUMN tenant_id         TO tenant_id_int;         ALTER TABLE audit_log          RENAME COLUMN tenant_id_new         TO tenant_id;         ALTER TABLE audit_log          DROP COLUMN tenant_id_int;
ALTER TABLE replication_log    RENAME COLUMN config_id         TO config_id_int;         ALTER TABLE replication_log    RENAME COLUMN config_id_new         TO config_id;         ALTER TABLE replication_log    DROP COLUMN config_id_int;
ALTER TABLE revenue_shares     RENAME COLUMN listing_id        TO listing_id_int;        ALTER TABLE revenue_shares     RENAME COLUMN listing_id_new        TO listing_id;        ALTER TABLE revenue_shares     DROP COLUMN listing_id_int;
ALTER TABLE revenue_shares     RENAME COLUMN seller_tenant_id  TO seller_tenant_id_int;  ALTER TABLE revenue_shares     RENAME COLUMN seller_tenant_id_new  TO seller_tenant_id;  ALTER TABLE revenue_shares     DROP COLUMN seller_tenant_id_int;
ALTER TABLE agent_deployments  RENAME COLUMN listing_id        TO listing_id_int;        ALTER TABLE agent_deployments  RENAME COLUMN listing_id_new        TO listing_id;        ALTER TABLE agent_deployments  DROP COLUMN listing_id_int;
ALTER TABLE agent_deployments  RENAME COLUMN tenant_id         TO tenant_id_int;         ALTER TABLE agent_deployments  RENAME COLUMN tenant_id_new         TO tenant_id;         ALTER TABLE agent_deployments  DROP COLUMN tenant_id_int;
ALTER TABLE agent_deployments  RENAME COLUMN deployed_by       TO deployed_by_int;       ALTER TABLE agent_deployments  RENAME COLUMN deployed_by_new       TO deployed_by;       ALTER TABLE agent_deployments  DROP COLUMN deployed_by_int;
ALTER TABLE email_messages     RENAME COLUMN tenant_id         TO tenant_id_int;         ALTER TABLE email_messages     RENAME COLUMN tenant_id_new         TO tenant_id;         ALTER TABLE email_messages     DROP COLUMN tenant_id_int;

-- marketplace
ALTER TABLE marketplace_listings RENAME COLUMN author_id    TO author_id_int;    ALTER TABLE marketplace_listings RENAME COLUMN author_id_new    TO author_id;    ALTER TABLE marketplace_listings DROP COLUMN author_id_int;
ALTER TABLE marketplace_listings RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE marketplace_listings RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE marketplace_listings DROP COLUMN tenant_id_int;
ALTER TABLE marketplace_listings RENAME COLUMN resource_id  TO resource_id_int;  ALTER TABLE marketplace_listings RENAME COLUMN resource_id_new  TO resource_id;  ALTER TABLE marketplace_listings DROP COLUMN resource_id_int;
ALTER TABLE marketplace_installs RENAME COLUMN listing_id   TO listing_id_int;   ALTER TABLE marketplace_installs RENAME COLUMN listing_id_new   TO listing_id;   ALTER TABLE marketplace_installs DROP COLUMN listing_id_int;
ALTER TABLE marketplace_installs RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE marketplace_installs RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE marketplace_installs DROP COLUMN tenant_id_int;
ALTER TABLE marketplace_installs RENAME COLUMN installed_by TO installed_by_int; ALTER TABLE marketplace_installs RENAME COLUMN installed_by_new TO installed_by; ALTER TABLE marketplace_installs DROP COLUMN installed_by_int;
ALTER TABLE marketplace_reviews  RENAME COLUMN listing_id   TO listing_id_int;   ALTER TABLE marketplace_reviews  RENAME COLUMN listing_id_new   TO listing_id;   ALTER TABLE marketplace_reviews  DROP COLUMN listing_id_int;
ALTER TABLE marketplace_reviews  RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE marketplace_reviews  RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE marketplace_reviews  DROP COLUMN tenant_id_int;
ALTER TABLE marketplace_reviews  RENAME COLUMN user_id      TO user_id_int;      ALTER TABLE marketplace_reviews  RENAME COLUMN user_id_new      TO user_id;      ALTER TABLE marketplace_reviews  DROP COLUMN user_id_int;
ALTER TABLE marketplace_reviews  RENAME COLUMN moderated_by TO moderated_by_int; ALTER TABLE marketplace_reviews  RENAME COLUMN moderated_by_new TO moderated_by; ALTER TABLE marketplace_reviews  DROP COLUMN moderated_by_int;

-- analytics
ALTER TABLE analytics_events   RENAME COLUMN tenant_id    TO tenant_id_int;   ALTER TABLE analytics_events   RENAME COLUMN tenant_id_new    TO tenant_id;   ALTER TABLE analytics_events   DROP COLUMN tenant_id_int;
ALTER TABLE analytics_events   RENAME COLUMN user_id      TO user_id_int;     ALTER TABLE analytics_events   RENAME COLUMN user_id_new      TO user_id;     ALTER TABLE analytics_events   DROP COLUMN user_id_int;
ALTER TABLE analytics_metrics  RENAME COLUMN tenant_id    TO tenant_id_int;   ALTER TABLE analytics_metrics  RENAME COLUMN tenant_id_new    TO tenant_id;   ALTER TABLE analytics_metrics  DROP COLUMN tenant_id_int;
ALTER TABLE workflow_analytics RENAME COLUMN workflow_id  TO workflow_id_int; ALTER TABLE workflow_analytics RENAME COLUMN workflow_id_new  TO workflow_id; ALTER TABLE workflow_analytics DROP COLUMN workflow_id_int;
ALTER TABLE workflow_analytics RENAME COLUMN tenant_id    TO tenant_id_int;   ALTER TABLE workflow_analytics RENAME COLUMN tenant_id_new    TO tenant_id;   ALTER TABLE workflow_analytics DROP COLUMN tenant_id_int;
ALTER TABLE ai_analytics       RENAME COLUMN tenant_id    TO tenant_id_int;   ALTER TABLE ai_analytics       RENAME COLUMN tenant_id_new    TO tenant_id;   ALTER TABLE ai_analytics       DROP COLUMN tenant_id_int;

-- tier / placement
ALTER TABLE tenant_tier_assignments RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE tenant_tier_assignments RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE tenant_tier_assignments DROP COLUMN tenant_id_int;
ALTER TABLE tenant_tier_assignments RENAME COLUMN tier_id      TO tier_id_int;      ALTER TABLE tenant_tier_assignments RENAME COLUMN tier_id_new      TO tier_id;      ALTER TABLE tenant_tier_assignments DROP COLUMN tier_id_int;
ALTER TABLE tenant_placement        RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE tenant_placement        RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE tenant_placement        DROP COLUMN tenant_id_int;
ALTER TABLE tenant_placement        RENAME COLUMN region_id    TO region_id_int;    ALTER TABLE tenant_placement        RENAME COLUMN region_id_new    TO region_id;    ALTER TABLE tenant_placement        DROP COLUMN region_id_int;
ALTER TABLE tenant_migrations       RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE tenant_migrations       RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE tenant_migrations       DROP COLUMN tenant_id_int;
ALTER TABLE tenant_migrations       RENAME COLUMN from_tier_id TO from_tier_id_int; ALTER TABLE tenant_migrations       RENAME COLUMN from_tier_id_new TO from_tier_id; ALTER TABLE tenant_migrations       DROP COLUMN from_tier_id_int;
ALTER TABLE tenant_migrations       RENAME COLUMN to_tier_id   TO to_tier_id_int;   ALTER TABLE tenant_migrations       RENAME COLUMN to_tier_id_new   TO to_tier_id;   ALTER TABLE tenant_migrations       DROP COLUMN to_tier_id_int;

-- backup / restore / retention / compliance / security
ALTER TABLE backup_records            RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE backup_records            RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE backup_records            DROP COLUMN tenant_id_int;
ALTER TABLE restore_records           RENAME COLUMN backup_id    TO backup_id_int;    ALTER TABLE restore_records           RENAME COLUMN backup_id_new    TO backup_id;    ALTER TABLE restore_records           DROP COLUMN backup_id_int;
ALTER TABLE restore_records           RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE restore_records           RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE restore_records           DROP COLUMN tenant_id_int;
ALTER TABLE retention_config          RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE retention_config          RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE retention_config          DROP COLUMN tenant_id_int;
ALTER TABLE gdpr_requests             RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE gdpr_requests             RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE gdpr_requests             DROP COLUMN tenant_id_int;
ALTER TABLE gdpr_requests             RENAME COLUMN user_id      TO user_id_int;      ALTER TABLE gdpr_requests             RENAME COLUMN user_id_new      TO user_id;      ALTER TABLE gdpr_requests             DROP COLUMN user_id_int;
ALTER TABLE compliance_evidence       RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE compliance_evidence       RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE compliance_evidence       DROP COLUMN tenant_id_int;
ALTER TABLE security_incidents        RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE security_incidents        RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE security_incidents        DROP COLUMN tenant_id_int;
ALTER TABLE security_incidents        RENAME COLUMN resolved_by  TO resolved_by_int;  ALTER TABLE security_incidents        RENAME COLUMN resolved_by_new  TO resolved_by;  ALTER TABLE security_incidents        DROP COLUMN resolved_by_int;
ALTER TABLE security_incident_evidence RENAME COLUMN incident_id TO incident_id_int;  ALTER TABLE security_incident_evidence RENAME COLUMN incident_id_new TO incident_id;  ALTER TABLE security_incident_evidence DROP COLUMN incident_id_int;
ALTER TABLE audit_exports             RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE audit_exports             RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE audit_exports             DROP COLUMN tenant_id_int;
ALTER TABLE audit_exports             RENAME COLUMN created_by   TO created_by_int;   ALTER TABLE audit_exports             RENAME COLUMN created_by_new   TO created_by;   ALTER TABLE audit_exports             DROP COLUMN created_by_int;
ALTER TABLE overage_events            RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE overage_events            RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE overage_events            DROP COLUMN tenant_id_int;
ALTER TABLE enterprise_commitments    RENAME COLUMN tenant_id    TO tenant_id_int;    ALTER TABLE enterprise_commitments    RENAME COLUMN tenant_id_new    TO tenant_id;    ALTER TABLE enterprise_commitments    DROP COLUMN tenant_id_int;

-- AI
ALTER TABLE ai_routing_policies       RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_routing_policies       RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_routing_policies       DROP COLUMN tenant_id_int;
ALTER TABLE ai_playground_sessions    RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_playground_sessions    RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_playground_sessions    DROP COLUMN tenant_id_int;
ALTER TABLE agent_memory              RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE agent_memory              RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE agent_memory              DROP COLUMN tenant_id_int;
ALTER TABLE agent_memory              RENAME COLUMN workflow_id    TO workflow_id_int;    ALTER TABLE agent_memory              RENAME COLUMN workflow_id_new    TO workflow_id;    ALTER TABLE agent_memory              DROP COLUMN workflow_id_int;
ALTER TABLE agent_memory              RENAME COLUMN execution_id   TO execution_id_int;   ALTER TABLE agent_memory              RENAME COLUMN execution_id_new   TO execution_id;   ALTER TABLE agent_memory              DROP COLUMN execution_id_int;
ALTER TABLE prompt_approvals          RENAME COLUMN prompt_id      TO prompt_id_int;      ALTER TABLE prompt_approvals          RENAME COLUMN prompt_id_new      TO prompt_id;      ALTER TABLE prompt_approvals          DROP COLUMN prompt_id_int;
ALTER TABLE ai_evaluation_datasets    RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_evaluation_datasets    RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_evaluation_datasets    DROP COLUMN tenant_id_int;
ALTER TABLE ai_evaluation_dataset_entries RENAME COLUMN dataset_id TO dataset_id_int;     ALTER TABLE ai_evaluation_dataset_entries RENAME COLUMN dataset_id_new TO dataset_id;     ALTER TABLE ai_evaluation_dataset_entries DROP COLUMN dataset_id_int;
ALTER TABLE ai_evaluation_runs        RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_evaluation_runs        RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_evaluation_runs        DROP COLUMN tenant_id_int;
ALTER TABLE ai_evaluation_runs        RENAME COLUMN dataset_id     TO dataset_id_int;     ALTER TABLE ai_evaluation_runs        RENAME COLUMN dataset_id_new     TO dataset_id;     ALTER TABLE ai_evaluation_runs        DROP COLUMN dataset_id_int;
ALTER TABLE ai_evaluation_runs        RENAME COLUMN prompt_id      TO prompt_id_int;      ALTER TABLE ai_evaluation_runs        RENAME COLUMN prompt_id_new      TO prompt_id;      ALTER TABLE ai_evaluation_runs        DROP COLUMN prompt_id_int;
ALTER TABLE ai_evaluation_run_results RENAME COLUMN run_id         TO run_id_int;         ALTER TABLE ai_evaluation_run_results RENAME COLUMN run_id_new         TO run_id;         ALTER TABLE ai_evaluation_run_results DROP COLUMN run_id_int;
ALTER TABLE ai_evaluation_run_results RENAME COLUMN entry_id       TO entry_id_int;       ALTER TABLE ai_evaluation_run_results RENAME COLUMN entry_id_new       TO entry_id;       ALTER TABLE ai_evaluation_run_results DROP COLUMN entry_id_int;
ALTER TABLE ai_guardrails             RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_guardrails             RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_guardrails             DROP COLUMN tenant_id_int;
ALTER TABLE ai_guardrail_hits         RENAME COLUMN guardrail_id   TO guardrail_id_int;   ALTER TABLE ai_guardrail_hits         RENAME COLUMN guardrail_id_new   TO guardrail_id;   ALTER TABLE ai_guardrail_hits         DROP COLUMN guardrail_id_int;
ALTER TABLE ai_provider_routes        RENAME COLUMN tenant_id      TO tenant_id_int;      ALTER TABLE ai_provider_routes        RENAME COLUMN tenant_id_new      TO tenant_id;      ALTER TABLE ai_provider_routes        DROP COLUMN tenant_id_int;

-- RAG
ALTER TABLE rag_knowledge_bases RENAME COLUMN tenant_id         TO tenant_id_int;         ALTER TABLE rag_knowledge_bases RENAME COLUMN tenant_id_new         TO tenant_id;         ALTER TABLE rag_knowledge_bases DROP COLUMN tenant_id_int;
ALTER TABLE rag_documents       RENAME COLUMN knowledge_base_id TO knowledge_base_id_int; ALTER TABLE rag_documents       RENAME COLUMN knowledge_base_id_new TO knowledge_base_id; ALTER TABLE rag_documents       DROP COLUMN knowledge_base_id_int;
ALTER TABLE rag_chunks          RENAME COLUMN document_id       TO document_id_int;       ALTER TABLE rag_chunks          RENAME COLUMN document_id_new       TO document_id;       ALTER TABLE rag_chunks          DROP COLUMN document_id_int;
ALTER TABLE rag_chunks          RENAME COLUMN knowledge_base_id TO knowledge_base_id_int; ALTER TABLE rag_chunks          RENAME COLUMN knowledge_base_id_new TO knowledge_base_id; ALTER TABLE rag_chunks          DROP COLUMN knowledge_base_id_int;

-- role_permissions (composite PK — drop old unique constraint first, add new one after)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'role_permissions'
      AND tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE role_permissions DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;
ALTER TABLE role_permissions RENAME COLUMN role_id       TO role_id_int;       ALTER TABLE role_permissions RENAME COLUMN role_id_new       TO role_id;       ALTER TABLE role_permissions DROP COLUMN role_id_int;
ALTER TABLE role_permissions RENAME COLUMN permission_id TO permission_id_int; ALTER TABLE role_permissions RENAME COLUMN permission_id_new TO permission_id; ALTER TABLE role_permissions DROP COLUMN permission_id_int;

-- user_roles
ALTER TABLE user_roles RENAME COLUMN role_id   TO role_id_int;   ALTER TABLE user_roles RENAME COLUMN role_id_new   TO role_id;   ALTER TABLE user_roles DROP COLUMN role_id_int;
ALTER TABLE user_roles RENAME COLUMN tenant_id TO tenant_id_int; ALTER TABLE user_roles RENAME COLUMN tenant_id_new TO tenant_id; ALTER TABLE user_roles DROP COLUMN tenant_id_int;

-- ---------------------------------------------------------------------------
-- 7b. Restore NOT NULL constraints on required FK columns
--     (shadow columns are created nullable; must be re-enforced after swap)
-- ---------------------------------------------------------------------------

ALTER TABLE tenant_settings ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE memberships ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE memberships ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_mfa ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_registrations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_registrations ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE workspace_invitations ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE workflows ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE workflow_versions ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE workflow_diffs ALTER COLUMN workflow_id SET NOT NULL;
ALTER TABLE workflow_diffs ALTER COLUMN from_version_id SET NOT NULL;
ALTER TABLE workflow_diffs ALTER COLUMN to_version_id SET NOT NULL;

ALTER TABLE executions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE executions ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE execution_checkpoints ALTER COLUMN execution_id SET NOT NULL;

ALTER TABLE dlq_entries ALTER COLUMN execution_id SET NOT NULL;
ALTER TABLE dlq_entries ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE connector_versions ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE connector_actions ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE connector_triggers ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE connector_executions ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE connector_executions ALTER COLUMN execution_id SET NOT NULL;
ALTER TABLE connector_executions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE connector_polling_states ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE connector_polling_states ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE tenant_connector_installs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tenant_connector_installs ALTER COLUMN connector_id SET NOT NULL;
ALTER TABLE tenant_connector_installs ALTER COLUMN connector_version_id SET NOT NULL;

ALTER TABLE credentials ALTER COLUMN connector_id SET NOT NULL;

ALTER TABLE dashboards ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE dashboard_versions ALTER COLUMN dashboard_id SET NOT NULL;

ALTER TABLE data_sources ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE template_versions ALTER COLUMN template_id SET NOT NULL;

ALTER TABLE environment_releases ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE environment_releases ALTER COLUMN artifact_id SET NOT NULL;

ALTER TABLE approval_tasks ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE metering_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE metering_events ALTER COLUMN workflow_id SET NOT NULL;
ALTER TABLE metering_events ALTER COLUMN execution_id SET NOT NULL;
ALTER TABLE metering_events ALTER COLUMN connector_id SET NOT NULL;

ALTER TABLE billing_accounts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE billing_accounts ALTER COLUMN plan_id SET NOT NULL;

ALTER TABLE invoices ALTER COLUMN billing_account_id SET NOT NULL;

ALTER TABLE invoice_lines ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE usage_rollups ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE token_budgets ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE prompt_approvals ALTER COLUMN prompt_id SET NOT NULL;

ALTER TABLE token_usage ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE notifications ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE webhook_endpoints ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE webhook_deliveries ALTER COLUMN endpoint_id SET NOT NULL;
-- platform_events has no endpoint_id column; webhook_deliveries covered above

ALTER TABLE schedules ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE schedules ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE audit_log ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE audit_exports ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE agent_deployments ALTER COLUMN listing_id SET NOT NULL;
ALTER TABLE agent_deployments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE marketplace_installs ALTER COLUMN listing_id SET NOT NULL;
ALTER TABLE marketplace_installs ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE marketplace_reviews ALTER COLUMN listing_id SET NOT NULL;
ALTER TABLE marketplace_reviews ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE tenant_tier_assignments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tenant_tier_assignments ALTER COLUMN tier_id SET NOT NULL;

ALTER TABLE tenant_placement ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tenant_placement ALTER COLUMN region_id SET NOT NULL;

ALTER TABLE tenant_migrations ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE backup_records ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE retention_config ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE gdpr_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE gdpr_requests ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE compliance_evidence ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE security_incidents ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE security_incident_evidence ALTER COLUMN incident_id SET NOT NULL;

ALTER TABLE overage_events ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE enterprise_commitments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE ai_routing_policies ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE ai_playground_sessions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE agent_memory ALTER COLUMN tenant_id SET NOT NULL;
-- agent_memory.execution_id is nullable in schema; no NOT NULL restoration needed

ALTER TABLE ai_evaluation_datasets ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE ai_evaluation_dataset_entries ALTER COLUMN dataset_id SET NOT NULL;

ALTER TABLE ai_evaluation_runs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ai_evaluation_runs ALTER COLUMN dataset_id SET NOT NULL;
ALTER TABLE ai_evaluation_runs ALTER COLUMN prompt_id SET NOT NULL;

ALTER TABLE ai_evaluation_run_results ALTER COLUMN run_id SET NOT NULL;
ALTER TABLE ai_evaluation_run_results ALTER COLUMN entry_id SET NOT NULL;

ALTER TABLE ai_guardrails ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE ai_guardrail_hits ALTER COLUMN guardrail_id SET NOT NULL;

ALTER TABLE ai_provider_routes ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE rag_knowledge_bases ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE rag_documents ALTER COLUMN knowledge_base_id SET NOT NULL;

ALTER TABLE rag_chunks ALTER COLUMN document_id SET NOT NULL;
ALTER TABLE rag_chunks ALTER COLUMN knowledge_base_id SET NOT NULL;

-- email_messages.tenant_id is nullable in schema; no NOT NULL restoration needed

ALTER TABLE workflow_analytics ALTER COLUMN workflow_id SET NOT NULL;
ALTER TABLE workflow_analytics ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE workflow_promotions ALTER COLUMN workflow_id SET NOT NULL;

ALTER TABLE usage_events ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE archive_exports ALTER COLUMN tenant_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. Re-add FK constraints (all text → text) + restore unique constraints
-- ---------------------------------------------------------------------------

-- Core identity graph
ALTER TABLE tenant_settings ADD CONSTRAINT tenant_settings_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE users ADD CONSTRAINT users_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE memberships ADD CONSTRAINT memberships_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE memberships ADD CONSTRAINT memberships_user_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_mfa ADD CONSTRAINT user_mfa_user_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_sso_identities ADD CONSTRAINT user_sso_identities_user_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_registrations ADD CONSTRAINT user_registrations_user_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_registrations ADD CONSTRAINT user_registrations_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE workspace_invitations ADD CONSTRAINT workspace_invitations_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE workspace_invitations ADD CONSTRAINT workspace_invitations_invited_by_fk
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE;

-- Workflow graph
ALTER TABLE workflows ADD CONSTRAINT workflows_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE workflow_diffs ADD CONSTRAINT workflow_diffs_workflow_id_fk
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE workflow_diffs ADD CONSTRAINT workflow_diffs_from_version_id_fk
  FOREIGN KEY (from_version_id) REFERENCES workflow_versions(id) ON DELETE CASCADE;
ALTER TABLE workflow_diffs ADD CONSTRAINT workflow_diffs_to_version_id_fk
  FOREIGN KEY (to_version_id) REFERENCES workflow_versions(id) ON DELETE CASCADE;
ALTER TABLE approval_tasks ADD CONSTRAINT approval_tasks_workflow_id_fk
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- Execution graph
ALTER TABLE executions ADD CONSTRAINT executions_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Connector graph
ALTER TABLE connector_actions ADD CONSTRAINT connector_actions_connector_id_fk
  FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
ALTER TABLE connector_triggers ADD CONSTRAINT connector_triggers_connector_id_fk
  FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;
ALTER TABLE connector_versions ADD CONSTRAINT connector_versions_connector_id_fk
  FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE;

-- Dashboard graph
ALTER TABLE dashboards ADD CONSTRAINT dashboards_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE dashboard_versions ADD CONSTRAINT dashboard_versions_dashboard_id_fk
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE;

-- Data sources / environments
ALTER TABLE data_sources ADD CONSTRAINT data_sources_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE environment_releases ADD CONSTRAINT environment_releases_environment_id_fk
  FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE;

-- Billing graph
ALTER TABLE billing_accounts ADD CONSTRAINT billing_accounts_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_billing_account_id_fk
  FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE;
ALTER TABLE invoice_lines ADD CONSTRAINT invoice_lines_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE usage_rollups ADD CONSTRAINT usage_rollups_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE token_budgets ADD CONSTRAINT token_budgets_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE metering_events ADD CONSTRAINT metering_events_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE token_usage ADD CONSTRAINT token_usage_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Notifications / audit
ALTER TABLE notifications ADD CONSTRAINT notifications_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE audit_exports ADD CONSTRAINT audit_exports_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Backup / restore / retention / compliance
ALTER TABLE backup_records ADD CONSTRAINT backup_records_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE restore_records ADD CONSTRAINT restore_records_backup_id_fk
  FOREIGN KEY (backup_id) REFERENCES backup_records(id) ON DELETE CASCADE;
ALTER TABLE restore_records ADD CONSTRAINT restore_records_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE retention_config ADD CONSTRAINT retention_config_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE gdpr_requests ADD CONSTRAINT gdpr_requests_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE gdpr_requests ADD CONSTRAINT gdpr_requests_user_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE compliance_evidence ADD CONSTRAINT compliance_evidence_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE security_incidents ADD CONSTRAINT security_incidents_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE security_incident_evidence ADD CONSTRAINT security_incident_evidence_incident_id_fk
  FOREIGN KEY (incident_id) REFERENCES security_incidents(id) ON DELETE CASCADE;
ALTER TABLE overage_events ADD CONSTRAINT overage_events_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE enterprise_commitments ADD CONSTRAINT enterprise_commitments_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- AI graph
ALTER TABLE ai_routing_policies ADD CONSTRAINT ai_routing_policies_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_playground_sessions ADD CONSTRAINT ai_playground_sessions_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE agent_memory ADD CONSTRAINT agent_memory_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE prompt_approvals ADD CONSTRAINT prompt_approvals_prompt_id_fk
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_datasets ADD CONSTRAINT ai_evaluation_datasets_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_dataset_entries ADD CONSTRAINT ai_evaluation_dataset_entries_dataset_id_fk
  FOREIGN KEY (dataset_id) REFERENCES ai_evaluation_datasets(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_runs ADD CONSTRAINT ai_evaluation_runs_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_runs ADD CONSTRAINT ai_evaluation_runs_dataset_id_fk
  FOREIGN KEY (dataset_id) REFERENCES ai_evaluation_datasets(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_runs ADD CONSTRAINT ai_evaluation_runs_prompt_id_fk
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_run_results ADD CONSTRAINT ai_evaluation_run_results_run_id_fk
  FOREIGN KEY (run_id) REFERENCES ai_evaluation_runs(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluation_run_results ADD CONSTRAINT ai_evaluation_run_results_entry_id_fk
  FOREIGN KEY (entry_id) REFERENCES ai_evaluation_dataset_entries(id) ON DELETE CASCADE;
ALTER TABLE ai_guardrails ADD CONSTRAINT ai_guardrails_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_guardrail_hits ADD CONSTRAINT ai_guardrail_hits_guardrail_id_fk
  FOREIGN KEY (guardrail_id) REFERENCES ai_guardrails(id) ON DELETE CASCADE;
ALTER TABLE ai_provider_routes ADD CONSTRAINT ai_provider_routes_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- RAG graph
ALTER TABLE rag_knowledge_bases ADD CONSTRAINT rag_knowledge_bases_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE rag_documents ADD CONSTRAINT rag_documents_knowledge_base_id_fk
  FOREIGN KEY (knowledge_base_id) REFERENCES rag_knowledge_bases(id) ON DELETE CASCADE;
ALTER TABLE rag_chunks ADD CONSTRAINT rag_chunks_document_id_fk
  FOREIGN KEY (document_id) REFERENCES rag_documents(id) ON DELETE CASCADE;
ALTER TABLE rag_chunks ADD CONSTRAINT rag_chunks_knowledge_base_id_fk
  FOREIGN KEY (knowledge_base_id) REFERENCES rag_knowledge_bases(id) ON DELETE CASCADE;

-- Marketplace
ALTER TABLE marketplace_installs ADD CONSTRAINT marketplace_installs_listing_id_fk
  FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;
ALTER TABLE marketplace_reviews ADD CONSTRAINT marketplace_reviews_listing_id_fk
  FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE;

-- Tenant ops
ALTER TABLE tenant_migrations ADD CONSTRAINT tenant_migrations_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tenant_placement ADD CONSTRAINT tenant_placement_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tenant_placement ADD CONSTRAINT tenant_placement_region_id_fk
  FOREIGN KEY (region_id) REFERENCES regions(id);
ALTER TABLE email_messages ADD CONSTRAINT email_messages_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- security_incidents: resolved_by FK (nullable — SET NULL on user delete)
ALTER TABLE security_incidents ADD CONSTRAINT security_incidents_resolved_by_fk
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Restore unique constraints that were dropped with their integer columns
ALTER TABLE tenant_settings            ADD CONSTRAINT tenant_settings_tenant_id_unique    UNIQUE (tenant_id);
ALTER TABLE tenant_tier_assignments    ADD CONSTRAINT tenant_tier_assignments_tenant_id_uq UNIQUE (tenant_id);
ALTER TABLE role_permissions           ADD CONSTRAINT role_permissions_role_permission_uq  UNIQUE (role_id, permission_id);

-- ---------------------------------------------------------------------------
-- 9. Cleanup
-- ---------------------------------------------------------------------------
DROP FUNCTION gen_cuid();

COMMIT;

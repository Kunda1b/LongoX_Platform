import type { GraphChecksum } from "./graph-checksum";
import { EVENT_REGISTRY } from "./event-registry";

export interface EventEnvelope {
  id: string;
  specVersion: string;
  type: EventType;
  eventVersion: number;
  source: string;
  subject: string;
  time: string;
  identity: {
    userId?: string;
    tenantId?: string;
    role?: string;
    service?: string;
  };
  context: {
    correlationId: string;
    causationId?: string;
    traceId?: string;
    spanId?: string;
  };
  data: Record<string, unknown>;
  dataSchema?: string;
  schemaUrl?: string;
  priority: "low" | "normal" | "high" | "critical";
  partitionKey?: string;
  classification: "internal" | "confidential" | "pii" | "public";
  size?: number;
  ttl?: number;
}

export type EventType =
  | "workflow.created" | "workflow.updated" | "workflow.deleted"
  | "workflow.published" | "workflow.activated" | "workflow.version.created"
  | "workflow.promoted" | "workflow.rolled_back"
  | "execution.started" | "execution.completed" | "execution.failed"
  | "execution.cancelled" | "execution.timeout"
  | "execution.checkpoint.persisted"
  | "execution.node.started" | "execution.node.completed" | "execution.node.failed"
  | "execution.node.paused" | "execution.node.resumed"
  | "execution.approval.required" | "execution.approval.granted" | "execution.approval.rejected"
  | "connector.installed" | "connector.revoked" | "connector.uninstalled"
  | "connector.configured" | "connector.upgraded" | "connector.rolled_back"
  | "connector.execution.started" | "connector.execution.completed" | "connector.execution.failed"
  | "connector.webhook.received" | "connector.test.completed"
  | "template.published" | "template.deprecated"
  | "ai.run.started" | "ai.run.completed" | "ai.run.failed" | "ai.run.blocked"
  | "ai.run.guardrail.violation" | "ai.guardrail.hit"
  | "ai.budget.exceeded" | "ai.evaluation.passed" | "ai.evaluation.failed"
  | "ai.prompt.created" | "ai.prompt.promoted"
  | "environment.promoted" | "environment.rolled_back"
  | "billing.invoice.created" | "billing.invoice.generated" | "billing.invoice.paid"
  | "billing.invoice.failed" | "billing.subscription.created"
  | "billing.subscription.updated" | "billing.subscription.cancelled"
  | "billing.plan.entitlement.exceeded" | "billing.overage.incurred"
  | "usage.recorded"
  | "audit.action.executed" | "audit.export.created"
  | "search.index.updated" | "search.reindex.started" | "search.reindex.completed"
  | "platform.tenant.created" | "platform.tenant.updated" | "platform.tenant.deleted"
  | "platform.user.invited" | "platform.user.joined" | "platform.user.removed"
  | "platform.region.health.changed" | "platform.backup.completed" | "platform.backup.failed"
  | "platform.restore.completed" | "platform.restore.failed"
  | "platform.rollback.completed"
  | "platform.migration.started" | "platform.migration.completed" | "platform.migration.failed"
  | "platform.certificate.expiring";

export interface WorkflowCreatedEventData {
  workflowId: string;
  name: string;
  triggerType: string;
  createdBy: string;
  nodeCount: number;
}

export interface WorkflowUpdatedEventData {
  workflowId: string;
  name?: string;
  triggerType?: string;
  updatedBy: string;
  changeNote?: string;
  nodeCount?: number;
}

export interface WorkflowDeletedEventData {
  workflowId: string;
  name: string;
  deletedBy: string;
}

export interface WorkflowPublishedEventData {
  workflowId: string;
  version: number;
  versionChecksum: GraphChecksum;
  environment: string;
  publishedBy: string;
}

export interface WorkflowVersionCreatedEventData {
  workflowId: string;
  version: number;
  versionChecksum: GraphChecksum;
  nodeCount: number;
  createdBy: string;
}

export interface WorkflowPromotedEventData {
  workflowId: string;
  fromEnvironment: string;
  toEnvironment: string;
  promotionId: number;
  promotedBy: string;
  approvalRequired: boolean;
}

export interface WorkflowRolledBackEventData {
  workflowId: string;
  fromVersion: number;
  toVersion: number;
  environment: string;
  rolledBackBy: string;
}

export interface ExecutionStartedEventData {
  executionId: string;
  workflowId: string;
  workflowVersion: number;
  triggeredBy: string;
  triggerType: string;
  inputSize: number;
}

export interface ExecutionCompletedEventData {
  executionId: string;
  workflowId: string;
  durationMs: number;
  totalNodes: number;
  status: "success" | "failed" | "cancelled" | "timeout";
  outputSize?: number;
}

export interface ExecutionFailedEventData {
  executionId: string;
  workflowId: string;
  durationMs: number;
  totalNodes: number;
  error: string;
  failedNodeId?: string;
}

export interface ExecutionCancelledEventData {
  executionId: string;
  workflowId: string;
  cancelledBy: string;
  reason?: string;
}

export interface ExecutionTimeoutEventData {
  executionId: string;
  workflowId: string;
  timeoutMs: number;
}

export interface ExecutionNodeEventData {
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  durationMs: number;
  status: string;
  retryAttempt?: number;
  error?: string;
}

export interface ExecutionApprovalEventData {
  executionId: string;
  nodeId: string;
  approvalTaskId: string;
  decision: "approved" | "rejected";
  decidedBy?: number;
  note?: string;
}

export interface ConnectorInstalledEventData {
  connectorName: string;
  connectorVersion: string;
  installationId: number;
  installedBy: string;
}

export interface ConnectorUninstalledEventData {
  connectorName: string;
  installationId: number;
  uninstalledBy: string;
}

export interface ConnectorConfiguredEventData {
  connectorName: string;
  installationId: number;
  configuredBy: string;
  changes: string[];
}

export interface ConnectorExecutionEventData {
  connectorName: string;
  actionId: string;
  installationId: number;
  executionId: string;
  durationMs: number;
  success: boolean;
  error?: string;
  networkRequests: number;
}

export interface AiRunEventData {
  runId: string;
  provider: string;
  model: string;
  promptVersion?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  durationMs: number;
  guardrailsHit: number;
  blocked: boolean;
}

export interface AiGuardrailHitEventData {
  guardrailId: number;
  guardrailName: string;
  violationType: string;
  blocked: boolean;
  inputPreview: string;
}

export interface AiEvaluationEventData {
  runId: string;
  evaluationName: string;
  passed: boolean;
  score?: number;
  details?: string;
}

export interface AiPromptEventData {
  promptId: string;
  promptName: string;
  version: number;
  action: "created" | "promoted";
  actor: string;
}

export interface BillingEventData {
  invoiceId?: string;
  subscriptionId?: string;
  tenantId: string;
  amount: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface BillingEntitlementEventData {
  tenantId: string;
  plan: string;
  feature: string;
  currentUsage: number;
  limit: number;
}

export interface PlatformTenantEventData {
  tenantId: string;
  tenantName: string;
  tier: string;
  action: string;
}

export interface PlatformUserEventData {
  tenantId: string;
  userId: string;
  email: string;
  role: string;
  action: string;
}

export interface PlatformMigrationEventData {
  tenantId: string;
  fromTier: string;
  toTier: string;
  fromPlacement: string;
  toPlacement: string;
  migrationId: string;
}

export interface PlatformHealthEventData {
  region: string;
  status: string;
  previousStatus: string;
  timestamp: string;
}

export interface PlatformBackupEventData {
  backupId: string;
  region: string;
  sizeBytes: number;
  durationMs: number;
  status: string;
  error?: string;
}

export interface PlatformCertificateEventData {
  domain: string;
  issuer: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface AuditEventData {
  auditEntryId: number;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  details?: string;
}

export interface SearchEventData {
  indexName: string;
  documentCount: number;
  durationMs: number;
}

export function createEventEnvelope(
  type: EventType,
  data: Record<string, unknown>,
  context?: Partial<EventEnvelope["context"]>,
  eventVersion?: number,
): EventEnvelope {
  const id = crypto.randomUUID();
  const registryEntry = EVENT_REGISTRY[type];
  const resolvedVersion = eventVersion ?? registryEntry?.eventVersion ?? 1;
  const resolvedSchemaUrl = registryEntry?.schemaUrl
    ? registryEntry.schemaUrl.replace(/\.v(\d+)\.json$/, `.v${resolvedVersion}.json`)
    : undefined;
  return {
    id,
    specVersion: "1.0",
    type,
    eventVersion: resolvedVersion,
    source: "/api/v1/workflows",
    subject: `${type}.${id}`,
    time: new Date().toISOString(),
    identity: {},
    context: {
      correlationId: context?.correlationId ?? crypto.randomUUID(),
      causationId: context?.causationId,
      traceId: context?.traceId,
      spanId: context?.spanId,
    },
    data,
    schemaUrl: resolvedSchemaUrl,
    priority: "normal",
    classification: "internal",
  };
}

export function validateEventEnvelope(event: unknown): event is EventEnvelope {
  if (!event || typeof event !== "object") return false;
  const e = event as Record<string, unknown>;
  if (typeof e.id !== "string") return false;
  if (typeof e.specVersion !== "string") return false;
  if (typeof e.type !== "string") return false;
  if (typeof e.eventVersion !== "number") return false;
  if (typeof e.source !== "string") return false;
  if (typeof e.subject !== "string") return false;
  if (typeof e.time !== "string") return false;
  if (!e.data || typeof e.data !== "object") return false;
  if (typeof e.priority !== "string") return false;
  if (typeof e.classification !== "string") return false;
  if (!e.context || typeof e.context !== "object") return false;
  const ctx = e.context as Record<string, unknown>;
  if (typeof ctx.correlationId !== "string") return false;
  return true;
}

export function serializeEvent(event: EventEnvelope): string {
  return JSON.stringify(event);
}

export function deserializeEvent(raw: string): EventEnvelope {
  const parsed = JSON.parse(raw);
  if (!validateEventEnvelope(parsed)) {
    throw new Error("Invalid event envelope structure");
  }
  return parsed;
}


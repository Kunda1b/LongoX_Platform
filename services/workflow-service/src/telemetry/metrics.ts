import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("workflow-service");

// Counters
export const workflowsCreatedCounter = meter.createCounter(
  "workflows.created",
  {
    description: "Total workflows created",
  },
);

export const workflowsPublishedCounter = meter.createCounter(
  "workflows.published",
  {
    description: "Total workflows published",
  },
);

export const workflowExecutionsTriggeredCounter = meter.createCounter(
  "workflows.executions.triggered",
  {
    description: "Total workflow executions triggered",
  },
);

export const workflowValidationFailedCounter = meter.createCounter(
  "workflows.validation.failed",
  {
    description: "Total workflow validation failures",
  },
);

// Histograms
export const workflowPublishDurationHistogram = meter.createHistogram(
  "workflows.publish.duration",
  {
    description: "Workflow publish duration in milliseconds",
    unit: "ms",
  },
);

export const workflowValidationDurationHistogram = meter.createHistogram(
  "workflows.validation.duration",
  {
    description: "Workflow validation duration in milliseconds",
    unit: "ms",
  },
);

// Helper functions
export function recordWorkflowCreated(tenantId: string): void {
  workflowsCreatedCounter.add(1, { "tenant.id": tenantId });
}

export function recordWorkflowPublished(
  workflowId: string,
  durationMs: number,
): void {
  workflowsPublishedCounter.add(1, { "workflow.id": workflowId });
  workflowPublishDurationHistogram.record(durationMs, {
    "workflow.id": workflowId,
  });
}

export function recordWorkflowExecutionTriggered(
  workflowId: string,
  triggerType: string,
): void {
  workflowExecutionsTriggeredCounter.add(1, {
    "workflow.id": workflowId,
    "trigger.type": triggerType,
  });
}

export function recordWorkflowValidationFailed(
  workflowId: string,
  reason: string,
): void {
  workflowValidationFailedCounter.add(1, {
    "workflow.id": workflowId,
    "failure.reason": reason,
  });
}

export function recordWorkflowValidation(
  durationMs: number,
  success: boolean,
): void {
  workflowValidationDurationHistogram.record(durationMs, {
    "validation.success": success.toString(),
  });
}

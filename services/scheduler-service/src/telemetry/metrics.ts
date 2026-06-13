import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("scheduler-service");

// Counters
export const scheduledJobsCounter = meter.createCounter("scheduler.jobs", {
  description: "Total scheduled jobs",
});

export const scheduledJobsTriggeredCounter = meter.createCounter("scheduler.jobs.triggered", {
  description: "Total scheduled jobs triggered",
});

export const scheduledJobsFailedCounter = meter.createCounter("scheduler.jobs.failed", {
  description: "Total scheduled jobs failed",
});

// Histograms
export const jobExecutionDurationHistogram = meter.createHistogram("scheduler.job.duration", {
  description: "Scheduled job execution duration in milliseconds",
  unit: "ms",
});

// Gauges
export const pendingScheduledJobsGauge = meter.createGauge("scheduler.jobs.pending", {
  description: "Number of pending scheduled jobs",
});

// Helper functions
export function recordScheduledJob(
  workflowId: string,
  cronExpression: string
): void {
  scheduledJobsCounter.add(1, { workflow_id: workflowId, cron: cronExpression });
}

export function recordScheduledJobTriggered(
  workflowId: string,
  durationMs: number
): void {
  const attrs = { workflow_id: workflowId };
  scheduledJobsTriggeredCounter.add(1, attrs);
  jobExecutionDurationHistogram.record(durationMs, attrs);
}

export function recordScheduledJobFailed(
  workflowId: string,
  errorType: string
): void {
  scheduledJobsFailedCounter.add(1, { workflow_id: workflowId, error_type: errorType });
}

export function updatePendingScheduledJobs(count: number): void {
  pendingScheduledJobsGauge.record(count);
}

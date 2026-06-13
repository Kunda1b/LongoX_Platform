import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("execution-service");

// Counters
export const jobsCompletedCounter = meter.createCounter("jobs.completed", {
  description: "Number of jobs completed successfully",
});

export const jobsFailedCounter = meter.createCounter("jobs.failed", {
  description: "Number of jobs that failed",
});

export const jobsRetriedCounter = meter.createCounter("jobs.retried", {
  description: "Number of jobs retried",
});

// Histograms
export const jobDurationHistogram = meter.createHistogram("jobs.duration", {
  description: "Job execution duration in milliseconds",
  unit: "ms",
});

export const nodeDurationHistogram = meter.createHistogram("nodes.duration", {
  description: "Node execution duration in milliseconds",
  unit: "ms",
});

// Gauges
export const queueDepthGauge = meter.createGauge("queue.depth", {
  description: "Current queue depth (waiting jobs)",
});

export const activeJobsGauge = meter.createGauge("jobs.active", {
  description: "Number of currently active jobs",
});

// Helper functions
export function recordJobCompleted(jobType: string, durationMs: number): void {
  jobsCompletedCounter.add(1, { "job.type": jobType });
  jobDurationHistogram.record(durationMs, { "job.type": jobType });
}

export function recordJobFailed(jobType: string, error: string): void {
  jobsFailedCounter.add(1, { "job.type": jobType, "error.type": error });
}

export function recordJobRetried(jobType: string, attempt: number): void {
  jobsRetriedCounter.add(1, { "job.type": jobType, "attempt": attempt.toString() });
}

export function recordNodeExecution(
  nodeType: string,
  durationMs: number,
  success: boolean
): void {
  nodeDurationHistogram.record(durationMs, {
    "node.type": nodeType,
    "node.success": success.toString(),
  });
}

export function updateQueueDepth(waiting: number, active: number): void {
  queueDepthGauge.record(waiting);
  activeJobsGauge.record(active);
}

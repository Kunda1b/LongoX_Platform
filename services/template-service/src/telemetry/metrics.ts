import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("template-service");

// Counters
export const templateInstallsCounter = meter.createCounter(
  "template.installs",
  {
    description: "Total template installations",
  },
);

export const templatePublishesCounter = meter.createCounter(
  "template.publishes",
  {
    description: "Total template publishes",
  },
);

// Histograms
export const templateOperationDurationHistogram = meter.createHistogram(
  "template.operation.duration",
  {
    description: "Template operation duration in milliseconds",
    unit: "ms",
  },
);

// Gauges
export const activeTemplatesGauge = meter.createGauge("templates.active", {
  description: "Number of active templates",
});

// Helper functions
export function recordTemplateInstall(
  templateId: string,
  tenantId: string,
): void {
  templateInstallsCounter.add(1, {
    template_id: templateId,
    tenant_id: tenantId,
  });
}

export function recordTemplatePublish(
  templateId: string,
  category: string,
): void {
  templatePublishesCounter.add(1, { template_id: templateId, category });
}

export function updateActiveTemplates(count: number): void {
  activeTemplatesGauge.record(count);
}

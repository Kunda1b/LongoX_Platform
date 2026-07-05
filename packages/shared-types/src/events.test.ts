import { describe, it, expect } from "vitest";
import {
  createEventEnvelope,
  validateEventEnvelope,
  serializeEvent,
  deserializeEvent,
} from "./events";
import type { EventEnvelope, EventType } from "./events";

describe("createEventEnvelope", () => {
  it("creates a valid envelope with required fields", () => {
    const envelope = createEventEnvelope("workflow.published", {
      workflowId: "1",
      version: 2,
    });
    expect(envelope.id).toBeTruthy();
    expect(envelope.specVersion).toBe("1.0");
    expect(envelope.type).toBe("workflow.published");
    expect(envelope.time).toBeTruthy();
    expect(envelope.context.correlationId).toBeTruthy();
    expect(envelope.data.workflowId).toBe(1);
    expect(envelope.data.version).toBe(2);
    expect(envelope.priority).toBe("normal");
    expect(envelope.classification).toBe("internal");
  });

  it("accepts context overrides", () => {
    const envelope = createEventEnvelope(
      "execution.started",
      {},
      {
        correlationId: "custom-correlation",
        causationId: "causation-1",
        traceId: "trace-abc",
        spanId: "span-xyz",
      },
    );
    expect(envelope.context.correlationId).toBe("custom-correlation");
    expect(envelope.context.causationId).toBe("causation-1");
    expect(envelope.context.traceId).toBe("trace-abc");
    expect(envelope.context.spanId).toBe("span-xyz");
  });

  it("generates unique ids for each call", () => {
    const e1 = createEventEnvelope("workflow.created", {});
    const e2 = createEventEnvelope("workflow.created", {});
    expect(e1.id).not.toBe(e2.id);
    expect(e1.context.correlationId).not.toBe(e2.context.correlationId);
  });
});

describe("validateEventEnvelope", () => {
  it("returns true for valid envelope", () => {
    const envelope = createEventEnvelope("audit.action.executed", {
      action: "test",
    });
    expect(validateEventEnvelope(envelope)).toBe(true);
  });

  it("returns false for null", () => {
    expect(validateEventEnvelope(null)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(validateEventEnvelope("string")).toBe(false);
  });

  it("returns false for missing id", () => {
    const envelope = createEventEnvelope("audit.action.executed", {});
    expect(validateEventEnvelope({ ...envelope, id: undefined })).toBe(false);
  });

  it("returns false for missing specVersion", () => {
    const envelope = createEventEnvelope("audit.action.executed", {});
    expect(validateEventEnvelope({ ...envelope, specVersion: undefined })).toBe(
      false,
    );
  });

  it("returns false for missing data", () => {
    const envelope = createEventEnvelope("audit.action.executed", {});
    expect(validateEventEnvelope({ ...envelope, data: undefined })).toBe(false);
  });

  it("returns false for missing context.correlationId", () => {
    const envelope = createEventEnvelope("audit.action.executed", {});
    expect(validateEventEnvelope({ ...envelope, context: {} })).toBe(false);
  });
});

describe("serializeEvent / deserializeEvent", () => {
  it("roundtrips correctly", () => {
    const envelope = createEventEnvelope("ai.run.completed", {
      provider: "openai",
      model: "gpt-4",
      tokens: 100,
    });
    const json = serializeEvent(envelope);
    const parsed = deserializeEvent(json);
    expect(parsed.id).toBe(envelope.id);
    expect(parsed.type).toBe(envelope.type);
    expect(parsed.data.provider).toBe("openai");
    expect(parsed.data.model).toBe("gpt-4");
  });

  it("deserializeEvent throws on invalid JSON", () => {
    expect(() => deserializeEvent("not-json")).toThrow();
  });

  it("deserializeEvent throws on invalid structure", () => {
    expect(() => deserializeEvent(JSON.stringify({ invalid: true }))).toThrow(
      "Invalid event envelope structure",
    );
  });
});

describe("event type categories", () => {
  it("workflow events exist", () => {
    for (const t of [
      "workflow.created",
      "workflow.updated",
      "workflow.deleted",
      "workflow.published",
      "workflow.version.created",
      "workflow.promoted",
      "workflow.rolled_back",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });

  it("execution events exist", () => {
    for (const t of [
      "execution.started",
      "execution.completed",
      "execution.failed",
      "execution.cancelled",
      "execution.timeout",
      "execution.node.started",
      "execution.node.completed",
      "execution.node.failed",
      "execution.node.paused",
      "execution.node.resumed",
      "execution.approval.required",
      "execution.approval.granted",
      "execution.approval.rejected",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });

  it("connector events exist", () => {
    for (const t of [
      "connector.installed",
      "connector.uninstalled",
      "connector.configured",
      "connector.upgraded",
      "connector.rolled_back",
      "connector.execution.started",
      "connector.execution.completed",
      "connector.execution.failed",
      "connector.webhook.received",
      "connector.test.completed",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });

  it("AI events exist", () => {
    for (const t of [
      "ai.run.started",
      "ai.run.completed",
      "ai.run.failed",
      "ai.run.blocked",
      "ai.guardrail.hit",
      "ai.budget.exceeded",
      "ai.evaluation.passed",
      "ai.evaluation.failed",
      "ai.prompt.created",
      "ai.prompt.promoted",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });

  it("billing events exist", () => {
    for (const t of [
      "billing.invoice.created",
      "billing.invoice.paid",
      "billing.invoice.failed",
      "billing.subscription.created",
      "billing.subscription.updated",
      "billing.subscription.cancelled",
      "billing.plan.entitlement.exceeded",
      "billing.overage.incurred",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });

  it("platform events exist", () => {
    for (const t of [
      "platform.tenant.created",
      "platform.tenant.updated",
      "platform.tenant.deleted",
      "platform.user.invited",
      "platform.user.joined",
      "platform.user.removed",
      "platform.region.health.changed",
      "platform.backup.completed",
      "platform.backup.failed",
      "platform.restore.completed",
      "platform.restore.failed",
      "platform.rollback.completed",
      "platform.migration.started",
      "platform.migration.completed",
      "platform.migration.failed",
      "platform.certificate.expiring",
    ]) {
      const envelope = createEventEnvelope(t as EventType, {});
      expect(envelope.type).toBe(t);
    }
  });
});

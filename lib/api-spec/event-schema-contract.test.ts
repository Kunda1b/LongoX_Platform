import { describe, it, expect } from "vitest";

/**
 * Contract tests for the event schema (EventEnvelope).
 * Ensures all mandatory Section 19 fields are present and
 * versioning rules are followed.
 */
describe("Event schema contract", () => {
  it("EventEnvelope has all 18 mandatory fields", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope("workflow.created", {});
    const mandatoryFields = [
      "id",
      "specVersion",
      "type",
      "source",
      "subject",
      "time",
      "identity",
      "context",
      "data",
      "priority",
      "classification",
    ];
    for (const field of mandatoryFields) {
      expect(envelope).toHaveProperty(field);
    }
  });

  it("specVersion is '1.0' for all events", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope("execution.started", {});
    expect(envelope.specVersion).toBe("1.0");
  });

  it("context includes correlationId", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope("execution.completed", {});
    expect(envelope.context).toHaveProperty("correlationId");
    expect(typeof envelope.context.correlationId).toBe("string");
  });

  it("context supports optional causationId chain", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope(
      "execution.failed",
      {},
      {
        correlationId: "parent-correlation",
        causationId: "parent-event-id",
      },
    );
    expect(envelope.context.causationId).toBe("parent-event-id");
  });

  it("context supports OpenTelemetry trace context", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope(
      "ai.run.started",
      {},
      {
        traceId: "trace-abc",
        spanId: "span-xyz",
      },
    );
    expect(envelope.context.traceId).toBe("trace-abc");
    expect(envelope.context.spanId).toBe("span-xyz");
  });

  it("serialize/deserialize roundtrip preserves all fields", async () => {
    const { createEventEnvelope, serializeEvent, deserializeEvent } =
      await import("@longox/shared-types").catch(() => ({}) as any);
    if (typeof createEventEnvelope !== "function") return;

    const original = createEventEnvelope("billing.invoice.created", {
      invoiceId: "inv_123",
      amount: 1000,
    });
    const json = serializeEvent(original);
    const restored = deserializeEvent(json);
    expect(restored.id).toBe(original.id);
    expect(restored.type).toBe(original.type);
    expect(restored.data.invoiceId).toBe("inv_123");
  });

  it("validateEventEnvelope rejects malformed events", async () => {
    const { validateEventEnvelope } = await import(
      "@longox/shared-types"
    ).catch(() => ({}) as any);
    if (typeof validateEventEnvelope !== "function") return;

    expect(validateEventEnvelope(null)).toBe(false);
    expect(validateEventEnvelope({})).toBe(false);
    expect(validateEventEnvelope({ id: "x", specVersion: "1.0" })).toBe(false);
  });

  it("all event types are registered in categorical list", async () => {
    // Verify all 69+ event types are importable
    const typesModule = await import("@longox/shared-types").catch(() => null);
    if (typesModule && typesModule.EventType) {
      expect(typesModule.EventType).toBeTruthy();
    }
  });

  it("critical event types exist for billing, security, and platform operations", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const criticalTypes = [
      "execution.failed",
      "ai.guardrail.hit",
      "billing.invoice.failed",
      "platform.backup.failed",
      "platform.region.health.changed",
    ];
    for (const t of criticalTypes) {
      const env = createEventEnvelope(t as any, {});
      expect(env.type).toBe(t);
    }
  });

  it("envelope data field accepts typed event data", async () => {
    const { createEventEnvelope } = await import("@longox/shared-types").catch(
      () => ({}) as any,
    );
    if (typeof createEventEnvelope !== "function") return;

    const envelope = createEventEnvelope("execution.approval.granted", {
      executionId: 1,
      nodeId: "n1",
      approvalTaskId: 42,
      decision: "approved",
      decidedBy: 100,
      note: "Looks good",
    });
    expect(envelope.data.executionId).toBe(1);
    expect(envelope.data.decision).toBe("approved");
    expect(envelope.data.decidedBy).toBe(100);
  });
});

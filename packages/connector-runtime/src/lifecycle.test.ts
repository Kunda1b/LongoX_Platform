import { describe, it, expect, vi } from "vitest";
import { lifecycleEngine } from "./lifecycle";
import type { ConnectorLifecycleEvent, LifecycleState } from "./lifecycle";
import type { ConnectorManifest } from "./manifest";

function makeManifest(): ConnectorManifest {
  return {
    manifestVersion: "1.0",
    id: "test",
    name: "test",
    displayName: "Test",
    description: "",
    version: "1.0.0",
    sdkVersion: "1.0.0",
    author: "test",
    icon: "",
    color: "#000",
    categories: [],
    certificationLevel: "official",
    signature: "sig",
    checksum: "",
    permissions: [{ scope: "read", description: "Read", required: true, dangerous: false }],
    capabilities: {
      actions: true,
      triggers: { polling: false, webhooks: false, events: false },
      auth: { oauth2: false, apiKey: true, basic: false, custom: false },
      batching: false,
      pagination: false,
      fileUpload: false,
      realtime: false,
    },
    networkAccess: { requiredDomains: [], allowDynamic: false },
    auth: [{ type: "api_key", label: "Key", apiKey: { keyName: "key", keyType: "header" } }],
    actions: [],
    triggers: [],
    runtime: { minMemoryMb: 128, minCpuMs: 500, timeoutMs: 30_000, maxNetworkRequests: 50, requiredOps: [] },
  };
}

function makeState(overrides?: Partial<LifecycleState>): LifecycleState {
  return {
    installationId: 1,
    connectorId: 1,
    connectorName: "test",
    tenantId: 1,
    currentEvent: "installing",
    previousEvent: null,
    status: "installing",
    version: "1.0.0",
    config: {},
    errorMessage: null,
    eventHistory: [{ event: "installing", timestamp: new Date().toISOString() }],
    ...overrides,
  };
}

describe("LifecycleEngine", () => {
  it("createInitialState sets correct defaults", () => {
    const manifest = makeManifest();
    const state = lifecycleEngine.createInitialState(manifest, 42);
    expect(state.installationId).toBe(0);
    expect(state.connectorName).toBe("test");
    expect(state.tenantId).toBe(42);
    expect(state.currentEvent).toBe("installing");
    expect(state.status).toBe("installing");
    expect(state.version).toBe("1.0.0");
  });

  it("transition updates current event and history", async () => {
    const state = makeState();
    const next = await lifecycleEngine.transition(state, "configured", "Config complete");
    expect(next.currentEvent).toBe("configured");
    expect(next.previousEvent).toBe("installing");
    expect(next.eventHistory).toHaveLength(2);
    expect(next.eventHistory[1].details).toBe("Config complete");
  });

  it("sets status to active on installed/configured/tested", async () => {
    for (const event of ["installed", "configured", "tested"] as ConnectorLifecycleEvent[]) {
      const state = makeState({ currentEvent: "installing", status: "installing" });
      const next = await lifecycleEngine.transition(state, event);
      expect(next.status, `event ${event} should set active`).toBe("active");
    }
  });

  it("sets status to retired on uninstalled", async () => {
    const state = makeState({ currentEvent: "active", status: "active" });
    const next = await lifecycleEngine.transition(state, "uninstalled");
    expect(next.status).toBe("retired");
  });

  it("sets error state when hooks throw", async () => {
    const state = makeState();
    lifecycleEngine.registerHook(["installing"], {
      onBefore: async () => { throw new Error("Hook failure"); },
    });
    const next = await lifecycleEngine.transition(state, "installing");
    expect(next.currentEvent).toBe("error");
    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("Hook failure");
  });

  it("calls onBefore and onAfter hooks in order", async () => {
    const order: string[] = [];
    lifecycleEngine.registerHook(["configured"], {
      onBefore: async () => { order.push("before"); },
      onAfter: async () => { order.push("after"); },
    });
    await lifecycleEngine.transition(makeState(), "configured");
    expect(order).toEqual(["before", "after"]);
  });

  it("calls onError hook when transition fails", async () => {
    const errorHandler = vi.fn();
    lifecycleEngine.registerHook(["installed"], {
      onBefore: async () => { throw new Error("Fail"); },
      onError: errorHandler,
    });
    await lifecycleEngine.transition(makeState(), "installed");
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: "Fail" }),
      expect.any(Error),
    );
  });

  it("notifies listeners on event", async () => {
    const listener = vi.fn();
    const unsub = lifecycleEngine.onEvent(listener);
    await lifecycleEngine.transition(makeState(), "configured");
    expect(listener).toHaveBeenCalledWith("configured", expect.any(Object));
    unsub();
    listener.mockClear();
    await lifecycleEngine.transition(makeState(), "activated");
    expect(listener).not.toHaveBeenCalled();
  });

  it("getState returns stored state", async () => {
    const state = makeState({ installationId: 999 });
    await lifecycleEngine.transition(state, "installed");
    const retrieved = lifecycleEngine.getState(999);
    expect(retrieved).toBeDefined();
    expect(retrieved!.currentEvent).toBe("installed");
  });

  it("getState returns undefined for unknown id", () => {
    expect(lifecycleEngine.getState(-1)).toBeUndefined();
  });
});

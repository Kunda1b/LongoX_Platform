import type { ConnectorManifest } from "./manifest";
import { evaluateTrust } from "./trust";

export type ConnectorLifecycleEvent =
  | "installing"
  | "installed"
  | "configuring"
  | "configured"
  | "testing"
  | "tested"
  | "activated"
  | "executing"
  | "executed"
  | "polling"
  | "polled"
  | "webhook_received"
  | "webhook_processed"
  | "upgrading"
  | "upgraded"
  | "rolling_back"
  | "rolled_back"
  | "uninstalling"
  | "uninstalled"
  | "error";

export interface LifecycleState {
  installationId: number;
  connectorId: string;
  connectorName: string;
  tenantId: string;
  currentEvent: ConnectorLifecycleEvent;
  previousEvent: ConnectorLifecycleEvent | null;
  status: "installing" | "active" | "error" | "retired";
  version: string;
  config: Record<string, unknown>;
  errorMessage: string | null;
  eventHistory: { event: ConnectorLifecycleEvent; timestamp: string; details?: string }[];
}

export interface LifecycleHook {
  onBefore?(state: LifecycleState): Promise<LifecycleState>;
  onAfter?(state: LifecycleState): Promise<void>;
  onError?(state: LifecycleState, error: Error): Promise<void>;
}

type LifecycleListener = (event: ConnectorLifecycleEvent, state: LifecycleState) => void;

class LifecycleEngine {
  private hooks = new Map<ConnectorLifecycleEvent, LifecycleHook[]>();
  private listeners = new Set<LifecycleListener>();
  private states = new Map<number, LifecycleState>();

  registerHook(events: ConnectorLifecycleEvent[], hook: LifecycleHook): void {
    for (const event of events) {
      if (!this.hooks.has(event)) this.hooks.set(event, []);
      this.hooks.get(event)!.push(hook);
    }
  }

  onEvent(listener: LifecycleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async transition(
    state: LifecycleState,
    event: ConnectorLifecycleEvent,
    details?: string,
  ): Promise<LifecycleState> {
    const newState: LifecycleState = {
      ...state,
      previousEvent: state.currentEvent,
      currentEvent: event,
      errorMessage: null,
      eventHistory: [
        ...state.eventHistory,
        { event, timestamp: new Date().toISOString(), details },
      ],
    };

    const eventHooks = this.hooks.get(event) ?? [];
    try {
      for (const hook of eventHooks) {
        if (hook.onBefore) {
          await hook.onBefore(newState);
        }
      }
      for (const listener of this.listeners) {
        listener(event, newState);
      }
      for (const hook of eventHooks) {
        if (hook.onAfter) {
          await hook.onAfter(newState);
        }
      }
    } catch (err) {
      newState.currentEvent = "error";
      newState.status = "error";
      newState.errorMessage = err instanceof Error ? err.message : String(err);
      for (const hook of eventHooks) {
        if (hook.onError) {
          await hook.onError(newState, err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    if (event === "installed" || event === "configured" || event === "tested") {
      newState.status = "active";
    }
    if (event === "uninstalled") {
      newState.status = "retired";
    }

    this.states.set(newState.installationId, newState);
    return newState;
  }

  getState(installationId: number): LifecycleState | undefined {
    return this.states.get(installationId);
  }

  createInitialState(manifest: ConnectorManifest, tenantId: string): LifecycleState {
    return {
      installationId: "",
      connectorId: "",
      connectorName: manifest.name,
      tenantId,
      currentEvent: "installing",
      previousEvent: null,
      status: "installing",
      version: manifest.version,
      config: {},
      errorMessage: null,
      eventHistory: [{ event: "installing", timestamp: new Date().toISOString() }],
    };
  }
}

export const lifecycleEngine = new LifecycleEngine();

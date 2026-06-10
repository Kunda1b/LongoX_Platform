import type {
  ConnectorDefinition,
  ActionContext,
  ActionResult,
  TriggerContext,
  TriggerEvent,
} from "./types";

export interface ActionHandler {
  (context: ActionContext): Promise<ActionResult>;
}

export interface TriggerHandler {
  (context: TriggerContext): Promise<TriggerEvent[]>;
}

interface RegisteredAction {
  definition: {
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    idempotent: boolean;
  };
  handler: ActionHandler;
}

interface RegisteredTrigger {
  definition: {
    id: string;
    name: string;
    description: string;
    type: "webhook" | "polling" | "event";
    outputSchema: Record<string, unknown>;
  };
  handler: TriggerHandler;
}

class ConnectorRegistry {
  private connectors = new Map<string, ConnectorDefinition>();
  private actions = new Map<string, RegisteredAction>();
  private triggers = new Map<string, RegisteredTrigger>();

  register(definition: ConnectorDefinition): void {
    this.connectors.set(definition.name, definition);
  }

  registerAction(connectorName: string, action: RegisteredAction): void {
    this.actions.set(`${connectorName}.${action.definition.id}`, action);
  }

  registerTrigger(connectorName: string, trigger: RegisteredTrigger): void {
    this.triggers.set(`${connectorName}.${trigger.definition.id}`, trigger);
  }

  getConnector(name: string): ConnectorDefinition | undefined {
    return this.connectors.get(name);
  }

  getAction(fullId: string): ActionHandler | undefined {
    return this.actions.get(fullId)?.handler;
  }

  getTrigger(fullId: string): TriggerHandler | undefined {
    return this.triggers.get(fullId)?.handler;
  }

  async executeAction(
    fullId: string,
    context: ActionContext,
  ): Promise<ActionResult> {
    const handler = this.actions.get(fullId)?.handler;
    if (!handler) {
      return {
        success: false,
        data: {},
        error: `Action "${fullId}" not found`,
        durationMs: 0,
      };
    }
    const start = Date.now();
    try {
      const result = await handler(context);
      return { ...result, durationMs: Date.now() - start };
    } catch (err) {
      return {
        success: false,
        data: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }

  async executeTrigger(
    fullId: string,
    context: TriggerContext,
  ): Promise<TriggerEvent[]> {
    const handler = this.triggers.get(fullId)?.handler;
    if (!handler) return [];
    try {
      return await handler(context);
    } catch {
      return [];
    }
  }

  listConnectors(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }

  listActions(): string[] {
    return Array.from(this.actions.keys());
  }

  listTriggers(): string[] {
    return Array.from(this.triggers.keys());
  }
}

export const connectorRegistry = new ConnectorRegistry();

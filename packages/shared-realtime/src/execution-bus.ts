import { EventEmitter } from "node:events";

export interface ExecutionEventPayload {
  executionId: number;
  eventType: string;
  data: Record<string, unknown>;
}

const bus = new EventEmitter();
bus.setMaxListeners(1000);

export const sseExecutionBus = {
  onExecutionEvent: (
    executionId: number,
    handler: (payload: ExecutionEventPayload) => void,
  ): (() => void) => {
    const wrapped = (payload: ExecutionEventPayload) => {
      if (payload.executionId === executionId) {
        handler(payload);
      }
    };
    bus.on("execution-event", wrapped);
    return () => {
      bus.off("execution-event", wrapped);
    };
  },

  broadcast: (payload: ExecutionEventPayload): void => {
    bus.emit("execution-event", payload);
  },

  removeAllListeners: (): void => {
    bus.removeAllListeners("execution-event");
  },
};

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { PlatformEventType } from "@autoflow/shared-events";

interface ExecutionUpdate {
  executionId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  nodeId?: string;
  nodeStatus?: string;
  progress?: number;
  message?: string;
  timestamp: string;
}

type EventCallback = (event: RealtimeEvent) => void;

interface RealtimeEvent {
  type: PlatformEventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface UseRealtimeOptions {
  executionId?: string;
  onExecutionUpdate?: (update: ExecutionUpdate) => void;
  onEvent?: EventCallback;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { token } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef(options);

  callbacksRef.current = options;

  useEffect(() => {
    if (!token || options.enabled === false) return;

    const baseUrl = import.meta.env["VITE_API_URL"] ?? "/api";
    const url = options.executionId
      ? `${baseUrl}/realtime/executions/${options.executionId}`
      : `${baseUrl}/realtime/events`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      setConnected(true);
    });

    es.addEventListener("event", (e: MessageEvent) => {
      try {
        const event: RealtimeEvent = JSON.parse(e.data);
        callbacksRef.current.onEvent?.(event);

        if (
          event.type.startsWith("execution.") &&
          callbacksRef.current.onExecutionUpdate
        ) {
          callbacksRef.current.onExecutionUpdate({
            executionId: event.aggregateId,
            status: event.type.replace("execution.", "") as ExecutionUpdate["status"],
            ...event.payload,
            timestamp: event.timestamp,
          } as ExecutionUpdate);
        }
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    es.onopen = () => {
      setConnected(true);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [token, options.executionId, options.enabled]);

  const close = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnected(false);
  }, []);

  return { connected, close };
}

export function useExecutionRealtime(
  executionId: string,
  onUpdate: (update: ExecutionUpdate) => void,
) {
  return useRealtime({ executionId, onExecutionUpdate: onUpdate });
}

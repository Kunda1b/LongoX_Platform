import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Execution {
  id: string;
  workflowId: string;
  workflowVersionId: string;
  status: string;
  triggerType: string;
  startedAt: string;
  finishedAt: string | null;
  checkpoints?: ExecutionCheckpoint[];
}

interface ExecutionCheckpoint {
  executionId: string;
  nodeId: string;
  nodeName: string;
  status: string;
  attemptNumber: number;
  startedAt: string;
  completedAt: string | null;
}

interface ExecutionStreamEvent {
  type: "execution" | "node" | "approval" | "dlq";
  data: Record<string, unknown>;
}

type SseStatus = "disconnected" | "connecting" | "connected" | "error";

export function useExecution(executionId?: string) {
  const queryClient = useQueryClient();
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<SseStatus>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useQuery({
    queryKey: ["execution", executionId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/executions/${executionId}`);
      return response.data;
    },
    enabled: !!executionId,
  });

  useEffect(() => {
    if (!executionId) return;

    const token = localStorage.getItem("access_token");
    const url = `/api/v1/executions/${executionId}/stream?token=${encodeURIComponent(token ?? "")}`;

    setSseStatus("connecting");
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseStatus("connected");
    };

    es.addEventListener("execution", (event) => {
      try {
        const parsed: ExecutionStreamEvent = JSON.parse(event.data);
        if (parsed.data?.status) {
          setLiveStatus(parsed.data.status as string);
        }
        queryClient.invalidateQueries({ queryKey: ["execution", executionId] });
      } catch {
        /* ignore parse errors */
      }
    });

    es.addEventListener("node", (event) => {
      queryClient.invalidateQueries({ queryKey: ["execution", executionId] });
    });

    es.onerror = () => {
      setSseStatus("error");
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setSseStatus("disconnected");
    };
  }, [executionId, queryClient]);

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setSseStatus("disconnected");
  }, []);

  return {
    execution: query.data,
    isLoading: query.isLoading,
    error: query.error,
    liveStatus,
    sseStatus,
    closeStream,
    refetch: query.refetch,
  };
}

export function useExecutions(workflowId?: string) {
  const query = useQuery({
    queryKey: ["executions", workflowId],
    queryFn: async () => {
      const params = workflowId ? { workflowId } : {};
      const response = await apiClient.get("/api/v1/executions", { params });
      return response.data;
    },
  });

  return {
    executions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

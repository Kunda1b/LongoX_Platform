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

/**
 * P1-20: SSE via fetch() + ReadableStream instead of native EventSource.
 *
 * The browser's native `EventSource` API does NOT support custom request
 * headers — so it can't send `Authorization: Bearer <jwt>`. Our gateway
 * requires that header for the executions stream (the old `?token=` query
 * fallback was deprecated because URL-embedded tokens leak into server
 * access logs).
 *
 * This helper opens an SSE connection via `fetch()` with the bearer token
 * in the `Authorization` header, then parses the SSE text frames out of
 * the response body's `ReadableStream` manually. The shape of the parsed
 * events mirrors what `EventSource.addEventListener(eventName, ...)` would
 * deliver (`{ event, data, id }`).
 */
interface ParsedSseEvent {
  event: string;
  data: string;
  id?: string;
}

async function openSseStreamWithAuth(opts: {
  url: string;
  token: string | null;
  onEvent: (event: ParsedSseEvent) => void;
  onOpen: () => void;
  onError: (err: unknown) => void;
}): Promise<() => void> {
  const controller = new AbortController();
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  };
  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let decoder = new TextDecoder();
  let buffer = "";
  // SSE frames are separated by a blank line. A single frame may carry
  // multiple `event:`, `data:`, `id:` lines that all belong together.
  let currentEvent = "";
  let currentData = "";
  let currentId: string | undefined;

  const dispatchFrame = () => {
    const trimmedData = currentData.replace(/\n$/, "");
    if (currentEvent || trimmedData) {
      opts.onEvent({
        event: currentEvent || "message",
        data: trimmedData,
        id: currentId,
      });
    }
    currentEvent = "";
    currentData = "";
    currentId = undefined;
  };

  try {
    const response = await fetch(opts.url, {
      method: "GET",
      headers,
      signal: controller.signal,
      credentials: "include",
    });
    if (!response.ok || !response.body) {
      throw new Error(
        `SSE connection failed: ${response.status} ${response.statusText}`,
      );
    }
    opts.onOpen();
    reader = response.body.getReader();

    // Read loop — runs until the server closes the stream or the consumer
    // aborts via the controller.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      // SSE frames are separated by `\n\n`. Process all complete frames in
      // the buffer; whatever's left (partial frame) stays for the next read.
      while ((newlineIndex = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);

        // Lines starting with `:` are comments (heartbeats) — skip them.
        const lines = frame.split("\n");
        for (const rawLine of lines) {
          if (rawLine.startsWith(":")) continue;
          const colon = rawLine.indexOf(":");
          if (colon < 0) continue;
          const field = rawLine.slice(0, colon);
          // Per the SSE spec, a leading space after the colon is stripped.
          const valuePart = rawLine.slice(colon + 1).replace(/^ /, "");
          if (field === "event") {
            currentEvent = valuePart;
          } else if (field === "data") {
            currentData += (currentData ? "\n" : "") + valuePart;
          } else if (field === "id") {
            currentId = valuePart;
          }
          // `retry` is ignored — we don't auto-reconnect via the SSE retry
          // directive; React re-runs this effect on unmount/remount.
        }
        dispatchFrame();
      }
    }
  } catch (err) {
    // AbortError is expected on cleanup — don't surface as an error.
    if ((err as Error)?.name !== "AbortError") {
      opts.onError(err);
    }
  } finally {
    if (reader) {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }
  }

  // Return a cleanup function that aborts the in-flight request.
  return () => {
    controller.abort();
  };
}

export function useExecution(executionId?: string) {
  const queryClient = useQueryClient();
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<SseStatus>("disconnected");
  const cleanupRef = useRef<(() => void) | null>(null);

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
    const url = `/api/v1/executions/${executionId}/stream`;

    setSseStatus("connecting");
    let cancelled = false;

    void openSseStreamWithAuth({
      url,
      token,
      onOpen: () => {
        if (!cancelled) setSseStatus("connected");
      },
      onError: () => {
        if (!cancelled) setSseStatus("error");
      },
      onEvent: (event) => {
        if (cancelled) return;
        // Heartbeat / keepalive comments never reach here (filtered above).
        // Skip the `connected`/`retry` control events that don't carry
        // JSON data.
        if (!event.data) return;
        try {
          const parsed: ExecutionStreamEvent = JSON.parse(event.data);
          if (event.event === "execution" && parsed.data?.status) {
            setLiveStatus(parsed.data.status as string);
          }
          if (
            event.event === "execution" ||
            event.event === "node" ||
            event.event === "approval" ||
            event.event === "dlq"
          ) {
            queryClient.invalidateQueries({
              queryKey: ["execution", executionId],
            });
          }
        } catch {
          /* ignore parse errors */
        }
      },
    }).then((cleanup) => {
      cleanupRef.current = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      setSseStatus("disconnected");
    };
  }, [executionId, queryClient]);

  const closeStream = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
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

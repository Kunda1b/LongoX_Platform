export interface AiRunRequest {
  provider?: string;
  model: string;
  promptId?: string;
  promptVersion?: number;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  knowledgeBaseId?: string;
  ragOptions?: {
    topK: number;
    minScore: number;
    includeCitations: boolean;
  };
  guardrailIds?: number[];
  traceId?: string;
  idempotencyKey?: string;
  stream?: boolean;
}

export interface AiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCalls?: AiToolCall[];
  toolCallId?: string;
}

export interface AiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AiRunResponse {
  runId: string;
  provider: string;
  model: string;
  promptId?: string;
  promptVersion?: number;
  messages: AiMessage[];
  content: string;
  guardrailResults: AiGuardrailResult[];
  usage: AiTokenUsage;
  cost: number;
  currency: string;
  citations?: AiRagCitation[];
  traceId: string;
  streamId?: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface AiTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptTokensDetails?: {
    cachedTokens?: number;
    audioTokens?: number;
  };
  completionTokensDetails?: {
    audioTokens?: number;
    reasoningTokens?: number;
  };
}

export interface AiGuardrailResult {
  guardrailId: number;
  guardrailName: string;
  guardrailType: string;
  passed: boolean;
  violations: AiGuardrailViolation[];
  blocked: boolean;
}

export interface AiGuardrailViolation {
  type: string;
  detail: string;
  severity: "low" | "medium" | "high";
  matchedContent?: string;
  category?: string;
}

export interface AiRagCitation {
  documentId: string;
  documentName: string;
  chunkId: number;
  chunkContent: string;
  score: number;
  source: string;
  pageNumber?: number;
  metadata?: Record<string, unknown>;
}

export interface AiStreamEvent {
  event: "chunk" | "done" | "error" | "guardrail" | "citation";
  data: string;
  id?: string;
  retry?: number;
}

export interface AiStreamChunk {
  index: number;
  delta: string;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls";
}

export interface AiRunFilters {
  status?: string;
  provider?: string;
  model?: string;
  promptId?: string;
  fromDate?: string;
  toDate?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}

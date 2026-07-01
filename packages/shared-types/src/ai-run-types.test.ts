import { describe, it, expect } from "vitest";
import type {
  AiRunRequest,
  AiRunResponse,
  AiTokenUsage,
  AiGuardrailResult,
  AiRagCitation,
  AiStreamEvent,
  AiStreamChunk,
  AiRunFilters,
} from "./ai-run-types";

describe("AiRunRequest", () => {
  it("accepts a minimal request", () => {
    const req: AiRunRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
    };
    expect(req.model).toBe("gpt-4");
    expect(req.messages).toHaveLength(1);
  });

  it("accepts a full request with all fields", () => {
    const req: AiRunRequest = {
      provider: "openai",
      model: "gpt-4",
      promptId: 1,
      promptVersion: 2,
      messages: [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hi" },
      ],
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      stop: ["\n"],
      knowledgeBaseId: 42,
      ragOptions: { topK: 5, minScore: 0.7, includeCitations: true },
      guardrailIds: [1, 2],
      traceId: "trace-abc",
      idempotencyKey: "idem-1",
      stream: false,
    };
    expect(req.provider).toBe("openai");
    expect(req.ragOptions?.topK).toBe(5);
    expect(req.guardrailIds).toHaveLength(2);
  });

  it("supports tool calls in messages", () => {
    const req: AiRunRequest = {
      model: "gpt-4",
      messages: [
        {
          role: "assistant",
          content: "",
          toolCalls: [{
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"London"}' },
          }],
        },
      ],
    };
    expect(req.messages[0].toolCalls).toHaveLength(1);
    expect(req.messages[0].toolCalls![0].function.name).toBe("get_weather");
  });
});

describe("AiRunResponse", () => {
  it("contains all required fields", () => {
    const resp: AiRunResponse = {
      runId: "run-1",
      provider: "openai",
      model: "gpt-4",
      messages: [{ role: "assistant", content: "Hello!" }],
      content: "Hello!",
      guardrailResults: [],
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      cost: 0.002,
      currency: "USD",
      traceId: "trace-abc",
      durationMs: 1500,
      startedAt: "2024-01-01T00:00:00Z",
      completedAt: "2024-01-01T00:00:01Z",
    };
    expect(resp.runId).toBeTruthy();
    expect(resp.cost).toBeGreaterThan(0);
    expect(resp.usage.totalTokens).toBe(30);
  });

  it("includes optional citations", () => {
    const resp: AiRunResponse = {
      runId: "run-2",
      provider: "openai",
      model: "gpt-4",
      messages: [],
      content: "Based on docs...",
      guardrailResults: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      cost: 0,
      currency: "USD",
      citations: [{
        documentId: 1,
        documentName: "doc.pdf",
        chunkId: 10,
        chunkContent: "Important info",
        score: 0.95,
        source: "s3://bucket/doc.pdf",
      }],
      traceId: "trace-xyz",
      durationMs: 500,
      startedAt: "",
      completedAt: "",
    };
    expect(resp.citations).toHaveLength(1);
    expect(resp.citations![0].score).toBe(0.95);
  });
});

describe("AiTokenUsage", () => {
  it("supports detailed token breakdown", () => {
    const usage: AiTokenUsage = {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      promptTokensDetails: { cachedTokens: 20, audioTokens: 0 },
      completionTokensDetails: { reasoningTokens: 10 },
    };
    expect(usage.promptTokensDetails?.cachedTokens).toBe(20);
    expect(usage.completionTokensDetails?.reasoningTokens).toBe(10);
  });
});

describe("AiGuardrailResult", () => {
  it("supports violations", () => {
    const result: AiGuardrailResult = {
      guardrailId: 1,
      guardrailName: "PII Filter",
      guardrailType: "pii",
      passed: false,
      violations: [{
        type: "email",
        detail: "Email detected",
        severity: "high",
        matchedContent: "test@test.com",
        category: "pii",
      }],
      blocked: true,
    };
    expect(result.passed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.violations[0].severity).toBe("high");
  });

  it("supports passed guardrail", () => {
    const result: AiGuardrailResult = {
      guardrailId: 2,
      guardrailName: "Keyword Filter",
      guardrailType: "keyword",
      passed: true,
      violations: [],
      blocked: false,
    };
    expect(result.passed).toBe(true);
  });
});

describe("AiRagCitation", () => {
  it("supports metadata", () => {
    const citation: AiRagCitation = {
      documentId: 1,
      documentName: "report.pdf",
      chunkId: 5,
      chunkContent: "Content here",
      score: 0.88,
      source: "s3://bucket/",
      pageNumber: 3,
      metadata: { author: "John", date: "2024-01-01" },
    };
    expect(citation.pageNumber).toBe(3);
    expect(citation.metadata?.author).toBe("John");
  });
});

describe("AiStreamEvent", () => {
  it("supports all event types", () => {
    const events: AiStreamEvent[] = [
      { event: "chunk", data: "Hello" },
      { event: "done", data: "[DONE]" },
      { event: "error", data: "Error message" },
      { event: "guardrail", data: "Blocked" },
      { event: "citation", data: "doc-id" },
    ];
    expect(events).toHaveLength(5);
  });
});

describe("AiStreamChunk", () => {
  it("supports finish reason", () => {
    const chunk: AiStreamChunk = {
      index: 0,
      delta: "Hello",
      finishReason: "stop",
    };
    expect(chunk.finishReason).toBe("stop");
  });

  it("supports all finish reasons", () => {
    const reasons: AiStreamChunk["finishReason"][] = ["stop", "length", "content_filter", "tool_calls"];
    for (const reason of reasons) {
      const chunk: AiStreamChunk = { index: 0, delta: "", finishReason: reason };
      expect(chunk.finishReason).toBe(reason);
    }
  });
});

describe("AiRunFilters", () => {
  it("supports all filter options", () => {
    const filters: AiRunFilters = {
      status: "completed",
      provider: "openai",
      model: "gpt-4",
      promptId: 1,
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      tenantId: 42,
      limit: 20,
      offset: 0,
    };
    expect(filters.status).toBe("completed");
    expect(filters.limit).toBe(20);
  });
});

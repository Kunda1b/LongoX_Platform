import type { SdkConfig } from "../index.ts";
import type { WorkflowDefinition } from "../workflow-sdk/index.ts";

export interface TestingConfig extends SdkConfig {}

export interface TestCase {
  id: string;
  name: string;
  workflowId: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
  expectedStatus?: "completed" | "failed";
}

export interface TestRun {
  id: string;
  testCaseId: string;
  executionId: string;
  status: "running" | "passed" | "failed";
  actualOutput?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface TestSuiteResult {
  testCaseId: string;
  name: string;
  status: "passed" | "failed" | "error";
  durationMs: number;
  error?: string;
}

export class TestingClient {
  private config: TestingConfig;

  constructor(config: TestingConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.token) h["Authorization"] = `Bearer ${this.config.token}`;
    if (this.config.apiKey) h["X-Api-Key"] = this.config.apiKey;
    return h;
  }

  async createTestCase(testCase: Omit<TestCase, "id">): Promise<TestCase> {
    const res = await fetch(`${this.config.baseUrl}/api/testing/test-cases`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(testCase),
    });
    if (!res.ok) throw new Error("Failed to create test case");
    return res.json() as Promise<TestCase>;
  }

  async runTestCase(testCaseId: string): Promise<TestRun> {
    const res = await fetch(
      `${this.config.baseUrl}/api/testing/test-cases/${testCaseId}/run`,
      {
        method: "POST",
        headers: this.headers(),
      },
    );
    if (!res.ok) throw new Error("Test run failed");
    return res.json() as Promise<TestRun>;
  }

  async runSuite(workflowId: string): Promise<TestSuiteResult[]> {
    const res = await fetch(
      `${this.config.baseUrl}/api/testing/suites/${workflowId}/run`,
      {
        method: "POST",
        headers: this.headers(),
      },
    );
    if (!res.ok) throw new Error("Test suite run failed");
    return res.json() as Promise<TestSuiteResult[]>;
  }

  simulate(
    workflow: WorkflowDefinition,
    input: Record<string, unknown>,
  ): Promise<{ steps: unknown[]; output: Record<string, unknown> }> {
    return Promise.resolve({ steps: [], output: {} });
  }
}

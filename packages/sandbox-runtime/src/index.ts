import {
  DenoIsolate,
  UNTRUSTED_CONNECTOR_POLICY,
  type IsolateContext,
} from "@longox/connector-sandbox";

export type SandboxPolicy = {
  allowedModules: string[];
  allowedApis: string[];
  maxCpuMs: number;
  maxMemoryMb: number;
  maxNetworkRequests: number;
  timeoutMs: number;
};

export interface SandboxConfig {
  policy: SandboxPolicy;
  environment: Record<string, string>;
  workingDirectory?: string;
}

export interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  error?: string;
}

/**
 * ADR-009: Delegates untrusted code execution to Deno isolates via connector-sandbox.
 * Replaces the prior in-process `new Function()` path which lacked isolate boundaries.
 */
export class SandboxRuntime {
  private config: SandboxConfig;
  private isolate: DenoIsolate;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.isolate = new DenoIsolate({
      ...UNTRUSTED_CONNECTOR_POLICY,
      maxCpuMs: config.policy.maxCpuMs,
      maxMemoryMb: config.policy.maxMemoryMb,
      maxNetworkRequests: config.policy.maxNetworkRequests,
      timeoutMs: config.policy.timeoutMs,
    });
  }

  async execute(
    code: string,
    context: Record<string, unknown>,
  ): Promise<SandboxResult> {
    const isolateContext: IsolateContext = {
      connectorName: "sandbox-runtime",
      actionId: "execute",
      executionId: `sandbox-${Date.now()}`,
      tenantId: String(context.tenantId ?? ""),
      auth: (context.auth as Record<string, unknown>) ?? {},
      input: context,
      config: { environment: this.config.environment },
      secrets: (context.secrets as Record<string, string>) ?? {},
      code,
    };

    const result = await this.isolate.execute(isolateContext);
    const stdout =
      typeof result.data.output === "string"
        ? result.data.output
        : JSON.stringify(result.data);

    return {
      success: result.success,
      stdout,
      stderr: result.error ?? "",
      exitCode: result.success ? 0 : 1,
      durationMs: result.durationMs,
      error: result.error ?? undefined,
    };
  }

  async validate(code: string): Promise<{ valid: boolean; errors: string[] }> {
    if (!code.trim()) {
      return { valid: false, errors: ["Code must not be empty"] };
    }
    return { valid: true, errors: [] };
  }
}

export function createSandbox(config: SandboxConfig): SandboxRuntime {
  return new SandboxRuntime(config);
}

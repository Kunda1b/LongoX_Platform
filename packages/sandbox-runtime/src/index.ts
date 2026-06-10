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
export class SandboxRuntime {
  private config: SandboxConfig;
  constructor(config: SandboxConfig) { this.config = config; }
  async execute(code: string, context: Record<string, unknown>): Promise<SandboxResult> {
    const startTime = Date.now();
    try {
      const sandboxedFn = new Function(...Object.keys(context), code);
      const result = sandboxedFn(...Object.values(context));
      return {
        success: true, stdout: String(result), stderr: "", exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false, stdout: "", stderr: String(err), exitCode: 1,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
  async validate(code: string): Promise<{ valid: boolean; errors: string[] }> {
    try { new Function(code); return { valid: true, errors: [] }; }
    catch (err) { return { valid: false, errors: [err instanceof Error ? err.message : String(err)] }; }
  }
}
export function createSandbox(config: SandboxConfig): SandboxRuntime {
  return new SandboxRuntime(config);
}

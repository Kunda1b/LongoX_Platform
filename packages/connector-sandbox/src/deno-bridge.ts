import type { SandboxPolicy } from "./policy";
import type { AuditLogger } from "./audit";
import { auditLogger } from "./audit";
import type { IsolateContext, IsolateResult } from "./isolate";

export interface DenoRuntimeConfig {
  denoPath?: string;
  cacheDir?: string;
  enableCache?: boolean;
  v8Flags?: string[];
}

const DEFAULT_CONFIG: DenoRuntimeConfig = {
  denoPath: "deno",
  cacheDir: ".deno-cache",
  enableCache: true,
  v8Flags: ["--max-old-space-size=128"],
};

export class DenoBridge {
  private config: DenoRuntimeConfig;
  private policy: SandboxPolicy;
  private audit: AuditLogger;

  constructor(
    policy: SandboxPolicy,
    config?: Partial<DenoRuntimeConfig>,
    audit?: AuditLogger,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.policy = policy;
    this.audit = audit ?? auditLogger;
  }

  async execute(context: IsolateContext): Promise<IsolateResult> {
    const startTime = Date.now();
    try {
      return await this.executeAsSubprocess(context, startTime);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        data: {},
        error: err instanceof Error ? err.message : String(err),
        durationMs,
        networkRequests: 0,
        peakMemoryMb: 0,
        cpuUsedMs: 0,
      };
    }
  }

  private async executeAsSubprocess(
    context: IsolateContext,
    startTime: number,
  ): Promise<IsolateResult> {
    const { execFile } = await import("node:child_process");
    const { writeFile, mkdtemp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");

    const tmpDir = await mkdtemp(join(tmpdir(), "deno-sandbox-"));
    const scriptPath = join(tmpDir, "sandbox.ts");
    const entryPoint = join(tmpDir, "main.ts");

    function safeStringify(obj: unknown, fallback: string = "null"): string {
      try {
        return JSON.stringify(obj);
      } catch {
        return fallback;
      }
    }

    const wrappedCode = `
const auth = ${safeStringify(context.auth)};
const input = ${safeStringify(context.input)};
const config = ${safeStringify(context.config)};

${context.code}
`;

    await writeFile(scriptPath, context.code);
    await writeFile(entryPoint, wrappedCode);

    return new Promise<IsolateResult>((resolve) => {
      const denoArgs = [
        "run",
        "--no-prompt",
        "--deny-read",
        "--deny-write",
        "--deny-env",
        "--deny-run",
        `--v8-flags=${this.config.v8Flags!.join(",")}`,
        "--quiet",
      ];

      if (
        this.policy.allowedDomains.length > 0 &&
        this.policy.allowedDomains[0] !== "*"
      ) {
        denoArgs.push(`--allow-net=${this.policy.allowedDomains.join(",")}`);
      }

      denoArgs.push(entryPoint);

      const proc = execFile(
        this.config.denoPath!,
        denoArgs,
        {
          timeout: this.policy.timeoutMs,
          maxBuffer: 1024 * 1024,
          env: { SANDBOX_TENANT_ID: String(context.tenantId) },
        },
        (err, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          rm(tmpDir, { recursive: true, force: true }).catch(() => {});

          if (err) {
            resolve({
              success: false,
              data: {},
              error: stderr || err.message,
              durationMs,
              networkRequests: 0,
              peakMemoryMb: 0,
              cpuUsedMs: 0,
            });
          } else {
            try {
              const data = JSON.parse(stdout);
              resolve({
                success: true,
                data: data as Record<string, unknown>,
                error: null,
                durationMs,
                networkRequests: 0,
                peakMemoryMb: 0,
                cpuUsedMs: 0,
              });
            } catch {
              resolve({
                success: true,
                data: { output: stdout },
                error: null,
                durationMs,
                networkRequests: 0,
                peakMemoryMb: 0,
                cpuUsedMs: 0,
              });
            }
          }
        },
      );
    });
  }

  getConfig(): DenoRuntimeConfig {
    return { ...this.config };
  }
}

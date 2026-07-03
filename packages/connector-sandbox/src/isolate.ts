import type { SandboxPolicy, PermissionOp } from "./policy";
import { reducePolicyForAction, validatePolicy } from "./policy";
import type { AuditLogger } from "./audit";
import { auditLogger } from "./audit";
import { DenoBridge } from "./deno-bridge";
import type { DenoRuntimeConfig } from "./deno-bridge";

export interface IsolateContext {
  connectorName: string;
  actionId: string;
  executionId: string;
  tenantId: number;
  auth: Record<string, unknown>;
  input: Record<string, unknown>;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
  code: string;
}

export interface IsolateResult {
  success: boolean;
  data: Record<string, unknown>;
  error: string | null;
  durationMs: number;
  networkRequests: number;
  peakMemoryMb: number;
  cpuUsedMs: number;
}

export interface IsolateMetrics {
  executionId: string;
  durationMs: number;
  networkRequests: number;
  peakMemoryMb: number;
  cpuUsedMs: number;
  startTime: number;
  endTime: number;
}

export class DenoIsolate {
  private policy: SandboxPolicy;
  private audit: AuditLogger;
  private bridge: DenoBridge;
  private networkRequestCount = 0;
  private metrics: IsolateMetrics | null = null;

  constructor(
    policy: SandboxPolicy,
    config?: Partial<DenoRuntimeConfig>,
    audit?: AuditLogger,
  ) {
    const errors = validatePolicy(policy);
    if (errors.length > 0) {
      throw new Error(`Invalid sandbox policy: ${errors.join("; ")}`);
    }
    this.policy = policy;
    this.audit = audit ?? auditLogger;
    this.bridge = new DenoBridge(policy, config, this.audit);
  }

  async execute(context: IsolateContext): Promise<IsolateResult> {
    const startTime = Date.now();
    const actionPolicy = reducePolicyForAction(
      this.policy,
      this.resolveRequiredOps(context),
      this.resolveTargetDomains(context),
    );

    this.networkRequestCount = 0;

    try {
      const result = await this.bridge.execute(context);
      const durationMs = Date.now() - startTime;

      this.audit.record({
        timestamp: new Date().toISOString(),
        sandboxId: context.executionId || "unknown",
        connectorName: context.connectorName,
        executionId: context.executionId || "unknown",
        actionId: context.actionId,
        tenantId: context.tenantId,
        policy: {
          maxCpuMs: actionPolicy.maxCpuMs,
          maxMemoryMb: actionPolicy.maxMemoryMb,
          timeoutMs: actionPolicy.timeoutMs,
          maxNetworkRequests: actionPolicy.maxNetworkRequests,
          allowedDomainsCount: actionPolicy.allowedDomains.length,
        },
        result: result.success ? "allowed" : "error",
        reason: result.error ?? undefined,
        durationMs,
        networkRequests: this.networkRequestCount,
        peakMemoryMb: result.peakMemoryMb,
        cpuUsedMs: result.cpuUsedMs,
      });

      return result;
    } catch (err) {
      return this.handleError(context, actionPolicy, startTime, err);
    }
  }

  private handleError(
    context: IsolateContext,
    actionPolicy: SandboxPolicy,
    startTime: number,
    err: unknown,
  ): IsolateResult {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: {},
      error: errorMsg,
      durationMs,
      networkRequests: 0,
      peakMemoryMb: 0,
      cpuUsedMs: 0,
    };
  }

  private resolveRequiredOps(context: IsolateContext): PermissionOp[] {
    const ops: PermissionOp[] = ["net:allow"];
    const config = context.config ?? {};
    if ((config as any).readPaths) ops.push("read:allow");
    if ((config as any).writePaths) ops.push("write:allow");
    if ((config as any).envVars) ops.push("env:allow");
    return ops;
  }

  private resolveTargetDomains(context: IsolateContext): string[] {
    const config = context.config ?? {};
    const domains = (config as any).allowedDomains;
    if (Array.isArray(domains) && domains.length > 0) return domains;
    return ["*"];
  }

  getMetrics(): IsolateMetrics | null {
    return this.metrics;
  }

  getPolicy(): SandboxPolicy {
    return { ...this.policy };
  }
}

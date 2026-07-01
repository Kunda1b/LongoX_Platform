import type { SandboxPolicy, PermissionOp } from "./policy";
import { reducePolicyForAction, validatePolicy } from "./policy";
import type { AuditLogger } from "./audit";
import { auditLogger } from "./audit";
import { randomUUID } from "crypto";
import vm from "vm";

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

const DENO_COMPAT_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "content-length",
  "user-agent",
  "x-request-id",
  "x-correlation-id",
  "x-api-key",
];

function isAllowedUrl(url: string, allowedDomains: string[]): boolean {
  if (allowedDomains.includes("*")) return true;
  try {
    const parsed = new URL(url);
    return allowedDomains.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

export class DenoIsolate {
  private policy: SandboxPolicy;
  private audit: AuditLogger;
  private networkRequestCount = 0;
  private metrics: IsolateMetrics | null = null;

  constructor(policy: SandboxPolicy, audit?: AuditLogger) {
    const errors = validatePolicy(policy);
    if (errors.length > 0) {
      throw new Error(`Invalid sandbox policy: ${errors.join("; ")}`);
    }
    this.policy = policy;
    this.audit = audit ?? auditLogger;
  }

  async execute(context: IsolateContext): Promise<IsolateResult> {
    const id = context.executionId || randomUUID();
    const startTime = Date.now();
    const actionPolicy = reducePolicyForAction(
      this.policy,
      this.resolveRequiredOps(context),
      this.resolveTargetDomains(context),
    );

    this.networkRequestCount = 0;
    const peakMemory = { value: 0 };
    const cpuUsed = { value: 0 };

    const compatFetch = this.createCompatFetch(
      actionPolicy,
      context,
      peakMemory,
      cpuUsed,
    );
    const compatCrypto = this.createCompatCrypto();
    const compatStreams = this.createCompatStreams();
    const compatConsole = this.createCompatConsole(context);

    try {
      const sandbox: Record<string, unknown> = {
        fetch: compatFetch,
        crypto: compatCrypto,
        TextEncoder: globalThis.TextEncoder,
        TextDecoder: globalThis.TextDecoder,
        ReadableStream: compatStreams.ReadableStream,
        WritableStream: compatStreams.WritableStream,
        TransformStream: compatStreams.TransformStream,
        console: compatConsole,
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        JSON: globalThis.JSON,
        Math: globalThis.Math,
        Date: globalThis.Date,
        Array: globalThis.Array,
        Object: globalThis.Object,
        String: globalThis.String,
        Number: globalThis.Number,
        Boolean: globalThis.Boolean,
        Map: globalThis.Map,
        Set: globalThis.Set,
        Promise: globalThis.Promise,
        Error: globalThis.Error,
        URL: globalThis.URL,
        URLSearchParams: globalThis.URLSearchParams,
        AbortController: globalThis.AbortController,
        AbortSignal: globalThis.AbortSignal,
        auth: context.auth,
        input: context.input,
        config: context.config,
        secrets: context.secrets,
      };

      const script = new vm.Script(
        `(async () => { ${context.code} })()`,
        { filename: `sandbox-${id}.js` },
      );

      const timeoutMs = actionPolicy.timeoutMs;
      const promiseFromVm = script.runInNewContext(sandbox, {
        timeout: timeoutMs,
        breakOnSigint: true,
      }) as Promise<unknown>;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs),
      );

      const rawResult = await Promise.race([promiseFromVm, timeoutPromise]);

      const durationMs = Date.now() - startTime;
      const result: IsolateResult = {
        success: true,
        data: (rawResult as Record<string, unknown>) ?? {},
        error: null,
        durationMs,
        networkRequests: this.networkRequestCount,
        peakMemoryMb: Math.ceil(peakMemory.value / (1024 * 1024)),
        cpuUsedMs: cpuUsed.value,
      };

      this.audit.record({
        timestamp: new Date().toISOString(),
        sandboxId: id,
        connectorName: context.connectorName,
        executionId: id,
        actionId: context.actionId,
        tenantId: context.tenantId,
        policy: {
          maxCpuMs: actionPolicy.maxCpuMs,
          maxMemoryMb: actionPolicy.maxMemoryMb,
          timeoutMs: actionPolicy.timeoutMs,
          maxNetworkRequests: actionPolicy.maxNetworkRequests,
          allowedDomainsCount: actionPolicy.allowedDomains.length,
        },
        result: "allowed",
        durationMs,
        networkRequests: this.networkRequestCount,
        peakMemoryMb: Math.ceil(peakMemory.value / (1024 * 1024)),
        cpuUsedMs: cpuUsed.value,
      });

      return result;
    } catch (err) {
      return this.handleError(id, context, actionPolicy, startTime, err, peakMemory, cpuUsed);
    }
  }

  private handleError(
    id: string,
    context: IsolateContext,
    actionPolicy: SandboxPolicy,
    startTime: number,
    err: unknown,
    _peakMemory: { value: number },
    _cpuUsed: { value: number },
  ): IsolateResult {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    this.audit.record({
      timestamp: new Date().toISOString(),
      sandboxId: id,
      connectorName: context.connectorName,
      executionId: id,
      actionId: context.actionId,
      tenantId: context.tenantId,
      policy: {
        maxCpuMs: actionPolicy.maxCpuMs,
        maxMemoryMb: actionPolicy.maxMemoryMb,
        timeoutMs: actionPolicy.timeoutMs,
        maxNetworkRequests: actionPolicy.maxNetworkRequests,
        allowedDomainsCount: actionPolicy.allowedDomains.length,
      },
      result: "error",
      reason: errorMsg,
      durationMs,
      networkRequests: this.networkRequestCount,
      peakMemoryMb: 0,
      cpuUsedMs: 0,
    });

    return {
      success: false,
      data: {},
      error: errorMsg,
      durationMs,
      networkRequests: this.networkRequestCount,
      peakMemoryMb: 0,
      cpuUsedMs: 0,
    };
  }

  private createCompatFetch(
    policy: SandboxPolicy,
    context: IsolateContext,
    peakMemory: { value: number },
    cpuUsed: { value: number },
  ): typeof globalThis.fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      if (this.networkRequestCount >= policy.maxNetworkRequests) {
        throw new Error(
          `Network request limit (${policy.maxNetworkRequests}) exceeded`,
        );
      }

      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!isAllowedUrl(url, policy.allowedDomains)) {
        throw new Error(
          `Domain not allowed: ${new URL(url).hostname}. Allowed: ${policy.allowedDomains.join(", ")}`,
        );
      }

      this.networkRequestCount++;
      const start = Date.now();

      const safeHeaders = new Headers(init?.headers);
      for (const [key] of safeHeaders.entries()) {
        if (!DENO_COMPAT_HEADERS.includes(key.toLowerCase())) {
          safeHeaders.delete(key);
        }
      }

      const safeInit: RequestInit = {
        method: init?.method ?? "GET",
        headers: safeHeaders,
        signal: AbortSignal.timeout(policy.timeoutMs),
      };

      if (init?.body) {
        if (typeof init.body === "string") {
          safeInit.body = init.body;
        } else if (init.body instanceof FormData) {
          safeInit.body = init.body;
        } else {
          safeInit.body = String(init.body);
        }
      }

      try {
        const response = await fetch(url, safeInit);
        const cpuCost = Date.now() - start;
        cpuUsed.value += cpuCost;
        peakMemory.value = Math.max(
          peakMemory.value,
          parseInt(response.headers.get("content-length") ?? "0", 10),
        );
        return response;
      } catch (err) {
        throw new Error(
          `Request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    };
  }

  private createCompatCrypto() {
    return {
      subtle: globalThis.crypto.subtle,
      getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto),
      randomUUID: randomUUID,
    };
  }

  private createCompatStreams() {
    return {
      ReadableStream: globalThis.ReadableStream,
      WritableStream: globalThis.WritableStream,
      TransformStream: globalThis.TransformStream,
    };
  }

  private createCompatConsole(context: IsolateContext) {
    return {
      log: (...args: unknown[]) => console.log(`[sandbox:${context.connectorName}]`, ...args),
      warn: (...args: unknown[]) => console.warn(`[sandbox:${context.connectorName}]`, ...args),
      error: (...args: unknown[]) => console.error(`[sandbox:${context.connectorName}]`, ...args),
      info: (...args: unknown[]) => console.info(`[sandbox:${context.connectorName}]`, ...args),
      debug: (...args: unknown[]) => console.debug(`[sandbox:${context.connectorName}]`, ...args),
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

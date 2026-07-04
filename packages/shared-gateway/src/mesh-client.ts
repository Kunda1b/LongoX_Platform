import type { ServiceMeshConfig, ServiceEndpoint } from "./service-mesh";

export interface ProxyRequest {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  user?: { id: string; tenantId: string | null; role: string };
}

export interface ProxyResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export class ServiceMeshClient {
  private config: ServiceMeshConfig;
  private routeMap = new Map<string, string>();

  constructor(config: ServiceMeshConfig) {
    this.config = config;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const routePatterns: [RegExp, string][] = [
      [/^\/executions/, "execution-service"],
      [
        /^\/ai(-models|-runs|-usage|-routing-policies|-playground|-router|-agents)?/,
        "ai-service",
      ],
      [/^\/prompts/, "ai-service"],
      [/^\/billing/, "billing-service"],
      [/^\/checkout/, "billing-service"],
      [/^\/plans/, "billing-service"],
      [/^\/usage/, "billing-service"],
      [/^\/search/, "search-service"],
    ];

    for (const [pattern, service] of routePatterns) {
      this.routeMap.set(pattern.source, service);
    }
  }

  resolveService(path: string): string | undefined {
    for (const [pattern, service] of this.routeMap) {
      if (new RegExp(pattern).test(path)) {
        return service;
      }
    }
    return undefined;
  }

  async proxy(request: ProxyRequest): Promise<ProxyResponse> {
    const serviceName = this.resolveService(request.path);
    if (!serviceName) {
      return { status: 404, body: { error: "Service not found" }, headers: {} };
    }

    const endpoint = this.config.registry.get(serviceName);
    if (!endpoint) {
      return {
        status: 503,
        body: { error: `Service ${serviceName} not registered` },
        headers: {},
      };
    }

    if (!this.config.circuitBreaker.canExecute(serviceName)) {
      return {
        status: 503,
        body: { error: `Service ${serviceName} circuit breaker is open` },
        headers: {},
      };
    }

    let lastError: Error | null = null;
    const maxAttempts = endpoint.retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const url = new URL(request.path, endpoint.url);
        if (request.query) {
          for (const [key, value] of Object.entries(request.query)) {
            url.searchParams.set(key, value);
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...request.headers,
        };

        if (request.user) {
          headers["X-User-Id"] = String(request.user.id);
          headers["X-Tenant-Id"] = String(request.user.tenantId);
          headers["X-User-Role"] = request.user.role;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), endpoint.timeout);

        const res = await fetch(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const body = await res.json().catch(() => null);

        this.config.circuitBreaker.recordSuccess(serviceName);

        return {
          status: res.status,
          body,
          headers: Object.fromEntries(res.headers.entries()),
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxAttempts) {
          await new Promise((r) =>
            setTimeout(r, Math.min(1000 * attempt, 5000)),
          );
        }
      }
    }

    this.config.circuitBreaker.recordFailure(serviceName);

    return {
      status: 502,
      body: {
        error: `Service ${serviceName} unavailable`,
        message: lastError?.message,
      },
      headers: {},
    };
  }

  async healthCheckAll(): Promise<
    Record<string, { healthy: boolean; latencyMs: number }>
  > {
    const results: Record<string, { healthy: boolean; latencyMs: number }> = {};
    const endpoints = this.config.registry.list();

    await Promise.allSettled(
      endpoints.map(async (ep) => {
        results[ep.name] = await this.config.registry.healthCheck(ep.name);
      }),
    );

    return results;
  }
}

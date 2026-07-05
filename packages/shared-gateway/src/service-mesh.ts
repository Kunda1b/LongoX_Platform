export interface ServiceEndpoint {
  name: string;
  url: string;
  healthUrl: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    threshold: number;
    resetTimeout: number;
  };
}

export interface ServiceRegistry {
  endpoints: Map<string, ServiceEndpoint>;
  register(service: ServiceEndpoint): void;
  get(name: string): ServiceEndpoint | undefined;
  list(): ServiceEndpoint[];
  healthCheck(name: string): Promise<{ healthy: boolean; latencyMs: number }>;
}

export class DefaultServiceRegistry implements ServiceRegistry {
  endpoints = new Map<string, ServiceEndpoint>();

  register(service: ServiceEndpoint): void {
    this.endpoints.set(service.name, service);
  }

  get(name: string): ServiceEndpoint | undefined {
    return this.endpoints.get(name);
  }

  list(): ServiceEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  async healthCheck(
    name: string,
  ): Promise<{ healthy: boolean; latencyMs: number }> {
    const endpoint = this.endpoints.get(name);
    if (!endpoint) return { healthy: false, latencyMs: 0 };

    const start = Date.now();
    try {
      const res = await fetch(endpoint.healthUrl, {
        signal: AbortSignal.timeout(5000),
      });
      return { healthy: res.ok, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

export class CircuitBreaker {
  private states = new Map<string, CircuitBreakerState>();

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30000,
  ) {}

  canExecute(serviceName: string): boolean {
    const state = this.states.get(serviceName);
    if (!state) return true;

    if (state.state === "open") {
      if (Date.now() - state.lastFailure > this.resetTimeout) {
        state.state = "half-open";
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess(serviceName: string): void {
    this.states.set(serviceName, {
      failures: 0,
      lastFailure: 0,
      state: "closed",
    });
  }

  recordFailure(serviceName: string): void {
    const state = this.states.get(serviceName) ?? {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.threshold) {
      state.state = "open";
    }

    this.states.set(serviceName, state);
  }

  getState(serviceName: string): CircuitBreakerState {
    return (
      this.states.get(serviceName) ?? {
        failures: 0,
        lastFailure: 0,
        state: "closed",
      }
    );
  }
}

export interface ServiceMeshConfig {
  registry: ServiceRegistry;
  circuitBreaker: CircuitBreaker;
  defaultTimeout: number;
  defaultRetries: number;
}

export function createDefaultMeshConfig(): ServiceMeshConfig {
  const registry = new DefaultServiceRegistry();

  const services: ServiceEndpoint[] = [
    {
      name: "execution-service",
      url: process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3002",
      healthUrl: process.env.EXECUTION_SERVICE_URL ?? "http://localhost:3002",
      timeout: 30000,
      retries: 2,
      circuitBreaker: { threshold: 5, resetTimeout: 30000 },
    },
    {
      name: "ai-service",
      url: process.env.AI_SERVICE_URL ?? "http://localhost:3003",
      healthUrl: process.env.AI_SERVICE_URL ?? "http://localhost:3003",
      timeout: 60000,
      retries: 1,
      circuitBreaker: { threshold: 3, resetTimeout: 60000 },
    },
    {
      name: "billing-service",
      url: process.env.BILLING_SERVICE_URL ?? "http://localhost:3004",
      healthUrl: process.env.BILLING_SERVICE_URL ?? "http://localhost:3004",
      timeout: 15000,
      retries: 2,
      circuitBreaker: { threshold: 5, resetTimeout: 30000 },
    },
    {
      name: "search-service",
      url: process.env.SEARCH_SERVICE_URL ?? "http://localhost:3005",
      healthUrl: process.env.SEARCH_SERVICE_URL ?? "http://localhost:3005",
      timeout: 10000,
      retries: 1,
      circuitBreaker: { threshold: 5, resetTimeout: 30000 },
    },
  ];

  for (const svc of services) {
    registry.register(svc);
  }

  return {
    registry,
    circuitBreaker: new CircuitBreaker(),
    defaultTimeout: 15000,
    defaultRetries: 2,
  };
}

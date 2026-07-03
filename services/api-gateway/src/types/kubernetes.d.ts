/**
 * Type declaration for the optional `@kubernetes/client-node` peer dependency.
 *
 * `services/api-gateway/src/services/tenant-migration.service.ts` dynamically
 * imports this package to provision tenant namespaces. The package is an
 * optional peer dependency — production deployments that use Tier 2/3 install
 * it via `pnpm add @kubernetes/client-node`; dev deployments skip it and the
 * dynamic import falls through to a try/catch that returns null.
 *
 * This declaration prevents TypeScript from failing when the package is not
 * installed. The runtime try/catch is the real safety net.
 */
declare module "@kubernetes/client-node" {
  export class KubeConfig {
    loadFromDefault(): void;
    loadFromCluster(): void;
    loadFromFile(path: string): void;
    makeApiClient<T>(apiType: new (config: unknown) => T): T;
    setCurrentContext(name: string): void;
  }

  export class CoreV1Api {
    readNamespace(name: string): Promise<{ body: unknown }>;
    createNamespace(body: unknown): Promise<{ body: unknown }>;
    deleteNamespace(name: string): Promise<void>;
    listNamespacedPod(namespace: string): Promise<{ body: unknown }>;
  }

  export class RbacAuthorizationV1Api {
    createRole(body: unknown): Promise<{ body: unknown }>;
    createRoleBinding(body: unknown): Promise<{ body: unknown }>;
  }

  export class AppsV1Api {
    createNamespacedDeployment(
      namespace: string,
      body: unknown,
    ): Promise<{ body: unknown }>;
    readNamespacedDeployment(
      name: string,
      namespace: string,
    ): Promise<{ body: unknown }>;
  }

  export class NetworkingV1Api {
    listIngressForAllNamespaces(): Promise<{ body: unknown }>;
    createNamespacedIngress(
      namespace: string,
      body: unknown,
    ): Promise<{ body: unknown }>;
    readNamespacedIngress(
      name: string,
      namespace: string,
    ): Promise<{ body: unknown }>;
    deleteNamespacedIngress(name: string, namespace: string): Promise<void>;
  }
}

export {
  ServiceMeshClient,
  type ProxyRequest,
  type ProxyResponse,
} from "./mesh-client";
export {
  DefaultServiceRegistry,
  CircuitBreaker,
  createDefaultMeshConfig,
  type ServiceEndpoint,
  type ServiceRegistry,
  type CircuitBreakerState,
  type ServiceMeshConfig,
} from "./service-mesh";
export {
  createServiceMeshMiddleware,
  createHealthCheckRoute,
} from "./middleware";
export {
  analyticsProjection,
  searchIndexProjection,
  reportingProjection,
} from "./projections";

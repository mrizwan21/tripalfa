/**
 * @tripalfa/resilience
 *
 * Resilience patterns for fault-tolerant microservices
 */

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerError,
  createCircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitState,
  type CircuitStats,
} from "./circuit-breaker";

// Retry
export {
  retry,
  retryable,
  retryWithResult,
  Retry,
  type RetryOptions,
  type RetryResult,
  type RetryError,
} from "./retry";

// Service Registry
export {
  ServiceRegistry,
  ServiceUnavailableError,
  createServiceRegistry,
  type ServiceInstance,
  type ServiceStatus,
  type HealthCheckResult,
  type ServiceRegistryOptions,
  type ServiceRegistryStats,
} from "./service-registry";

// Resilient Client
export {
  ResilientClient,
  createResilientClient,
  type ResilientClientOptions,
  type RequestOptions,
  type Response as ResilientResponse,
} from "./resilient-client";

// Re-export event emitter for convenience
export { EventEmitter } from "eventemitter3";

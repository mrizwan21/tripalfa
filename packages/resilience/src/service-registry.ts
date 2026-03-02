/**
 * Service Registry & Health Check System
 *
 * Provides service discovery, health monitoring, and automatic failover
 */

import EventEmitter from "eventemitter3";
import {
  CircuitBreaker,
  CircuitBreakerOptions,
  CircuitStats,
} from "./circuit-breaker";

export type ServiceStatus = "healthy" | "unhealthy" | "degraded" | "unknown";

export interface ServiceInstance {
  id: string;
  name: string;
  url: string;
  port: number;
  status: ServiceStatus;
  lastHealthCheck: number | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  metadata?: Record<string, any>;
  weight: number;
  priority: number;
}

export interface HealthCheckResult {
  instanceId: string;
  status: ServiceStatus;
  timestamp: number;
  responseTimeMs: number;
  error?: string;
  details?: Record<string, any>;
}

export interface ServiceRegistryOptions {
  /** Health check interval in ms */
  healthCheckInterval: number;
  /** Health check timeout in ms */
  healthCheckTimeout: number;
  /** Number of consecutive failures to mark unhealthy */
  unhealthyThreshold: number;
  /** Number of consecutive successes to mark healthy */
  healthyThreshold: number;
  /** Enable circuit breaker for services */
  enableCircuitBreaker: boolean;
  /** Circuit breaker options */
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  /** Enable logging */
  enableLogging?: boolean;
}

export interface ServiceRegistryStats {
  services: {
    name: string;
    instances: number;
    healthyInstances: number;
    status: ServiceStatus;
    circuitBreakerState: string;
  }[];
  totalServices: number;
  totalInstances: number;
  healthyInstances: number;
  lastUpdate: number;
}

const DEFAULT_OPTIONS: Omit<
  Required<ServiceRegistryOptions>,
  "circuitBreakerOptions"
> = {
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
  unhealthyThreshold: 3,
  healthyThreshold: 2,
  enableCircuitBreaker: true,
  enableLogging: false,
};

/**
 * Service Registry
 *
 * Manages service instances with health checking and circuit breaker integration
 */
export class ServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceInstance[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();

  private readonly options: ServiceRegistryOptions & {
    circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  };

  constructor(options?: Partial<ServiceRegistryOptions>) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a service instance
   */
  register(
    instance: Omit<
      ServiceInstance,
      | "status"
      | "lastHealthCheck"
      | "consecutiveFailures"
      | "consecutiveSuccesses"
    >,
  ): void {
    const fullInstance: ServiceInstance = {
      ...instance,
      status: "unknown",
      lastHealthCheck: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      weight: instance.weight ?? 1,
      priority: instance.priority ?? 1,
    };

    const instances = this.services.get(instance.name) || [];
    instances.push(fullInstance);
    this.services.set(instance.name, instances);

    // Create circuit breaker for the instance
    if (this.options.enableCircuitBreaker) {
      this.createCircuitBreaker(instance.id, instance.name);
    }

    this.emit("register", { instance: fullInstance });
    this.log(`Registered service instance: ${instance.name} (${instance.id})`);
  }

  /**
   * Deregister a service instance
   */
  deregister(instanceId: string): void {
    for (const [serviceName, instances] of this.services.entries()) {
      const index = instances.findIndex((i) => i.id === instanceId);
      if (index !== -1) {
        const [removed] = instances.splice(index, 1);

        // Remove circuit breaker
        this.circuitBreakers.delete(instanceId);

        // Stop health check timer if no instances left
        if (instances.length === 0) {
          const timer = this.healthCheckTimers.get(serviceName);
          if (timer) {
            clearInterval(timer);
            this.healthCheckTimers.delete(serviceName);
          }
        }

        this.emit("deregister", { instance: removed });
        this.log(
          `Deregistered service instance: ${serviceName} (${instanceId})`,
        );
        return;
      }
    }
  }

  /**
   * Get a healthy instance for a service
   */
  getInstance(serviceName: string): ServiceInstance | null {
    const instances = this.services.get(serviceName) || [];

    // Filter healthy instances
    const healthyInstances = instances.filter(
      (i) => i.status === "healthy" && !this.isCircuitOpen(i.id),
    );

    if (healthyInstances.length === 0) {
      // Fallback to degraded instances if no healthy ones
      const degradedInstances = instances.filter(
        (i) => i.status === "degraded" && !this.isCircuitOpen(i.id),
      );

      if (degradedInstances.length === 0) {
        return null;
      }

      return this.selectInstance(degradedInstances);
    }

    return this.selectInstance(healthyInstances);
  }

  /**
   * Get all instances for a service
   */
  getInstances(serviceName: string): ServiceInstance[] {
    return this.services.get(serviceName) || [];
  }

  /**
   * Get all registered services
   */
  getServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Execute a request with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: (instance: ServiceInstance) => Promise<T>,
  ): Promise<T> {
    const instance = this.getInstance(serviceName);

    if (!instance) {
      throw new ServiceUnavailableError(
        `No healthy instances available for service: ${serviceName}`,
      );
    }

    const circuitBreaker = this.circuitBreakers.get(instance.id);

    if (circuitBreaker) {
      return circuitBreaker.execute(() => fn(instance));
    }

    return fn(instance);
  }

  /**
   * Start health checks for all services
   */
  startHealthChecks(): void {
    for (const serviceName of this.services.keys()) {
      this.startHealthCheckForService(serviceName);
    }
    this.log("Started health checks for all services");
  }

  /**
   * Stop all health checks
   */
  stopHealthChecks(): void {
    for (const [serviceName, timer] of this.healthCheckTimers.entries()) {
      clearInterval(timer);
      this.log(`Stopped health checks for service: ${serviceName}`);
    }
    this.healthCheckTimers.clear();
  }

  /**
   * Perform health check for a specific instance
   */
  async checkHealth(instance: ServiceInstance): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const healthUrl = `${instance.url}/health`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.options.healthCheckTimeout,
      );

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      const result: HealthCheckResult = {
        instanceId: instance.id,
        status: response.ok ? "healthy" : "unhealthy",
        timestamp: Date.now(),
        responseTimeMs,
        details: response.ok
          ? await response
              .json()
              .then((d) => d as Record<string, any>)
              .catch(() => undefined)
          : undefined,
      };

      if (!response.ok) {
        result.error = `Health check failed with status ${response.status}`;
      }

      return result;
    } catch (error) {
      return {
        instanceId: instance.id,
        status: "unhealthy",
        timestamp: Date.now(),
        responseTimeMs: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update instance health status
   */
  updateHealth(result: HealthCheckResult): void {
    const instance = this.findInstance(result.instanceId);
    if (!instance) return;

    const previousStatus = instance.status;
    instance.lastHealthCheck = result.timestamp;

    if (result.status === "healthy") {
      instance.consecutiveFailures = 0;
      instance.consecutiveSuccesses++;

      if (instance.consecutiveSuccesses >= this.options.healthyThreshold) {
        instance.status = "healthy";
      }
    } else {
      instance.consecutiveSuccesses = 0;
      instance.consecutiveFailures++;

      if (instance.consecutiveFailures >= this.options.unhealthyThreshold) {
        instance.status = "unhealthy";
      } else if (instance.consecutiveFailures > 0) {
        instance.status = "degraded";
      }
    }

    // Store health check result
    const results = this.healthCheckResults.get(instance.id) || [];
    results.push(result);
    // Keep last 100 results
    if (results.length > 100) {
      results.shift();
    }
    this.healthCheckResults.set(instance.id, results);

    // Emit events on status change
    if (previousStatus !== instance.status) {
      this.emit("statusChange", {
        instance,
        previousStatus,
        newStatus: instance.status,
        result,
      });

      this.log(
        `Instance ${instance.name} (${instance.id}) status changed: ${previousStatus} -> ${instance.status}`,
      );
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): ServiceRegistryStats {
    const serviceStats = Array.from(this.services.entries()).map(
      ([name, instances]) => ({
        name,
        instances: instances.length,
        healthyInstances: instances.filter((i) => i.status === "healthy")
          .length,
        status: this.getServiceStatus(name),
        circuitBreakerState: this.getServiceCircuitBreakerState(name),
      }),
    );

    const totalInstances = serviceStats.reduce(
      (sum, s) => sum + s.instances,
      0,
    );
    const healthyInstances = serviceStats.reduce(
      (sum, s) => sum + s.healthyInstances,
      0,
    );

    return {
      services: serviceStats,
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Get health check history for an instance
   */
  getHealthHistory(instanceId: string): HealthCheckResult[] {
    return this.healthCheckResults.get(instanceId) || [];
  }

  /**
   * Get circuit breaker stats for an instance
   */
  getCircuitBreakerStats(instanceId: string): CircuitStats | null {
    const cb = this.circuitBreakers.get(instanceId);
    return cb?.getStats() ?? null;
  }

  // Private methods

  private createCircuitBreaker(instanceId: string, serviceName: string): void {
    const cb = new CircuitBreaker({
      name: `${serviceName}-${instanceId}`,
      failureThreshold:
        this.options.circuitBreakerOptions?.failureThreshold ?? 5,
      successThreshold:
        this.options.circuitBreakerOptions?.successThreshold ?? 3,
      timeout: this.options.circuitBreakerOptions?.timeout ?? 30000,
      resetTimeout: this.options.circuitBreakerOptions?.resetTimeout ?? 60000,
      enableLogging: this.options.enableLogging,
      ...this.options.circuitBreakerOptions,
    });

    cb.on("stateChange", (data) => {
      this.emit("circuitBreakerStateChange", data);
    });

    this.circuitBreakers.set(instanceId, cb);
  }

  private startHealthCheckForService(serviceName: string): void {
    // Don't start if already running
    if (this.healthCheckTimers.has(serviceName)) return;

    const timer = setInterval(async () => {
      const instances = this.services.get(serviceName) || [];
      for (const instance of instances) {
        const result = await this.checkHealth(instance);
        this.updateHealth(result);
      }
    }, this.options.healthCheckInterval);

    this.healthCheckTimers.set(serviceName, timer);

    // Run initial health check
    setImmediate(async () => {
      const instances = this.services.get(serviceName) || [];
      for (const instance of instances) {
        const result = await this.checkHealth(instance);
        this.updateHealth(result);
      }
    });
  }

  private selectInstance(instances: ServiceInstance[]): ServiceInstance {
    // Weighted round-robin selection
    // For simplicity, using random selection with weight
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[instances.length - 1];
  }

  private findInstance(instanceId: string): ServiceInstance | null {
    for (const instances of this.services.values()) {
      const instance = instances.find((i) => i.id === instanceId);
      if (instance) return instance;
    }
    return null;
  }

  private isCircuitOpen(instanceId: string): boolean {
    const cb = this.circuitBreakers.get(instanceId);
    return cb?.isOpen() ?? false;
  }

  private getServiceStatus(serviceName: string): ServiceStatus {
    const instances = this.services.get(serviceName) || [];
    if (instances.length === 0) return "unknown";

    const healthyCount = instances.filter((i) => i.status === "healthy").length;

    if (healthyCount === instances.length) return "healthy";
    if (healthyCount === 0) return "unhealthy";
    return "degraded";
  }

  private getServiceCircuitBreakerState(serviceName: string): string {
    const instances = this.services.get(serviceName) || [];
    const states = instances.map((i) => {
      const cb = this.circuitBreakers.get(i.id);
      return cb?.getState() ?? "unknown";
    });

    if (states.every((s) => s === "CLOSED")) return "closed";
    if (states.some((s) => s === "OPEN")) return "open";
    if (states.some((s) => s === "HALF_OPEN")) return "half-open";
    return "mixed";
  }

  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[ServiceRegistry] ${message}`);
    }
  }
}

/**
 * Service Unavailable Error
 */
export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Create a service registry with default options
 */
export function createServiceRegistry(
  options?: Partial<ServiceRegistryOptions>,
): ServiceRegistry {
  return new ServiceRegistry(options);
}

export default ServiceRegistry;

/**
 * Resilient HTTP Client
 *
 * Combines circuit breaker, retry, and timeout patterns
 */

import {
  CircuitBreaker,
  CircuitBreakerOptions,
  createCircuitBreaker,
} from "./circuit-breaker";
import { retry, RetryOptions } from "./retry";

export interface ResilientClientOptions {
  /** Base URL for the service */
  baseUrl: string;
  /** Service name for circuit breaker identification */
  serviceName: string;
  /** Default timeout in ms for all requests */
  timeout: number;
  /** Retry options */
  retryOptions?: Partial<RetryOptions>;
  /** Circuit breaker options */
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  /** Custom headers to add to all requests */
  defaultHeaders?: Record<string, string>;
  /** Enable logging */
  enableLogging?: boolean;
  /** Fallback response when circuit is open */
  fallback?: <T>(request: RequestOptions, error: Error) => Promise<T> | T;
}

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  skipRetry?: boolean;
  skipCircuitBreaker?: boolean;
}

export interface Response<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timing: {
    total: number;
    retries: number;
    fromCircuitBreaker: boolean;
  };
}

const DEFAULT_OPTIONS: Omit<
  Required<Pick<ResilientClientOptions, "timeout" | "enableLogging">>,
  "baseUrl" | "serviceName"
> = {
  timeout: 30000,
  enableLogging: false,
};

/**
 * Resilient HTTP Client
 *
 * Provides a robust HTTP client with built-in resilience patterns
 */
export class ResilientClient {
  private readonly circuitBreaker: CircuitBreaker;
  private readonly options: ResilientClientOptions & typeof DEFAULT_OPTIONS;

  constructor(options: ResilientClientOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Create circuit breaker
    // Note: Fallback is handled in the request method where we have access to request options
    this.circuitBreaker = createCircuitBreaker(options.serviceName, {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000,
      resetTimeout: 60000,
      enableLogging: options.enableLogging,
      ...options.circuitBreakerOptions,
    });
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    path: string,
    options?: Omit<RequestOptions, "method" | "path" | "body">,
  ): Promise<Response<T>> {
    return this.request<T>({ ...options, method: "GET", path });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "path" | "body">,
  ): Promise<Response<T>> {
    return this.request<T>({ ...options, method: "POST", path, body });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "path" | "body">,
  ): Promise<Response<T>> {
    return this.request<T>({ ...options, method: "PUT", path, body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "path" | "body">,
  ): Promise<Response<T>> {
    return this.request<T>({ ...options, method: "PATCH", path, body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    path: string,
    options?: Omit<RequestOptions, "method" | "path" | "body">,
  ): Promise<Response<T>> {
    return this.request<T>({ ...options, method: "DELETE", path });
  }

  /**
   * Make a request with full resilience protection
   */
  async request<T = any>(options: RequestOptions): Promise<Response<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let fromCircuitBreaker = false;

    const executeRequest = async (): Promise<Response<T>> => {
      const url = this.buildUrl(options.path, options.query);
      const timeout = options.timeout ?? this.options.timeout;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method: options.method,
          headers: {
            "Content-Type": "application/json",
            ...this.options.defaultHeaders,
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(
            `HTTP ${response.status}: ${response.statusText}`,
          ) as any;
          error.response = response;
          error.status = response.status;
          throw error;
        }

        const data = (await response.json()) as T;

        return {
          data,
          status: response.status,
          headers: this.headersToObject(response.headers),
          timing: {
            total: Date.now() - startTime,
            retries: retryCount,
            fromCircuitBreaker,
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const executeWithRetry = async (): Promise<Response<T>> => {
      if (options.skipRetry) {
        return executeRequest();
      }

      return retry(
        async () => {
          retryCount++;
          return executeRequest();
        },
        {
          maxRetries: this.options.retryOptions?.maxRetries ?? 3,
          baseDelayMs: this.options.retryOptions?.baseDelayMs ?? 1000,
          maxDelayMs: this.options.retryOptions?.maxDelayMs ?? 10000,
          backoffMultiplier: this.options.retryOptions?.backoffMultiplier ?? 2,
          jitterFactor: this.options.retryOptions?.jitterFactor ?? 0.1,
          retryableStatusCodes: this.options.retryOptions
            ?.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504],
          enableLogging: this.options.enableLogging,
          ...this.options.retryOptions,
        },
      );
    };

    try {
      if (options.skipCircuitBreaker) {
        return await executeWithRetry();
      }

      // Execute with circuit breaker protection
      const result = await this.circuitBreaker.execute(executeWithRetry);
      fromCircuitBreaker = true;

      return result;
    } catch (error: any) {
      // If we have a fallback, try it
      if (this.options.fallback) {
        this.log(`Using fallback for ${options.method} ${options.path}`);
        const fallbackResult = await this.options.fallback<T>(options, error);

        return {
          data: fallbackResult,
          status: 200,
          headers: {},
          timing: {
            total: Date.now() - startTime,
            retries: retryCount,
            fromCircuitBreaker: true,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Force open the circuit breaker
   */
  tripCircuitBreaker(): void {
    this.circuitBreaker.trip();
  }

  /**
   * Reset the circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  // Private methods

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    let url = `${this.options.baseUrl}${path}`;

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      url += `?${params.toString()}`;
    }

    return url;
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[ResilientClient:${this.options.serviceName}] ${message}`);
    }
  }
}

/**
 * Create a resilient client
 */
export function createResilientClient(
  options: ResilientClientOptions,
): ResilientClient {
  return new ResilientClient(options);
}

export default ResilientClient;

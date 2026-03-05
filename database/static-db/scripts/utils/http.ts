import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// Circuit breaker configuration
const DEFAULT_TIMEOUT = 120_000; // 2 minutes for large requests
const LITEAPI_TIMEOUT = 180_000; // 3 minutes for LiteAPI (handles very large hotel data payloads)
const MAX_RETRIES = 5; // Increased retries
const RETRY_DELAY_MS = 1_000;
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT_MS = 60_000; // 1 minute

// Circuit breaker state interface
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

/**
 * Circuit breaker storage using WeakMap.
 *
 * NOTE: WeakMap keys are weakly referenced, meaning if the AxiosInstance
 * is garbage collected, the circuit breaker state is automatically removed.
 *
 * IMPLICATIONS FOR EPHEMERAL CLIENTS:
 * - If you create short-lived AxiosInstance objects frequently, circuit breaker
 *   state will be lost on GC, potentially causing circuit flapping (rapid open/close).
 * - For ephemeral clients, consider using a Map with explicit cleanup or use
 *   a shared client instance per external service.
 *
 * CURRENT USAGE: This is acceptable for the current use case where clients
 * are long-lived singletons (created once per service and reused).
 */
const circuitBreakers = new WeakMap<AxiosInstance, CircuitBreakerState>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCircuitBreaker(client: AxiosInstance): CircuitBreakerState {
  let cb = circuitBreakers.get(client);
  if (!cb) {
    cb = {
      failures: 0,
      lastFailureTime: 0,
      state: "CLOSED",
    };
    circuitBreakers.set(client, cb);
  }
  return cb;
}

function updateCircuitBreaker(client: AxiosInstance, success: boolean): void {
  const cb = getCircuitBreaker(client);
  
  if (success) {
    cb.failures = 0;
    cb.state = "CLOSED";
    cb.lastFailureTime = 0;
  } else {
    cb.failures++;
    cb.lastFailureTime = Date.now();
    
    if (cb.failures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      console.error(`[CircuitBreaker] Circuit OPENED for ${client.defaults.baseURL} after ${cb.failures} failures`);
      cb.state = "OPEN";
    }
  }
}

function isCircuitOpen(client: AxiosInstance): boolean {
  const cb = getCircuitBreaker(client);
  
  if (cb.state === "OPEN") {
    const timeSinceLastFailure = Date.now() - cb.lastFailureTime;
    if (timeSinceLastFailure >= CIRCUIT_BREAKER_RESET_TIMEOUT_MS) {
      console.warn(`[CircuitBreaker] Transitioning from OPEN to HALF_OPEN for ${client.defaults.baseURL}`);
      cb.state = "HALF_OPEN";
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Reset circuit breaker for a specific client - useful for testing or manual reset
 */
export function resetCircuitBreaker(client: AxiosInstance): void {
  const cb = getCircuitBreaker(client);
  cb.failures = 0;
  cb.lastFailureTime = 0;
  cb.state = "CLOSED";
}

function createClient(
  baseURL: string,
  headers: Record<string, string>,
  timeout = DEFAULT_TIMEOUT,
): AxiosInstance {
  const client = axios.create({ baseURL, headers, timeout });
  
  // Initialize circuit breaker state for this client instance
  getCircuitBreaker(client);
  
  // Add request interceptor to check circuit breaker
  client.interceptors.request.use(
    (config) => {
      if (isCircuitOpen(client)) {
        return Promise.reject(new Error(`Circuit breaker open for ${baseURL}`));
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return client;
}

/** Enhanced GET wrapper with circuit breaker and better retry logic */
export async function get<T>(
  client: AxiosInstance,
  path: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      const axiosConfig: AxiosRequestConfig = {
        params,
        ...config
      };
      const resp = await client.get<T>(path, axiosConfig);
      updateCircuitBreaker(client, true);
      return resp.data;
    } catch (err: unknown) {
      attempt++;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const isNetworkError = !status && err instanceof Error && err.message.includes('ENOTFOUND');
      
      // Check if we should retry
      const shouldRetry = attempt < MAX_RETRIES && (
        status === 429 || 
        (status !== undefined && status >= 500) ||
        isNetworkError
      );
      
      if (shouldRetry) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        const delayWithJitter = delay + Math.random() * 1000; // Add jitter
        
        console.warn(
          `[HTTP] ${status || 'NETWORK'} on ${path} — retry ${attempt}/${MAX_RETRIES} in ${Math.round(delayWithJitter)}ms`,
        );
        
        updateCircuitBreaker(client, false);
        await sleep(delayWithJitter);
        continue;
      }
      
      updateCircuitBreaker(client, false);
      throw err;
    }
  }
}

/** LiteAPI client with extended timeout for large hotel data payloads */
export function createLiteApiClient(apiKey: string): AxiosInstance {
  return createClient("https://api.liteapi.travel/v3.0", {
    accept: "application/json",
    "X-API-Key": apiKey,
  }, LITEAPI_TIMEOUT); // 3 minute timeout for large payloads
}

/** Duffel client */
export function createDuffelClient(accessToken: string): AxiosInstance {
  return createClient("https://api.duffel.com", {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "Duffel-Version": "v2",
    Authorization: `Bearer ${accessToken}`,
  }, 60000); // 1 minute timeout
}

/** OpenExchangeRates client */
export function createOERClient(appId: string): AxiosInstance {
  return createClient(
    "https://openexchangerates.org/api",
    {
      Accept: "application/json",
    },
    30000, // 30 second timeout
  );
}

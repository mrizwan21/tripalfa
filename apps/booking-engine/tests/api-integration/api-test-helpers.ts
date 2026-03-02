/**
 * API Integration Test Helpers
 *
 * Enhanced utilities for API integration testing in E2E tests.
 * Provides request/response interception, API mocking, and test scenario management.
 *
 * @module api-integration/api-test-helpers
 */

import { Page, Request, Response, Route } from "@playwright/test";

/**
 * API Endpoint Configuration
 * Centralized configuration for all API endpoints used in tests
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    register: "/api/auth/register",
    verifyEmail: "/api/auth/verify-email",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  // Bookings
  bookings: {
    base: "/api/bookings",
    create: "/api/bookings",
    get: (ref: string) => `/api/bookings/${ref}`,
    cancel: (ref: string) => `/api/bookings/${ref}/cancel`,
    confirm: (ref: string) => `/api/bookings/${ref}/confirm`,
    list: "/api/bookings",
    search: "/api/bookings/search",
  },
  // Flights
  flights: {
    search: "/api/flights/search",
    offers: "/api/flights/offers",
    book: "/api/flights/book",
    details: (id: string) => `/api/flights/${id}`,
  },
  // Hotels
  hotels: {
    search: "/api/hotels/search",
    offers: "/api/hotels/offers",
    book: "/api/hotels/book",
    details: (id: string) => `/api/hotels/${id}`,
  },
  // Wallet
  wallet: {
    balance: "/api/wallet/balance",
    transactions: "/api/wallet/transactions",
    topUp: "/api/wallet/top-up",
    transfer: "/api/wallet/transfer",
  },
  // Payments
  payments: {
    process: "/api/payments/process",
    intent: "/api/payments/intent",
    confirm: (id: string) => `/api/payments/${id}/confirm`,
    status: (id: string) => `/api/payments/${id}`,
  },
  // User
  user: {
    profile: "/api/user/profile",
    update: "/api/user/profile",
    preferences: "/api/user/preferences",
  },
  // Health & Status
  health: "/api/health",
  status: "/api/status",
} as const;

/**
 * API Response Mock Builder
 * Helper class for building mock API responses
 */
export class ApiMockBuilder {
  private mockData: any = {};
  private statusCode: number = 200;
  private delay: number = 0;
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  /**
   * Set the response data
   */
  withData(data: any): this {
    this.mockData = data;
    return this;
  }

  /**
   * Set HTTP status code
   */
  withStatus(code: number): this {
    this.statusCode = code;
    return this;
  }

  /**
   * Add response delay (simulates network latency)
   */
  withDelay(ms: number): this {
    this.delay = ms;
    return this;
  }

  /**
   * Add custom headers
   */
  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * Build the mock response
   */
  build(): {
    status: number;
    body: string;
    headers: Record<string, string>;
    delay: number;
  } {
    return {
      status: this.statusCode,
      body: JSON.stringify(this.mockData),
      headers: this.headers,
      delay: this.delay,
    };
  }
}

/**
 * API Request Interceptor
 * Intercepts and logs API requests for debugging and verification
 */
export class ApiRequestInterceptor {
  private requests: Request[] = [];
  private responses: Response[] = [];

  /**
   * Start intercepting requests on a page
   */
  async start(page: Page): Promise<void> {
    this.requests = [];
    this.responses = [];

    page.on("request", (request) => {
      if (this.isApiRequest(request)) {
        this.requests.push(request);
      }
    });

    page.on("response", (response) => {
      if (this.isApiRequest(response.request())) {
        this.responses.push(response);
      }
    });
  }

  /**
   * Check if request is an API call
   */
  private isApiRequest(request: Request): boolean {
    return (
      request.url().includes("/api/") ||
      request.url().includes("localhost:3003") ||
      request.url().includes("booking-service")
    );
  }

  /**
   * Get all captured requests
   */
  getRequests(): Request[] {
    return [...this.requests];
  }

  /**
   * Get all captured responses
   */
  getResponses(): Response[] {
    return [...this.responses];
  }

  /**
   * Find request by URL pattern
   */
  findRequest(urlPattern: string | RegExp): Request | undefined {
    return this.requests.find((req) => {
      if (typeof urlPattern === "string") {
        return req.url().includes(urlPattern);
      }
      return urlPattern.test(req.url());
    });
  }

  /**
   * Find response by URL pattern
   */
  findResponse(urlPattern: string | RegExp): Response | undefined {
    return this.responses.find((res) => {
      const url = res.request().url();
      if (typeof urlPattern === "string") {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    });
  }

  /**
   * Clear all captured requests and responses
   */
  clear(): void {
    this.requests = [];
    this.responses = [];
  }

  /**
   * Get request count
   */
  getRequestCount(): number {
    return this.requests.length;
  }

  /**
   * Wait for specific API request
   */
  async waitForRequest(
    page: Page,
    urlPattern: string | RegExp,
    timeout = 10000,
  ): Promise<Request> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for request: ${urlPattern}`));
      }, timeout);

      const checkRequest = () => {
        const request = this.findRequest(urlPattern);
        if (request) {
          clearTimeout(timeoutId);
          resolve(request);
        } else {
          setTimeout(checkRequest, 100);
        }
      };

      checkRequest();
    });
  }
}

/**
 * API Response Validator
 * Validates API responses against expected schemas
 */
export class ApiResponseValidator {
  /**
   * Validate booking response structure
   */
  static validateBookingResponse(response: any): ValidationResult {
    const requiredFields = [
      "bookingReference",
      "status",
      "totalAmount",
      "createdAt",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in response),
    );

    return {
      valid: missingFields.length === 0,
      missingFields,
      errors: missingFields.map((f) => `Missing required field: ${f}`),
    };
  }

  /**
   * Validate flight search response
   */
  static validateFlightSearchResponse(response: any): ValidationResult {
    if (!Array.isArray(response.offers) && !Array.isArray(response.results)) {
      return {
        valid: false,
        missingFields: ["offers or results array"],
        errors: ["Response must contain offers or results array"],
      };
    }

    const offers = response.offers || response.results || [];
    if (offers.length === 0) {
      return {
        valid: false,
        missingFields: [],
        errors: ["No flight offers found"],
      };
    }

    return { valid: true, missingFields: [], errors: [] };
  }

  /**
   * Validate hotel search response
   */
  static validateHotelSearchResponse(response: any): ValidationResult {
    if (!Array.isArray(response.offers) && !Array.isArray(response.results)) {
      return {
        valid: false,
        missingFields: ["offers or results array"],
        errors: ["Response must contain offers or results array"],
      };
    }

    return { valid: true, missingFields: [], errors: [] };
  }

  /**
   * Validate wallet response
   */
  static validateWalletResponse(response: any): ValidationResult {
    const requiredFields = ["balance", "currency"];
    const missingFields = requiredFields.filter(
      (field) => !(field in response),
    );

    return {
      valid: missingFields.length === 0,
      missingFields,
      errors: missingFields.map((f) => `Missing required field: ${f}`),
    };
  }

  /**
   * Validate payment response
   */
  static validatePaymentResponse(response: any): ValidationResult {
    const requiredFields = ["status", "paymentIntentId"];
    const missingFields = requiredFields.filter(
      (field) => !(field in response),
    );

    return {
      valid: missingFields.length === 0,
      missingFields,
      errors: missingFields.map((f) => `Missing required field: ${f}`),
    };
  }
}

/**
 * API Test Scenario Builder
 * Builds reusable API test scenarios
 */
export class ApiTestScenario {
  private steps: Array<() => Promise<void>> = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a step to the scenario
   */
  addStep(stepName: string, action: () => Promise<void>): this {
    this.steps.push(async () => {
      console.log(`  → ${stepName}`);
      await action();
    });
    return this;
  }

  /**
   * Execute all steps in the scenario
   */
  async execute(): Promise<void> {
    console.log(`\n🎬 Running scenario: ${this.name}`);
    for (let i = 0; i < this.steps.length; i++) {
      console.log(`  Step ${i + 1}/${this.steps.length}:`);
      await this.steps[i]();
    }
    console.log(`✅ Scenario completed: ${this.name}\n`);
  }
}

/**
 * Mock API Route Handler
 * Handles mocking of API routes in Playwright
 */
export async function mockApiRoute(
  page: Page,
  urlPattern: string | RegExp,
  mockBuilder: ApiMockBuilder | ((route: Route) => Promise<void>),
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    if (mockBuilder instanceof ApiMockBuilder) {
      const mock = mockBuilder.build();
      await route.fulfill({
        status: mock.status,
        body: mock.body,
        headers: mock.headers,
      });
    } else {
      await mockBuilder(route);
    }
  });
}

/**
 * Wait for API response with specific criteria
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    statusCode?: number;
    timeout?: number;
    predicate?: (response: Response) => boolean;
  } = {},
): Promise<Response> {
  const { statusCode, timeout = 10000, predicate } = options;

  return page.waitForResponse(
    (response) => {
      const url = response.request().url();
      const matchesUrl =
        typeof urlPattern === "string"
          ? url.includes(urlPattern)
          : urlPattern.test(url);

      if (!matchesUrl) return false;
      if (statusCode && response.status() !== statusCode) return false;
      if (predicate && !predicate(response)) return false;

      return true;
    },
    { timeout },
  );
}

/**
 * Extract data from API response
 */
export async function extractResponseData<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`Failed to parse response JSON: ${error}`);
  }
}

/**
 * Log API request/response for debugging
 */
export function logApiCall(request: Request, response?: Response): void {
  console.log(`\n📡 API Call:`);
  console.log(`  Method: ${request.method()}`);
  console.log(`  URL: ${request.url()}`);
  console.log(`  Headers: ${JSON.stringify(request.headers(), null, 2)}`);

  if (response) {
    console.log(`  Response Status: ${response.status()}`);
    console.log(
      `  Response Headers: ${JSON.stringify(response.headers(), null, 2)}`,
    );
  }
}

/**
 * Retry API call with exponential backoff
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryableStatuses?: number[];
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error is retryable
      const isRetryable = retryableStatuses.some((status) =>
        lastError!.message.includes(status.toString()),
      );

      if (!isRetryable) {
        throw lastError;
      }

      console.log(
        `  ⚠️  API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with jitter
      delay = Math.min(delay * 2 + Math.random() * 1000, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Type Definitions
 */
export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  errors: string[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  statusCode: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  responseStatus?: number;
  responseBody?: any;
  duration?: number;
}

/**
 * API Logger for test debugging
 */
export class ApiLogger {
  private logs: RequestLog[] = [];

  log(request: RequestLog): void {
    this.logs.push(request);
  }

  getLogs(): RequestLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  exportToFile(filepath: string): void {
    const fs = require("fs");
    fs.writeFileSync(filepath, JSON.stringify(this.logs, null, 2));
  }

  printSummary(): void {
    console.log("\n📊 API Call Summary:");
    console.log(`  Total Requests: ${this.logs.length}`);

    const statusGroups = this.logs.reduce(
      (acc, log) => {
        const status = log.responseStatus || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  Status ${status}: ${count} requests`);
    });
  }
}

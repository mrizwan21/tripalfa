/**
 * API Helpers
 *
 * Utilities for interacting with backend services during E2E tests.
 * Provides helper functions for authentication, data seeding, and API interactions.
 */

/**
 * API Configuration
 * Environment-based configuration for external services
 */
export const API_CONFIG = {
  bookingService: {
    baseURL:
      process.env.API_URL ||
      process.env.BOOKING_SERVICE_URL ||
      "http://localhost:3003",
  },
  stripe: {
    apiKey: process.env.STRIPE_TEST_KEY || "sk_test_...",
    publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || "pk_test_...",
  },
  duffel: {
    baseURL: process.env.DUFFEL_SANDBOX_URL || "https://api.duffel.com",
    apiKey: process.env.DUFFEL_SANDBOX_KEY || "",
  },
  innstant: {
    baseURL: process.env.INNSTANT_SANDBOX_URL || "https://sandbox.innstant.com",
    apiKey: process.env.INNSTANT_SANDBOX_KEY || "",
  },
};

/**
 * Authenticate a test user and return auth token
 */
export async function authenticateTestUser(
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(
    `${API_CONFIG.bookingService.baseURL}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token || data.accessToken;
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_CONFIG.bookingService.baseURL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Create a test booking via API
 */
export async function createTestBooking(
  token: string,
  bookingData: Partial<BookingData>,
): Promise<BookingResponse> {
  const response = await makeAuthenticatedRequest("/api/bookings", token, {
    method: "POST",
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get booking by reference
 */
export async function getBooking(
  token: string,
  bookingReference: string,
): Promise<BookingResponse> {
  const response = await makeAuthenticatedRequest(
    `/api/bookings/${bookingReference}`,
    token,
  );

  if (!response.ok) {
    throw new Error(`Failed to get booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel a booking via API
 */
export async function cancelBooking(
  token: string,
  bookingReference: string,
): Promise<void> {
  const response = await makeAuthenticatedRequest(
    `/api/bookings/${bookingReference}/cancel`,
    token,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error(`Failed to cancel booking: ${response.statusText}`);
  }
}

/**
 * Get user wallet balance
 */
export async function getWalletBalance(token: string): Promise<number> {
  const response = await makeAuthenticatedRequest("/api/wallet/balance", token);

  if (!response.ok) {
    throw new Error(`Failed to get wallet balance: ${response.statusText}`);
  }

  const data = await response.json();
  return data.balance || 0;
}

/**
 * Add funds to wallet via API
 */
export async function addWalletFunds(
  token: string,
  amount: number,
): Promise<void> {
  const response = await makeAuthenticatedRequest("/api/wallet/top-up", token, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add wallet funds: ${response.statusText}`);
  }
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
  token: string,
  limit: number = 10,
): Promise<Transaction[]> {
  const response = await makeAuthenticatedRequest(
    `/api/wallet/transactions?limit=${limit}`,
    token,
  );

  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.transactions || [];
}

/**
 * Search for flights via API (for test data validation)
 */
export async function searchFlights(
  token: string,
  searchParams: FlightSearchParams,
): Promise<FlightOffer[]> {
  const response = await makeAuthenticatedRequest(
    "/api/flights/search",
    token,
    {
      method: "POST",
      body: JSON.stringify(searchParams),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to search flights: ${response.statusText}`);
  }

  const data = await response.json();
  return data.offers || data.results || [];
}

/**
 * Search for hotels via API (for test data validation)
 */
export async function searchHotels(
  token: string,
  searchParams: HotelSearchParams,
): Promise<HotelOffer[]> {
  const response = await makeAuthenticatedRequest("/api/hotels/search", token, {
    method: "POST",
    body: JSON.stringify(searchParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to search hotels: ${response.statusText}`);
  }

  const data = await response.json();
  return data.offers || data.results || [];
}

/**
 * Verify payment via API (test mode)
 */
export async function verifyPayment(
  token: string,
  paymentIntentId: string,
): Promise<PaymentStatus> {
  const response = await makeAuthenticatedRequest(
    `/api/payments/${paymentIntentId}`,
    token,
  );

  if (!response.ok) {
    throw new Error(`Failed to verify payment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Wait for async operation to complete (e.g., booking confirmation)
 */
export async function waitForAsyncOperation(
  checkFn: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await checkFn()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Operation timed out after ${timeout}ms`);
}

/**
 * Wait for booking to reach specific status
 */
export async function waitForBookingStatus(
  token: string,
  bookingReference: string,
  expectedStatus: string,
  timeout: number = 30000,
): Promise<void> {
  await waitForAsyncOperation(async () => {
    try {
      const booking = await getBooking(token, bookingReference);
      return booking.status === expectedStatus;
    } catch {
      return false;
    }
  }, timeout);
}

/**
 * Cleanup test data via API
 */
export async function cleanupTestBookings(
  token: string,
  bookingReferences: string[],
): Promise<void> {
  const promises = bookingReferences.map((ref) =>
    cancelBooking(token, ref).catch((err) =>
      console.warn(`Failed to cleanup booking ${ref}:`, err.message),
    ),
  );

  await Promise.all(promises);
}

/**
 * Health check for backend services
 */
export async function checkServiceHealth(): Promise<ServiceHealthStatus> {
  try {
    const response = await fetch(
      `${API_CONFIG.bookingService.baseURL}/api/health`,
    );

    if (!response.ok) {
      return { healthy: false, message: "Service unhealthy" };
    }

    const data = await response.json();
    return { healthy: true, ...data };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Type Definitions
 */
export interface BookingData {
  type: "flight" | "hotel";
  searchParams: Record<string, any>;
  passengers?: Record<string, any>[];
  paymentMethod: string;
  paymentDetails?: Record<string, any>;
}

export interface BookingResponse {
  bookingReference: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  [key: string]: any;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms: number;
}

export interface FlightOffer {
  id: string;
  price: number;
  airline: string;
  [key: string]: any;
}

export interface HotelOffer {
  id: string;
  price: number;
  name: string;
  [key: string]: any;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface PaymentStatus {
  status: string;
  amount: number;
  currency: string;
  [key: string]: any;
}

export interface ServiceHealthStatus {
  healthy: boolean;
  message?: string;
  [key: string]: any;
}

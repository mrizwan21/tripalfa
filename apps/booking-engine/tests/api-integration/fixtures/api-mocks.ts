/**
 * API Mock Fixtures
 *
 * Predefined API mock responses for common scenarios.
 * Use these to mock API responses in your E2E tests.
 *
 * @module api-integration/fixtures/api-mocks
 */

import { ApiMockBuilder } from "../api-test-helpers";

/**
 * Authentication API Mocks
 */
export const authMocks = {
  /**
   * Successful login response
   */
  loginSuccess: (overrides?: Partial<LoginResponse>) => {
    return new ApiMockBuilder()
      .withData({
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        expiresIn: 3600,
        userId: "user_" + Math.random().toString(36).substr(2, 9),
        email: "test.user@tripalfa.com",
        role: "CUSTOMER",
        ...overrides,
      })
      .withStatus(200)
      .build();
  },

  /**
   * Failed login response (invalid credentials)
   */
  loginFailed: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      })
      .withStatus(401)
      .build();
  },

  /**
   * Token refresh response
   */
  tokenRefresh: () => {
    return new ApiMockBuilder()
      .withData({
        accessToken: "new_mock_access_token_" + Date.now(),
        expiresIn: 3600,
      })
      .withStatus(200)
      .build();
  },

  /**
   * Logout success response
   */
  logoutSuccess: () => {
    return new ApiMockBuilder()
      .withData({
        message: "Logged out successfully",
      })
      .withStatus(200)
      .build();
  },
};

/**
 * Flight Search API Mocks
 */
export const flightMocks = {
  /**
   * Successful flight search with results
   */
  searchSuccess: (offerCount: number = 5) => {
    const offers = Array.from({ length: offerCount }, (_, i) => ({
      id: `flight_offer_${i}`,
      price: 100 + i * 50 + Math.random() * 50,
      currency: "USD",
      airline: ["American Airlines", "Delta", "United", "Southwest"][i % 4],
      flightNumber: `AA${100 + i}`,
      origin: "JFK",
      destination: "LAX",
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      duration: "5h 30m",
      stops: 0,
      availableSeats: 10 - i,
    }));

    return new ApiMockBuilder()
      .withData({
        offers,
        meta: {
          total: offerCount,
          page: 1,
          limit: 20,
        },
      })
      .withStatus(200)
      .build();
  },

  /**
   * Empty flight search results
   */
  searchEmpty: () => {
    return new ApiMockBuilder()
      .withData({
        offers: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
        },
        message: "No flights found for the selected criteria",
      })
      .withStatus(200)
      .build();
  },

  /**
   * Flight search error
   */
  searchError: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "SEARCH_ERROR",
          message: "Unable to search flights at this time",
          details: {
            reason: "External service unavailable",
          },
        },
      })
      .withStatus(503)
      .build();
  },

  /**
   * Flight booking success
   */
  bookingSuccess: (bookingRef?: string) => {
    return new ApiMockBuilder()
      .withData({
        bookingReference:
          bookingRef ||
          "FL" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        status: "CONFIRMED",
        totalAmount: 450.0,
        currency: "USD",
        createdAt: new Date().toISOString(),
        flightDetails: {
          airline: "American Airlines",
          flightNumber: "AA123",
          origin: "JFK",
          destination: "LAX",
          departureTime: new Date(Date.now() + 86400000).toISOString(),
          arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        },
      })
      .withStatus(201)
      .build();
  },

  /**
   * Flight booking error (insufficient seats)
   */
  bookingErrorSeats: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "INSUFFICIENT_SEATS",
          message: "Not enough seats available for this flight",
          details: {
            availableSeats: 2,
            requestedSeats: 4,
          },
        },
      })
      .withStatus(409)
      .build();
  },
};

/**
 * Hotel Search API Mocks
 */
export const hotelMocks = {
  /**
   * Successful hotel search with results
   */
  searchSuccess: (hotelCount: number = 5) => {
    const hotels = Array.from({ length: hotelCount }, (_, i) => ({
      id: `hotel_${i}`,
      name: `Hotel ${String.fromCharCode(65 + i)}`,
      price: 80 + i * 30 + Math.random() * 20,
      currency: "USD",
      rating: 3 + Math.random() * 2,
      address: `${100 + i} Main Street, City`,
      amenities: ["WiFi", "Pool", "Gym", "Restaurant"].slice(0, i + 1),
      availableRooms: 5 - i,
    }));

    return new ApiMockBuilder()
      .withData({
        offers: hotels,
        meta: {
          total: hotelCount,
          page: 1,
          limit: 20,
        },
      })
      .withStatus(200)
      .build();
  },

  /**
   * Empty hotel search results
   */
  searchEmpty: () => {
    return new ApiMockBuilder()
      .withData({
        offers: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
        },
        message: "No hotels found for the selected criteria",
      })
      .withStatus(200)
      .build();
  },

  /**
   * Hotel booking success
   */
  bookingSuccess: (bookingRef?: string) => {
    return new ApiMockBuilder()
      .withData({
        bookingReference:
          bookingRef ||
          "HT" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        status: "CONFIRMED",
        totalAmount: 350.0,
        currency: "USD",
        createdAt: new Date().toISOString(),
        hotelDetails: {
          name: "Grand Hotel",
          address: "123 Main Street, City",
          checkIn: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          checkOut: new Date(Date.now() + 172800000)
            .toISOString()
            .split("T")[0],
          rooms: 2,
        },
      })
      .withStatus(201)
      .build();
  },
};

/**
 * Wallet API Mocks
 */
export const walletMocks = {
  /**
   * Get wallet balance success
   */
  balanceSuccess: (balance: number = 1000) => {
    return new ApiMockBuilder()
      .withData({
        balance,
        currency: "USD",
        lastUpdated: new Date().toISOString(),
      })
      .withStatus(200)
      .build();
  },

  /**
   * Wallet top-up success
   */
  topUpSuccess: (amount: number) => {
    return new ApiMockBuilder()
      .withData({
        transactionId: "txn_" + Date.now(),
        amount,
        currency: "USD",
        newBalance: 1000 + amount,
        status: "COMPLETED",
        timestamp: new Date().toISOString(),
      })
      .withStatus(200)
      .build();
  },

  /**
   * Wallet transactions list
   */
  transactionsSuccess: (count: number = 5) => {
    const transactions = Array.from({ length: count }, (_, i) => ({
      id: `txn_${Date.now()}_${i}`,
      type: ["TOP_UP", "PAYMENT", "REFUND"][i % 3],
      amount: 50 + i * 25,
      currency: "USD",
      status: "COMPLETED",
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      description: `Transaction ${i + 1}`,
    }));

    return new ApiMockBuilder()
      .withData({
        transactions,
        meta: {
          total: count,
          page: 1,
          limit: 20,
        },
      })
      .withStatus(200)
      .build();
  },

  /**
   * Insufficient balance error
   */
  insufficientBalance: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: "Insufficient wallet balance for this transaction",
          details: {
            currentBalance: 50,
            requiredAmount: 450,
          },
        },
      })
      .withStatus(400)
      .build();
  },
};

/**
 * Payment API Mocks
 */
export const paymentMocks = {
  /**
   * Payment intent creation success
   */
  intentSuccess: (amount: number) => {
    return new ApiMockBuilder()
      .withData({
        paymentIntentId: "pi_" + Math.random().toString(36).substr(2, 10),
        clientSecret: "pi_secret_" + Math.random().toString(36).substr(2, 20),
        amount,
        currency: "USD",
        status: "requires_payment_method",
        createdAt: new Date().toISOString(),
      })
      .withStatus(200)
      .build();
  },

  /**
   * Payment confirmation success
   */
  confirmationSuccess: () => {
    return new ApiMockBuilder()
      .withData({
        paymentIntentId: "pi_" + Math.random().toString(36).substr(2, 10),
        status: "succeeded",
        amount: 450.0,
        currency: "USD",
        receiptUrl: "https://receipts.tripalfa.com/r/" + Date.now(),
        confirmedAt: new Date().toISOString(),
      })
      .withStatus(200)
      .build();
  },

  /**
   * Payment declined
   */
  paymentDeclined: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "PAYMENT_DECLINED",
          message: "Your card was declined",
          declineCode: "card_declined",
        },
      })
      .withStatus(402)
      .build();
  },

  /**
   * Payment requires 3D Secure
   */
  requires3DSecure: () => {
    return new ApiMockBuilder()
      .withData({
        paymentIntentId: "pi_" + Math.random().toString(36).substr(2, 10),
        status: "requires_action",
        nextAction: {
          type: "use_stripe_sdk",
          stripeSdk: {
            type: "three_d_secure_redirect",
            stripeJs: "...",
          },
        },
      })
      .withStatus(200)
      .build();
  },
};

/**
 * Booking Management API Mocks
 */
export const bookingMocks = {
  /**
   * Get booking details success
   */
  getBookingSuccess: (status: string = "CONFIRMED") => {
    return new ApiMockBuilder()
      .withData({
        bookingReference:
          "BK" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        status,
        type: "FLIGHT",
        totalAmount: 450.0,
        currency: "USD",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        passengers: [
          {
            firstName: "John",
            lastName: "Doe",
            type: "ADULT",
          },
        ],
        paymentStatus: "PAID",
      })
      .withStatus(200)
      .build();
  },

  /**
   * Cancel booking success
   */
  cancelSuccess: () => {
    return new ApiMockBuilder()
      .withData({
        bookingReference:
          "BK" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        status: "CANCELLED",
        cancellationFee: 0,
        refundAmount: 450.0,
        refundCurrency: "USD",
        cancelledAt: new Date().toISOString(),
      })
      .withStatus(200)
      .build();
  },

  /**
   * Booking not found
   */
  bookingNotFound: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      })
      .withStatus(404)
      .build();
  },

  /**
   * List user bookings
   */
  listBookings: (count: number = 3) => {
    const bookings = Array.from({ length: count }, (_, i) => ({
      bookingReference:
        "BK" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: ["CONFIRMED", "PENDING", "COMPLETED"][i % 3],
      type: ["FLIGHT", "HOTEL"][i % 2],
      totalAmount: 200 + i * 100,
      currency: "USD",
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));

    return new ApiMockBuilder()
      .withData({
        bookings,
        meta: {
          total: count,
          page: 1,
          limit: 20,
        },
      })
      .withStatus(200)
      .build();
  },
};

/**
 * Health Check API Mocks
 */
export const healthMocks = {
  /**
   * Service healthy
   */
  healthy: () => {
    return new ApiMockBuilder()
      .withData({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          cache: "connected",
          externalApis: "operational",
        },
        version: "1.0.0",
      })
      .withStatus(200)
      .build();
  },

  /**
   * Service unhealthy
   */
  unhealthy: () => {
    return new ApiMockBuilder()
      .withData({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          cache: "connected",
          externalApis: "degraded",
        },
        errors: ["Database connection timeout"],
      })
      .withStatus(503)
      .build();
  },
};

/**
 * Network Error Mocks
 */
export const networkErrorMocks = {
  /**
   * Timeout error
   */
  timeout: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "REQUEST_TIMEOUT",
          message: "The request timed out",
        },
      })
      .withStatus(408)
      .withDelay(30000) // Simulate timeout
      .build();
  },

  /**
   * Rate limit error
   */
  rateLimit: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests",
        },
      })
      .withStatus(429)
      .withHeaders({
        "Retry-After": "60",
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
      })
      .build();
  },

  /**
   * Server error
   */
  serverError: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      })
      .withStatus(500)
      .build();
  },

  /**
   * Service unavailable
   */
  serviceUnavailable: () => {
    return new ApiMockBuilder()
      .withData({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable",
        },
      })
      .withStatus(503)
      .build();
  },
};

/**
 * Type Definitions
 */
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  role: string;
}

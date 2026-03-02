/**
 * API Test Data Management
 *
 * Manages test data for API integration tests.
 * Provides utilities for creating, seeding, and cleaning up test data via API calls.
 *
 * @module api-integration/api-test-data
 */

import { ApiAuthManager } from "./api-auth";
import { API_ENDPOINTS } from "./api-test-helpers";
import { faker } from "@faker-js/faker";

/**
 * Test Data Configuration
 */
export const TEST_DATA_CONFIG = {
  // Default test data values
  defaults: {
    currency: "USD",
    country: "US",
    language: "en",
    timezone: "America/New_York",
  },
  // Test data prefixes for easy identification
  prefixes: {
    email: "test.api",
    bookingRef: "TEST",
    phone: "+1-TEST",
  },
  // Cleanup settings
  cleanup: {
    enabled: true,
    retryAttempts: 3,
    batchSize: 10,
  },
} as const;

/**
 * API Test Data Manager
 * Manages creation and cleanup of test data via API calls
 */
export class ApiTestDataManager {
  private authManager: any;
  private baseURL: string;
  private createdRecords: Map<string, string[]> = new Map();

  constructor(
    authManager: any,
    baseURL: string = process.env.API_URL || "http://localhost:3003",
  ) {
    this.authManager = authManager;
    this.baseURL = baseURL;
  }

  /**
   * Create a test user via API
   */
  async createTestUser(
    userData?: Partial<TestUserData>,
  ): Promise<TestUserData> {
    const user: TestUserData = {
      email: userData?.email || this.generateTestEmail(),
      password: userData?.password || "Test@1234",
      firstName: userData?.firstName || faker.person.firstName(),
      lastName: userData?.lastName || faker.person.lastName(),
      phone: userData?.phone || faker.phone.number(),
      role: userData?.role || "CUSTOMER",
      isVerified: userData?.isVerified ?? true,
      ...userData,
    };

    try {
      const headers = await this.authManager.getAuthHeaders("admin");

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.auth.register}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(user),
        },
      );

      if (!response.ok) {
        // If user already exists, try to get their info
        if (response.status === 409) {
          console.log(`⚠️  User already exists: ${user.email}`);
          return user;
        }
        throw new Error(`Failed to create test user: ${response.statusText}`);
      }

      const data = await response.json();
      const userId = data.userId || data.id;

      this.trackRecord("users", userId);
      console.log(`✅ Created test user: ${user.email} (${userId})`);

      return { ...user, id: userId };
    } catch (error) {
      console.error(`❌ Error creating test user:`, error);
      throw error;
    }
  }

  /**
   * Create a test booking via API
   */
  async createTestBooking(
    userKey: string = "default",
    bookingData?: Partial<TestBookingData>,
  ): Promise<TestBookingData> {
    const booking: TestBookingData = {
      type: bookingData?.type || "FLIGHT",
      status: bookingData?.status || "PENDING",
      totalAmount:
        bookingData?.totalAmount ||
        faker.number.float({ min: 100, max: 2000, multipleOf: 0.01 }),
      currency: bookingData?.currency || TEST_DATA_CONFIG.defaults.currency,
      passengers: bookingData?.passengers || [this.generatePassenger()],
      searchParams:
        bookingData?.searchParams || this.generateFlightSearchParams(),
      ...bookingData,
    };

    try {
      const headers = await this.authManager.getAuthHeaders(userKey);

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.bookings.create}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(booking),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create test booking: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const bookingRef = data.bookingReference;

      this.trackRecord("bookings", bookingRef);
      console.log(`✅ Created test booking: ${bookingRef}`);

      return { ...booking, bookingReference: bookingRef, id: data.id };
    } catch (error) {
      console.error(`❌ Error creating test booking:`, error);
      throw error;
    }
  }

  /**
   * Create test wallet with balance
   */
  async createTestWallet(
    userKey: string = "default",
    initialBalance: number = 1000,
  ): Promise<TestWalletData> {
    try {
      const headers = await this.authManager.getAuthHeaders(userKey);

      // Add funds to wallet
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.wallet.topUp}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            amount: initialBalance,
            currency: TEST_DATA_CONFIG.defaults.currency,
            paymentMethod: "test_card",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to create test wallet: ${response.statusText}`);
      }

      const data = await response.json();
      const walletId = data.walletId || data.id;

      this.trackRecord("wallets", walletId);
      console.log(
        `✅ Created test wallet with balance: ${initialBalance} ${TEST_DATA_CONFIG.defaults.currency}`,
      );

      return {
        id: walletId,
        balance: initialBalance,
        currency: TEST_DATA_CONFIG.defaults.currency,
      };
    } catch (error) {
      console.error(`❌ Error creating test wallet:`, error);
      throw error;
    }
  }

  /**
   * Create test payment intent
   */
  async createTestPaymentIntent(
    userKey: string = "default",
    amount: number,
    currency: string = TEST_DATA_CONFIG.defaults.currency,
  ): Promise<TestPaymentData> {
    try {
      const headers = await this.authManager.getAuthHeaders(userKey);

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.payments.intent}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ amount, currency }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create payment intent: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const paymentIntentId = data.paymentIntentId || data.id;

      this.trackRecord("payments", paymentIntentId);
      console.log(`✅ Created test payment intent: ${paymentIntentId}`);

      return {
        id: paymentIntentId,
        amount,
        currency,
        status: data.status || "requires_payment_method",
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error(`❌ Error creating test payment intent:`, error);
      throw error;
    }
  }

  /**
   * Seed multiple test bookings
   */
  async seedTestBookings(
    userKey: string = "default",
    count: number = 5,
    options: {
      types?: Array<"FLIGHT" | "HOTEL">;
      statuses?: string[];
      minAmount?: number;
      maxAmount?: number;
    } = {},
  ): Promise<TestBookingData[]> {
    const {
      types = ["FLIGHT", "HOTEL"],
      statuses = ["CONFIRMED", "PENDING", "COMPLETED"],
      minAmount = 100,
      maxAmount = 2000,
    } = options;

    const bookings: TestBookingData[] = [];

    console.log(`🌱 Seeding ${count} test bookings...`);

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const status = statuses[i % statuses.length];

      const booking = await this.createTestBooking(userKey, {
        type,
        status,
        totalAmount: faker.number.float({
          min: minAmount,
          max: maxAmount,
          multipleOf: 0.01,
        }),
        searchParams:
          type === "FLIGHT"
            ? this.generateFlightSearchParams()
            : this.generateHotelSearchParams(),
      });

      bookings.push(booking);
    }

    console.log(`✅ Seeded ${bookings.length} test bookings`);
    return bookings;
  }

  /**
   * Cleanup all created test data
   */
  async cleanupAll(): Promise<void> {
    if (!TEST_DATA_CONFIG.cleanup.enabled) {
      console.log("🧹 Cleanup disabled, skipping...");
      return;
    }

    console.log("🧹 Starting test data cleanup...");

    // Cleanup in reverse order of dependencies
    await this.cleanupBookings();
    await this.cleanupWallets();
    await this.cleanupUsers();

    this.createdRecords.clear();
    console.log("✅ Test data cleanup completed");
  }

  /**
   * Cleanup test bookings
   */
  private async cleanupBookings(): Promise<void> {
    const bookingRefs = this.createdRecords.get("bookings") || [];
    if (bookingRefs.length === 0) return;

    console.log(`  🗑️  Cleaning up ${bookingRefs.length} test bookings...`);

    const headers = await this.authManager
      .getAuthHeaders("admin")
      .catch(() => null);
    if (!headers) {
      console.warn(
        "  ⚠️  Could not get admin headers, skipping booking cleanup",
      );
      return;
    }

    for (const ref of bookingRefs) {
      try {
        await fetch(`${this.baseURL}${API_ENDPOINTS.bookings.cancel(ref)}`, {
          method: "POST",
          headers,
        });
      } catch (error) {
        console.warn(`  ⚠️  Failed to cancel booking ${ref}:`, error);
      }
    }
  }

  /**
   * Cleanup test wallets
   */
  private async cleanupWallets(): Promise<void> {
    const walletIds = this.createdRecords.get("wallets") || [];
    if (walletIds.length === 0) return;

    console.log(`  🗑️  Cleaning up ${walletIds.length} test wallets...`);
    // Wallet cleanup logic depends on your API
    // This is a placeholder - implement based on your wallet service
  }

  /**
   * Cleanup test users
   */
  private async cleanupUsers(): Promise<void> {
    const userIds = this.createdRecords.get("users") || [];
    if (userIds.length === 0) return;

    console.log(`  🗑️  Cleaning up ${userIds.length} test users...`);
    // User cleanup logic depends on your API
    // This is a placeholder - implement based on your user service
  }

  /**
   * Track a created record for cleanup
   */
  private trackRecord(type: string, id: string): void {
    if (!this.createdRecords.has(type)) {
      this.createdRecords.set(type, []);
    }
    this.createdRecords.get(type)!.push(id);
  }

  /**
   * Generate test email address
   */
  private generateTestEmail(): string {
    const timestamp = Date.now();
    const random = faker.string.alphanumeric(6);
    return `${TEST_DATA_CONFIG.prefixes.email}.${timestamp}.${random}@tripalfa.com`;
  }

  /**
   * Generate passenger data
   */
  private generatePassenger(): PassengerData {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date
        .birthdate({ min: 18, max: 65, mode: "age" })
        .toISOString()
        .split("T")[0],
      passportNumber: faker.string.alphanumeric(9).toUpperCase(),
      nationality: faker.location.countryCode(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    };
  }

  /**
   * Generate flight search parameters
   */
  private generateFlightSearchParams(): FlightSearchParams {
    const departureDate = faker.date.future({ years: 1 });
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 7);

    return {
      origin: faker.airline.airport().iataCode,
      destination: faker.airline.airport().iataCode,
      departureDate: departureDate.toISOString().split("T")[0],
      returnDate: returnDate.toISOString().split("T")[0],
      passengers: faker.number.int({ min: 1, max: 4 }),
      class: ["ECONOMY", "BUSINESS", "FIRST"][
        faker.number.int({ min: 0, max: 2 })
      ],
    };
  }

  /**
   * Generate hotel search parameters
   */
  private generateHotelSearchParams(): HotelSearchParams {
    const checkIn = faker.date.future({ years: 1 });
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 7 }));

    return {
      destination: faker.location.city(),
      checkIn: checkIn.toISOString().split("T")[0],
      checkOut: checkOut.toISOString().split("T")[0],
      adults: faker.number.int({ min: 1, max: 4 }),
      children: faker.number.int({ min: 0, max: 2 }),
      rooms: faker.number.int({ min: 1, max: 2 }),
    };
  }

  /**
   * Get all tracked records
   */
  getTrackedRecords(): Map<string, string[]> {
    return new Map(this.createdRecords);
  }

  /**
   * Get count of tracked records by type
   */
  getRecordCount(type?: string): number {
    if (type) {
      return this.createdRecords.get(type)?.length || 0;
    }
    return Array.from(this.createdRecords.values()).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
  }
}

/**
 * Test Data Types
 */
export interface TestUserData {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isVerified?: boolean;
}

export interface TestBookingData {
  id?: string;
  bookingReference?: string;
  type: "FLIGHT" | "HOTEL";
  status: string;
  totalAmount: number;
  currency?: string;
  passengers?: PassengerData[];
  searchParams?: FlightSearchParams | HotelSearchParams;
  createdAt?: string;
}

export interface TestWalletData {
  id: string;
  balance: number;
  currency: string;
}

export interface TestPaymentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface PassengerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
  email: string;
  phone: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  class: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

/**
 * Test Data Factory for API Tests
 * Provides static methods for generating test data
 */
export class ApiTestDataFactory {
  /**
   * Generate test card data
   */
  static generateTestCard(
    type: "success" | "declined" | "insufficient_funds" = "success",
  ): TestCardData {
    const testCards = {
      success: "4242424242424242",
      declined: "4000000000000002",
      insufficient_funds: "4000000000009995",
    };

    return {
      number: testCards[type],
      expiryMonth: "12",
      expiryYear: "2028",
      cvc: "123",
      holderName: faker.person.fullName(),
    };
  }

  /**
   * Generate test address
   */
  static generateTestAddress(): TestAddressData {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: TEST_DATA_CONFIG.defaults.country,
    };
  }

  /**
   * Generate test flight offer
   */
  static generateTestFlightOffer(): TestFlightOffer {
    return {
      id: faker.string.uuid(),
      price: faker.number.float({ min: 100, max: 2000, multipleOf: 0.01 }),
      currency: TEST_DATA_CONFIG.defaults.currency,
      airline: faker.airline.airline().name,
      flightNumber: faker.airline.flightNumber(),
      origin: faker.airline.airport().iataCode,
      destination: faker.airline.airport().iataCode,
      departureTime: faker.date.future().toISOString(),
      arrivalTime: faker.date.future().toISOString(),
      duration: `${faker.number.int({ min: 1, max: 12 })}h ${faker.number.int({ min: 0, max: 59 })}m`,
    };
  }

  /**
   * Generate test hotel offer
   */
  static generateTestHotelOffer(): TestHotelOffer {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + " Hotel",
      price: faker.number.float({ min: 50, max: 500, multipleOf: 0.01 }),
      currency: TEST_DATA_CONFIG.defaults.currency,
      rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      amenities: Array.from({ length: 5 }, () => faker.word.sample()),
    };
  }
}

export interface TestCardData {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  holderName: string;
}

export interface TestAddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface TestFlightOffer {
  id: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
}

export interface TestHotelOffer {
  id: string;
  name: string;
  price: number;
  currency: string;
  rating: number;
  address: string;
  city: string;
  amenities: string[];
}

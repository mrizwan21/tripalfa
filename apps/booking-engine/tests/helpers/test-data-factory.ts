import { faker } from "@faker-js/faker";

/**
 * Test Data Factory
 *
 * Generates dynamic test data using Faker.js
 * Useful for tests that need unique data or random variations
 */

export class TestDataFactory {
  /**
   * Generate a random test user
   */
  static generateUser(
    overrides?: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
    }>,
  ) {
    return {
      email: faker.internet.email({ provider: "tripalfa.com" }),
      password: "Test@1234",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      ...overrides,
    };
  }

  /**
   * Generate a random booking
   */
  static generateBooking(
    userId: string,
    overrides?: Partial<{
      type: "FLIGHT" | "HOTEL";
      status: string;
      totalAmount: number;
    }>,
  ) {
    return {
      userId,
      type: "FLIGHT" as const,
      status: "CONFIRMED",
      totalAmount: faker.number.float({
        min: 100,
        max: 2000,
        multipleOf: 0.01,
      }),
      bookingReference: faker.string.alphanumeric(6).toUpperCase(),
      bookingData: {},
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate flight search parameters
   */
  static generateFlightSearch(
    overrides?: Partial<{
      origin: string;
      destination: string;
      departureDate: string;
      returnDate: string;
      passengers: number;
    }>,
  ) {
    const departureDate = faker.date.future();
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 7);

    return {
      origin: faker.airline.airport().iataCode,
      destination: faker.airline.airport().iataCode,
      departureDate: departureDate.toISOString().split("T")[0],
      returnDate: returnDate.toISOString().split("T")[0],
      passengers: faker.number.int({ min: 1, max: 4 }),
      ...overrides,
    };
  }

  /**
   * Generate hotel search parameters
   */
  static generateHotelSearch(
    overrides?: Partial<{
      destination: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
      rooms: number;
    }>,
  ) {
    const checkInDate = faker.date.future();
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 3);

    return {
      destination: faker.location.city(),
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      guests: faker.number.int({ min: 1, max: 4 }),
      rooms: faker.number.int({ min: 1, max: 2 }),
      ...overrides,
    };
  }

  /**
   * Generate passenger details
   */
  static generatePassenger(
    overrides?: Partial<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      passportNumber: string;
      email: string;
      phone: string;
    }>,
  ) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date
        .birthdate({ min: 18, max: 65, mode: "age" })
        .toISOString()
        .split("T")[0],
      passportNumber: faker.string.alphanumeric(9).toUpperCase(),
      email: faker.internet.email({ provider: "test.com" }),
      phone: faker.phone.number(),
      ...overrides,
    };
  }

  /**
   * Generate payment card details (test cards)
   */
  static generateTestCard(
    type: "success" | "declined" | "insufficient_funds" = "success",
  ) {
    const testCards = {
      success: "4242424242424242",
      declined: "4000000000000002",
      insufficient_funds: "4000000000009995",
    };

    return {
      cardNumber: testCards[type],
      expiryMonth: "12",
      expiryYear: "2028",
      cvv: "123",
      cardholderName: faker.person.fullName(),
    };
  }

  /**
   * Generate wallet top-up amount
   */
  static generateTopUpAmount(min = 10, max = 1000) {
    return faker.number.float({ min, max, multipleOf: 0.01 });
  }

  /**
   * Generate booking reference
   */
  static generateBookingReference() {
    return faker.string.alphanumeric(6).toUpperCase();
  }
}

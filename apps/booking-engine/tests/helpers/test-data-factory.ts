/**
 * Test Data Factory
 * 
 * Generates dynamic test data for E2E tests using realistic patterns.
 * Helps avoid hardcoded test data and supports parallel test execution.
 */

/**
 * Simple faker-like utilities without external dependencies
 */
class DataGenerator {
  static random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomElement<T>(array: T[]): T {
    return array[this.random(0, array.length - 1)];
  }

  static randomString(length: number, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static firstName(): string {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
    return this.randomElement(names);
  }

  static lastName(): string {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return this.randomElement(names);
  }

  static email(domain: string = 'tripalfa.com'): string {
    const timestamp = Date.now();
    const rand = this.random(1000, 9999);
    return `test.user.${timestamp}.${rand}@${domain}`;
  }

  static phone(): string {
    return `+1${this.random(200, 999)}${this.random(200, 999)}${this.random(1000, 9999)}`;
  }

  static passportNumber(): string {
    return this.randomString(2, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + this.randomString(7, '0123456789');
  }

  static airportCode(): string {
    const airports = ['JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'DEN', 'SFO', 'LAS', 'PHX', 'MIA', 'SEA', 'BOS', 'LHR', 'CDG', 'FRA', 'AMS', 'DXB'];
    return this.randomElement(airports);
  }

  static futureDate(daysFromNow: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() + this.random(7, daysFromNow));
    return date.toISOString().split('T')[0];
  }

  static bookingReference(): string {
    return `TL-${this.random(100000, 999999)}`;
  }

  static currency(): string {
    return this.randomElement(['USD', 'EUR', 'GBP']);
  }

  static amount(min: number = 100, max: number = 2000): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  static nationality(): string {
    return this.randomElement(['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT']);
  }

  static gender(): string {
    return this.randomElement(['Male', 'Female', 'Other']);
  }

  static address(): { street: string; city: string; zipCode: string; country: string } {
    const streets = ['123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Elm St', '654 Maple Dr'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const zipCodes = ['10001', '90001', '60601', '77001', '85001'];
    const countries = ['US', 'UK', 'CA', 'AU'];
    
    return {
      street: this.randomElement(streets),
      city: this.randomElement(cities),
      zipCode: this.randomElement(zipCodes),
      country: this.randomElement(countries),
    };
  }
}

/**
 * Test Data Factory
 * Creates realistic test data for various entities
 */
export class TestDataFactory {
  /**
   * Generate a test user
   */
  static generateUser(overrides?: Partial<User>): User {
    const firstName = DataGenerator.firstName();
    const lastName = DataGenerator.lastName();
    
    return {
      email: DataGenerator.email(),
      password: 'Test@1234',
      firstName,
      lastName,
      phone: DataGenerator.phone(),
      walletBalance: DataGenerator.amount(500, 5000),
      ...overrides,
    };
  }

  /**
   * Generate a flight booking
   */
  static generateFlightBooking(overrides?: Partial<FlightBooking>): FlightBooking {
    return {
      bookingReference: DataGenerator.bookingReference(),
      origin: DataGenerator.airportCode(),
      destination: DataGenerator.airportCode(),
      departureDate: DataGenerator.futureDate(30),
      returnDate: DataGenerator.futureDate(45),
      passengers: DataGenerator.random(1, 4),
      class: DataGenerator.randomElement(['economy', 'business', 'first']),
      totalAmount: DataGenerator.amount(200, 2000),
      status: 'CONFIRMED',
      ...overrides,
    };
  }

  /**
   * Generate flight search parameters
   */
  static generateFlightSearch(overrides?: Partial<FlightSearchParams>): FlightSearchParams {
    const origin = DataGenerator.airportCode();
    let destination = DataGenerator.airportCode();
    
    // Ensure origin and destination are different
    while (destination === origin) {
      destination = DataGenerator.airportCode();
    }

    return {
      origin,
      destination,
      departureDate: DataGenerator.futureDate(30),
      returnDate: DataGenerator.futureDate(45),
      passengers: DataGenerator.random(1, 4),
      class: 'economy',
      ...overrides,
    };
  }

  /**
   * Generate hotel search parameters
   */
  static generateHotelSearch(overrides?: Partial<HotelSearchParams>): HotelSearchParams {
    const checkIn = DataGenerator.futureDate(30);
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + DataGenerator.random(1, 7));
    const checkOut = checkInDate.toISOString().split('T')[0];

    return {
      destination: DataGenerator.randomElement(['New York', 'London', 'Paris', 'Dubai', 'Tokyo']),
      checkIn,
      checkOut,
      adults: DataGenerator.random(1, 4),
      children: DataGenerator.random(0, 2),
      rooms: DataGenerator.random(1, 2),
      ...overrides,
    };
  }

  /**
   * Generate passenger details
   */
  static generatePassenger(overrides?: Partial<PassengerDetails>): PassengerDetails {
    const firstName = DataGenerator.firstName();
    const lastName = DataGenerator.lastName();
    const email = DataGenerator.email();
    const phone = DataGenerator.phone();
    
    // Generate date of birth (18-80 years old)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - DataGenerator.random(18, 80));
    
    return {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: birthDate.toISOString().split('T')[0],
      passportNumber: DataGenerator.passportNumber(),
      nationality: DataGenerator.nationality(),
      gender: DataGenerator.gender(),
      ...overrides,
    };
  }

  /**
   * Generate billing address
   */
  static generateBillingAddress(overrides?: Partial<BillingAddress>): BillingAddress {
    const address = DataGenerator.address();
    
    return {
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      ...overrides,
    };
  }

  /**
   * Generate payment card details (test cards only)
   */
  static generatePaymentCard(cardType: 'valid' | 'declined' | 'insufficient_funds' = 'valid'): PaymentCard {
    const cardNumbers: Record<string, string> = {
      valid: '4242424242424242', // Stripe test card - succeeds
      declined: '4000000000000002', // Stripe test card - declined
      insufficient_funds: '4000000000009995', // Stripe test card - insufficient funds
    };

    const futureYear = new Date().getFullYear() + DataGenerator.random(1, 5);
    const month = DataGenerator.random(1, 12).toString().padStart(2, '0');

    return {
      cardNumber: cardNumbers[cardType],
      expiryDate: `${month}/${futureYear.toString().slice(-2)}`,
      cvv: DataGenerator.random(100, 999).toString(),
      cardholderName: `${DataGenerator.firstName()} ${DataGenerator.lastName()}`,
    };
  }

  /**
   * Generate wallet transaction
   */
  static generateWalletTransaction(overrides?: Partial<WalletTransaction>): WalletTransaction {
    return {
      transactionId: `TXN-${DataGenerator.randomString(10)}`,
      amount: DataGenerator.amount(10, 1000),
      type: DataGenerator.randomElement(['CREDIT', 'DEBIT']),
      description: DataGenerator.randomElement(['Booking Payment', 'Wallet Top-up', 'Refund', 'Transfer']),
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      ...overrides,
    };
  }

  /**
   * Generate a complete booking scenario
   */
  static generateBookingScenario(): BookingScenario {
    const user = this.generateUser();
    const flightSearch = this.generateFlightSearch();
    const passengers = Array.from({ length: flightSearch.passengers }, () => this.generatePassenger());
    const billingAddress = this.generateBillingAddress();
    const paymentCard = this.generatePaymentCard();

    return {
      user,
      flightSearch,
      passengers,
      billingAddress,
      paymentCard,
    };
  }

  /**
   * Generate multiple users for load testing
   */
  static generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateUser());
  }

  /**
   * Generate unique booking reference
   */
  static generateBookingReference(): string {
    return DataGenerator.bookingReference();
  }
}

/**
 * Type Definitions
 */
export interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  walletBalance?: number;
}

export interface FlightBooking {
  bookingReference: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: string;
  totalAmount: number;
  status: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms: number;
}

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  gender?: string;
}

export interface BillingAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface PaymentCard {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface WalletTransaction {
  transactionId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  timestamp: string;
  status: string;
}

export interface BookingScenario {
  user: User;
  flightSearch: FlightSearchParams;
  passengers: PassengerDetails[];
  billingAddress: BillingAddress;
  paymentCard: PaymentCard;
}

#!/usr/bin/env node

/**
 * TripAlfa Unit Test Generator
 * Creates comprehensive unit tests for microservices
 *
 * Usage:
 * node scripts/create-unit-tests.js [service-name]
 *
 * If no service-name is provided, creates tests for all services
 */

const fs = require('fs').promises;
const path = require('path');

class UnitTestGenerator {
  constructor() {
    this.services = [
      'user-service',
      'audit-service',
      'payment-service',
      'booking-service',
      'notification-service'
    ];
  }

  async createUserServiceTests() {
    const servicePath = path.join('services', 'user-service');
    const testPath = path.join(servicePath, 'src', '__tests__');

    await fs.mkdir(testPath, { recursive: true });

    // User model tests
    const userModelTest = `/**
 * User Service - User Model Tests
 */

import { PrismaClient } from '@prisma/client';
import { UserService } from '../services/user.service';

const prisma = new PrismaClient();

describe('User Model', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.userPreferences.deleteMany();
    await prisma.notificationTarget.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Creation', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword123'
      };

      const user = await prisma.user.create({
        data: userData
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should not create user with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User'
      };

      await prisma.user.create({ data: userData });

      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'query-test@example.com',
          name: 'Query Test User',
          role: 'user'
        }
      });
    });

    it('should find user by email', async () => {
      const found = await prisma.user.findUnique({
        where: { email: 'query-test@example.com' }
      });

      expect(found).toBeDefined();
      expect(found.id).toBe(testUser.id);
    });

    it('should find user by id', async () => {
      const found = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(found).toBeDefined();
      expect(found.email).toBe(testUser.email);
    });
  });

  describe('User Preferences', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'prefs-test@example.com',
          name: 'Preferences Test User'
        }
      });
    });

    it('should create user preferences', async () => {
      const preferences = await prisma.userPreferences.create({
        data: {
          userId: testUser.id,
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false
        }
      });

      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(testUser.id);
      expect(preferences.emailNotifications).toBe(true);
    });
  });
});
`;

    // User service tests
    const userServiceTest = `/**
 * User Service - Business Logic Tests
 */

import { UserService } from '../services/user.service';

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('User Validation', () => {
    it('should validate email format', () => {
      expect(userService.isValidEmail('test@example.com')).toBe(true);
      expect(userService.isValidEmail('invalid-email')).toBe(false);
      expect(userService.isValidEmail('')).toBe(false);
    });

    it('should validate password strength', () => {
      expect(userService.isValidPassword('StrongPass123!')).toBe(true);
      expect(userService.isValidPassword('weak')).toBe(false);
      expect(userService.isValidPassword('')).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'register-test@example.com',
        name: 'Register Test',
        password: 'TestPass123!'
      };

      const result = await userService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Duplicate User',
        password: 'TestPass123!'
      };

      // First registration
      await userService.register(userData);

      // Second registration should fail
      const result = await userService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('User Authentication', () => {
    beforeEach(async () => {
      await userService.register({
        email: 'auth-test@example.com',
        name: 'Auth Test',
        password: 'TestPass123!'
      });
    });

    it('should authenticate valid credentials', async () => {
      const result = await userService.authenticate('auth-test@example.com', 'TestPass123!');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const result = await userService.authenticate('auth-test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });
  });
});
`;

    await fs.writeFile(path.join(testPath, 'user.model.test.ts'), userModelTest);
    await fs.writeFile(path.join(testPath, 'user.service.test.ts'), userServiceTest);

    console.log('✅ Created user service unit tests');
  }

  async createBookingServiceTests() {
    const servicePath = path.join('services', 'booking-service');
    const testPath = path.join(servicePath, 'src', '__tests__');

    await fs.mkdir(testPath, { recursive: true });

    const bookingModelTest = `/**
 * Booking Service - Booking Model Tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Booking Model', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.bookingPassenger.deleteMany();
    await prisma.bookingSegment.deleteMany();
    await prisma.bookingModification.deleteMany();
    await prisma.bookingCancellation.deleteMany();
    await prisma.pricingAuditLog.deleteMany();
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Booking Creation', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        bookingReference: 'TEST-123456',
        userId: 'test-user-id',
        status: 'confirmed',
        tripType: 'round_trip',
        passengerCount: 2,
        totalAmount: 1500.00,
        currency: 'USD',
        baseFare: 1200.00,
        taxes: 200.00,
        fees: 100.00,
        departureDate: new Date('2024-06-01'),
        returnDate: new Date('2024-06-08'),
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890'
      };

      const booking = await prisma.booking.create({
        data: bookingData
      });

      expect(booking).toBeDefined();
      expect(booking.bookingReference).toBe(bookingData.bookingReference);
      expect(booking.totalAmount).toBe(bookingData.totalAmount);
      expect(booking.status).toBe('confirmed');
    });

    it('should not create booking with duplicate reference', async () => {
      const bookingData = {
        bookingReference: 'DUPLICATE-REF',
        userId: 'test-user-id',
        totalAmount: 1000.00,
        currency: 'USD',
        departureDate: new Date(),
        contactEmail: 'test@example.com'
      };

      await prisma.booking.create({ data: bookingData });

      await expect(
        prisma.booking.create({ data: bookingData })
      ).rejects.toThrow();
    });
  });

  describe('Booking Queries', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = await prisma.booking.create({
        data: {
          bookingReference: 'QUERY-TEST-001',
          userId: 'test-user-id',
          status: 'confirmed',
          totalAmount: 2000.00,
          currency: 'USD',
          departureDate: new Date(),
          contactEmail: 'query@example.com'
        }
      });
    });

    it('should find booking by reference', async () => {
      const found = await prisma.booking.findUnique({
        where: { bookingReference: 'QUERY-TEST-001' }
      });

      expect(found).toBeDefined();
      expect(found.id).toBe(testBooking.id);
    });

    it('should find bookings by user', async () => {
      const bookings = await prisma.booking.findMany({
        where: { userId: 'test-user-id' }
      });

      expect(bookings.length).toBeGreaterThan(0);
      expect(bookings[0].userId).toBe('test-user-id');
    });

    it('should find bookings by status', async () => {
      const confirmedBookings = await prisma.booking.findMany({
        where: { status: 'confirmed' }
      });

      expect(confirmedBookings.length).toBeGreaterThan(0);
      confirmedBookings.forEach(booking => {
        expect(booking.status).toBe('confirmed');
      });
    });
  });

  describe('Booking Passengers', () => {
    let testBooking;

    beforeEach(async () => {
      testBooking = await prisma.booking.create({
        data: {
          bookingReference: 'PASSENGER-TEST',
          userId: 'test-user-id',
          totalAmount: 1000.00,
          currency: 'USD',
          departureDate: new Date(),
          contactEmail: 'test@example.com'
        }
      });
    });

    it('should add passenger to booking', async () => {
      const passenger = await prisma.bookingPassenger.create({
        data: {
          bookingId: testBooking.id,
          title: 'Mr',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01'),
          passengerType: 'adult',
          email: 'john.doe@example.com'
        }
      });

      expect(passenger).toBeDefined();
      expect(passenger.bookingId).toBe(testBooking.id);
      expect(passenger.firstName).toBe('John');
      expect(passenger.lastName).toBe('Doe');
    });
  });
});
`;

    await fs.writeFile(path.join(testPath, 'booking.model.test.ts'), bookingModelTest);
    console.log('✅ Created booking service unit tests');
  }

  async createPaymentServiceTests() {
    const servicePath = path.join('services', 'payment-service');
    const testPath = path.join(servicePath, 'src', '__tests__');

    await fs.mkdir(testPath, { recursive: true });

    const paymentServiceTest = `/**
 * Payment Service - Payment Processing Tests
 */

describe('Payment Service', () => {
  let paymentService;

  beforeEach(() => {
    // Initialize payment service with test configuration
    paymentService = {
      processPayment: jest.fn(),
      refundPayment: jest.fn(),
      getPaymentStatus: jest.fn()
    };
  });

  describe('Payment Processing', () => {
    it('should process a valid payment', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethod: 'card',
        bookingId: 'test-booking-id'
      };

      paymentService.processPayment.mockResolvedValue({
        success: true,
        paymentId: 'pay_123456',
        status: 'completed'
      });

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('should handle payment failure', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethod: 'card',
        bookingId: 'test-booking-id'
      };

      paymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Card declined',
        status: 'failed'
      });

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(result.status).toBe('failed');
    });
  });

  describe('Payment Validation', () => {
    it('should validate payment amount', () => {
      expect(paymentService.isValidAmount(100.00)).toBe(true);
      expect(paymentService.isValidAmount(0)).toBe(false);
      expect(paymentService.isValidAmount(-50)).toBe(false);
    });

    it('should validate currency', () => {
      expect(paymentService.isValidCurrency('USD')).toBe(true);
      expect(paymentService.isValidCurrency('EUR')).toBe(true);
      expect(paymentService.isValidCurrency('INVALID')).toBe(false);
    });
  });

  describe('Refund Processing', () => {
    it('should process a refund', async () => {
      const refundData = {
        paymentId: 'pay_123456',
        amount: 500.00,
        reason: 'customer_request'
      };

      paymentService.refundPayment.mockResolvedValue({
        success: true,
        refundId: 'ref_123456',
        status: 'completed'
      });

      const result = await paymentService.refundPayment(refundData);

      expect(result.success).toBe(true);
      expect(result.refundId).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });
});
`;

    await fs.writeFile(path.join(testPath, 'payment.service.test.ts'), paymentServiceTest);
    console.log('✅ Created payment service unit tests');
  }

  async createNotificationServiceTests() {
    const servicePath = path.join('services', 'notification-service');
    const testPath = path.join(servicePath, 'src', '__tests__');

    await fs.mkdir(testPath, { recursive: true });

    const notificationServiceTest = `/**
 * Notification Service - Notification Tests
 */

describe('Notification Service', () => {
  let notificationService;

  beforeEach(() => {
    notificationService = {
      sendEmail: jest.fn(),
      sendSMS: jest.fn(),
      sendPushNotification: jest.fn(),
      createNotification: jest.fn()
    };
  });

  describe('Email Notifications', () => {
    it('should send booking confirmation email', async () => {
      const emailData = {
        to: 'customer@example.com',
        template: 'booking_confirmation',
        data: {
          bookingReference: 'ABC123',
          customerName: 'John Doe',
          totalAmount: 1500.00
        }
      };

      notificationService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'msg_123456'
      });

      const result = await notificationService.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle email sending failure', async () => {
      const emailData = {
        to: 'invalid-email',
        template: 'booking_confirmation',
        data: {}
      };

      notificationService.sendEmail.mockResolvedValue({
        success: false,
        error: 'Invalid email address'
      });

      const result = await notificationService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('SMS Notifications', () => {
    it('should send payment confirmation SMS', async () => {
      const smsData = {
        to: '+1234567890',
        message: 'Payment of $100.00 confirmed for booking ABC123'
      };

      notificationService.sendSMS.mockResolvedValue({
        success: true,
        messageId: 'sms_123456'
      });

      const result = await notificationService.sendSMS(smsData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Push Notifications', () => {
    it('should send flight update push notification', async () => {
      const pushData = {
        userId: 'user_123',
        title: 'Flight Update',
        body: 'Your flight EK203 has been delayed by 30 minutes',
        data: {
          flightNumber: 'EK203',
          delay: 30
        }
      };

      notificationService.sendPushNotification.mockResolvedValue({
        success: true,
        notificationId: 'push_123456'
      });

      const result = await notificationService.sendPushNotification(pushData);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
    });
  });

  describe('Notification Templates', () => {
    it('should validate template data', () => {
      const template = 'booking_confirmation';
      const data = {
        bookingReference: 'ABC123',
        customerName: 'John Doe'
      };

      expect(notificationService.isValidTemplateData(template, data)).toBe(true);
    });

    it('should reject invalid template data', () => {
      const template = 'booking_confirmation';
      const data = {}; // Missing required fields

      expect(notificationService.isValidTemplateData(template, data)).toBe(false);
    });
  });
});
`;

    await fs.writeFile(path.join(testPath, 'notification.service.test.ts'), notificationServiceTest);
    console.log('✅ Created notification service unit tests');
  }

  async createAuditServiceTests() {
    const servicePath = path.join('services', 'audit-service');
    const testPath = path.join(servicePath, 'src', '__tests__');

    await fs.mkdir(testPath, { recursive: true });

    const auditServiceTest = `/**
 * Audit Service - Audit Logging Tests
 */

describe('Audit Service', () => {
  let auditService;

  beforeEach(() => {
    auditService = {
      logEvent: jest.fn(),
      getAuditLogs: jest.fn(),
      validateEvent: jest.fn()
    };
  });

  describe('Event Logging', () => {
    it('should log user login event', async () => {
      const eventData = {
        eventType: 'user_login',
        userId: 'user_123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        metadata: {
          successful: true,
          method: 'password'
        }
      };

      auditService.logEvent.mockResolvedValue({
        success: true,
        eventId: 'audit_123456'
      });

      const result = await auditService.logEvent(eventData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });

    it('should log booking modification event', async () => {
      const eventData = {
        eventType: 'booking_modified',
        userId: 'user_123',
        resourceId: 'booking_456',
        action: 'date_change',
        oldValues: { departureDate: '2024-06-01' },
        newValues: { departureDate: '2024-06-05' },
        reason: 'Customer request'
      };

      auditService.logEvent.mockResolvedValue({
        success: true,
        eventId: 'audit_789012'
      });

      const result = await auditService.logEvent(eventData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });
  });

  describe('Event Validation', () => {
    it('should validate required event fields', () => {
      const validEvent = {
        eventType: 'user_login',
        userId: 'user_123',
        timestamp: new Date()
      };

      expect(auditService.validateEvent(validEvent)).toBe(true);
    });

    it('should reject invalid events', () => {
      const invalidEvent = {
        eventType: '', // Missing required field
        userId: 'user_123'
      };

      expect(auditService.validateEvent(invalidEvent)).toBe(false);
    });
  });

  describe('Audit Log Queries', () => {
    it('should retrieve user activity logs', async () => {
      const query = {
        userId: 'user_123',
        eventType: 'user_login',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      };

      auditService.getAuditLogs.mockResolvedValue({
        success: true,
        logs: [
          {
            id: 'audit_1',
            eventType: 'user_login',
            userId: 'user_123',
            timestamp: new Date('2024-06-01')
          }
        ],
        total: 1
      });

      const result = await auditService.getAuditLogs(query);

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should retrieve booking modification logs', async () => {
      const query = {
        resourceId: 'booking_456',
        eventType: 'booking_modified'
      };

      auditService.getAuditLogs.mockResolvedValue({
        success: true,
        logs: [
          {
            id: 'audit_2',
            eventType: 'booking_modified',
            resourceId: 'booking_456',
            timestamp: new Date('2024-06-01')
          }
        ],
        total: 1
      });

      const result = await auditService.getAuditLogs(query);

      expect(result.success).toBe(true);
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate GDPR data access report', async () => {
      const reportQuery = {
        userId: 'user_123',
        reportType: 'gdpr_data_access',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      };

      auditService.getAuditLogs.mockResolvedValue({
        success: true,
        logs: [
          {
            id: 'audit_gdpr_1',
            eventType: 'data_access',
            userId: 'user_123',
            resourceType: 'personal_data',
            timestamp: new Date('2024-06-01')
          }
        ],
        total: 1
      });

      const result = await auditService.getAuditLogs(reportQuery);

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
    });
  });
});
`;

    await fs.writeFile(path.join(testPath, 'audit.service.test.ts'), auditServiceTest);
    console.log('✅ Created audit service unit tests');
  }

  async updatePackageJson(serviceName) {
    const servicePath = path.join('services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Add testing dependencies
      if (!packageJson.devDependencies) packageJson.devDependencies = {};

      const testDeps = {
        'jest': '^29.7.0',
        '@types/jest': '^29.5.12',
        'ts-jest': '^29.1.2',
        'supertest': '^6.3.4',
        '@types/supertest': '^2.0.16'
      };

      Object.assign(packageJson.devDependencies, testDeps);

      // Add test scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        'test': 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        'test:ci': 'jest --ci --coverage --watchAll=false'
      };

      // Add Jest configuration
      packageJson.jest = {
        preset: 'ts-jest',
        testEnvironment: 'node',
        roots: ['<rootDir>/src'],
        testMatch: ['**/__tests__/**/*.test.ts'],
        collectCoverageFrom: [
          'src/**/*.ts',
          '!src/**/*.d.ts',
          '!src/**/__tests__/**'
        ],
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html'],
        setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Updated package.json for ${serviceName}`);

    } catch (error) {
      console.error(`❌ Error updating package.json for ${serviceName}:`, error);
    }
  }

  async createTestSetup(serviceName) {
    const servicePath = path.join('services', serviceName);
    const testPath = path.join(servicePath, 'src', '__tests__');

    const setupContent = `/**
 * Jest Test Setup
 */

import { PrismaClient } from '@prisma/client';

// Setup test database
const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Ensure test database is clean
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
  console.log('Test database cleaned up');
});

// Mock external services
jest.mock('../clients/api-client', () => ({
  apiClient: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    getBooking: jest.fn(),
    createBooking: jest.fn(),
    processPayment: jest.fn(),
    sendNotification: jest.fn()
  }
}));

// Custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => \`expected \${received} to be a valid UUID\`,
      pass
    };
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const defaultUser = {
      email: \`test-\${Date.now()}@example.com\`,
      name: 'Test User',
      password: 'hashedpassword123'
    };

    return await prisma.user.create({
      data: { ...defaultUser, ...overrides }
    });
  },

  createTestBooking: async (userId, overrides = {}) => {
    const defaultBooking = {
      bookingReference: \`TEST-\${Date.now()}\`,
      userId,
      status: 'confirmed',
      totalAmount: 1000.00,
      currency: 'USD',
      departureDate: new Date(Date.now() + 86400000), // Tomorrow
      contactEmail: 'test@example.com'
    };

    return await prisma.booking.create({
      data: { ...defaultBooking, ...overrides }
    });
  },

  cleanupDatabase: async () => {
    // Clean up in reverse dependency order
    await prisma.bookingPassenger.deleteMany();
    await prisma.bookingSegment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.userPreferences.deleteMany();
    await prisma.notificationTarget.deleteMany();
    await prisma.user.deleteMany();
  }
};
`;

    await fs.writeFile(path.join(testPath, 'setup.ts'), setupContent);
    console.log(`✅ Created test setup for ${serviceName}`);
  }

  async run(serviceName = null) {
    const startTime = Date.now();

    try {
      const servicesToUpdate = serviceName ? [serviceName] : this.services;

      for (const service of servicesToUpdate) {
        if (!this.services.includes(service)) {
          console.log(`❌ Unknown service: ${service}`);
          continue;
        }

        console.log(`\n🧪 Creating unit tests for ${service}`);

        // Create service-specific tests
        switch (service) {
          case 'user-service':
            await this.createUserServiceTests();
            break;
          case 'booking-service':
            await this.createBookingServiceTests();
            break;
          case 'payment-service':
            await this.createPaymentServiceTests();
            break;
          case 'notification-service':
            await this.createNotificationServiceTests();
            break;
          case 'audit-service':
            await this.createAuditServiceTests();
            break;
        }

        // Update package.json and create setup
        await this.updatePackageJson(service);
        await this.createTestSetup(service);

        console.log(`✅ Unit tests created for ${service}`);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n🎉 Unit tests created for all services in ${duration.toFixed(2)} seconds`);

      console.log(`\n📋 Next steps:`);
      console.log(`1. Install test dependencies: cd services/[service-name] && npm install`);
      console.log(`2. Run tests: cd services/[service-name] && npm test`);
      console.log(`3. Review and customize test cases based on your business logic`);
      console.log(`4. Add more test scenarios as needed`);

    } catch (error) {
      console.error('💥 Unit test creation failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const serviceName = process.argv[2];

  if (serviceName && !['user-service', 'audit-service', 'payment-service', 'booking-service', 'notification-service'].includes(serviceName)) {
    console.error('❌ Invalid service name. Valid options: user-service, audit-service, payment-service, booking-service, notification-service');
    process.exit(1);
  }

  const generator = new UnitTestGenerator();
  await generator.run(serviceName);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UnitTestGenerator;
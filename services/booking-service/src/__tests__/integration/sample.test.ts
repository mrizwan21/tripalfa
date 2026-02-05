import { describe, it, expect } from '@jest/globals';

/**
 * Sample integration test demonstrating the enhanced test infrastructure
 */

const INTEGRATION_DB = process.env.INTEGRATION_DB === 'true';

describe('Enhanced Test Utils', () => {
  // Skip HTTP tests when not running with a real server
  const itWithServer = INTEGRATION_DB ? it : it.skip;

  itWithServer('should create booking with admin auth', async () => {
    const customer = await global.makeCustomer();
    const token = global.createAdminToken();
    const bookingData = global.buildBookingRequest({ customerId: customer.id });

    const res = await global.postAuth('/api/admin/book', bookingData, 'admin');

    global.expectSuccess(res, 201);
    global.expectBookingResponse(res);
  });

  it('should validate booking request structure', () => {
    const bookingData = global.buildBookingRequest();

    expect(bookingData).toHaveProperty('customerId');
    expect(bookingData).toHaveProperty('segment');
    expect(bookingData).toHaveProperty('serviceType');
    expect(bookingData).toHaveProperty('customerPrice');
    expect(bookingData).toHaveProperty('currency');
  });

  it('should generate unique test data', () => {
    const email1 = global.generateUniqueEmail();
    const email2 = global.generateUniqueEmail();

    expect(email1).not.toBe(email2);
    expect(email1).toMatch(/test\.\d+@.*\.com/);
    expect(email2).toMatch(/test\.\d+@.*\.com/);
  });

  it('should create customer with proper structure', async () => {
    const customer = await global.makeCustomer({ name: 'Test User' });

    expect(customer).toHaveProperty('id');
    expect(customer).toHaveProperty('name', 'Test User');
    expect(customer).toHaveProperty('email');
    expect(customer).toHaveProperty('type');
  });

  it('should create supplier with proper structure', async () => {
    const supplier = await global.makeSupplier({ name: 'Test Airline' });

    expect(supplier).toHaveProperty('id');
    expect(supplier).toHaveProperty('name', 'Test Airline');
    expect(supplier).toHaveProperty('contactEmail');
    expect(supplier).toHaveProperty('type');
  });

  it('should create booking with decimal prices', async () => {
    const booking = await global.makeBooking();

    expect(booking).toHaveProperty('id');
    expect(booking).toHaveProperty('reference');
    expect(booking).toHaveProperty('customerPrice');
    expect(booking).toHaveProperty('supplierPrice');
    expect(booking).toHaveProperty('markup');
    expect(booking).toHaveProperty('taxes');
    expect(booking).toHaveProperty('fees');
  });

  it('should create auth tokens for different roles', () => {
    const adminToken = global.createAdminToken('admin-123');
    const agentToken = global.createAgentToken('agent-123');
    const supervisorToken = global.createSupervisorToken('supervisor-123');
    const managerToken = global.createManagerToken('manager-123');

    expect(typeof adminToken).toBe('string');
    expect(typeof agentToken).toBe('string');
    expect(typeof supervisorToken).toBe('string');
    expect(typeof managerToken).toBe('string');

    // Tokens should be different
    expect(adminToken).not.toBe(agentToken);
    expect(agentToken).not.toBe(supervisorToken);
    expect(supervisorToken).not.toBe(managerToken);
  });

  it('should generate realistic test data', () => {
    const phone = global.generatePhoneNumber();
    const pnr = global.generatePNR();
    const dateRange = global.generateDateRange();

    expect(phone).toMatch(/^\+1\d{10}$/);
    expect(pnr).toMatch(/^PNR[A-Z0-9]{6}$/);
    expect(dateRange).toHaveProperty('checkIn');
    expect(dateRange).toHaveProperty('checkOut');
    expect(new Date(dateRange.checkIn)).toBeInstanceOf(Date);
    expect(new Date(dateRange.checkOut)).toBeInstanceOf(Date);
  });
});
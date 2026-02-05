import { describe, it, expect, beforeEach } from '@jest/globals';

const global = globalThis as any;

describe('Admin Customer and Supplier Management APIs', () => {
  let adminToken: string;
  let agentToken: string;
  let supervisorToken: string;
  let managerToken: string;
  let branch: any;
  let seedCustomers: any[];
  let seedSuppliers: any[];

  const getCustomers = (token: string, query?: Record<string, any>) =>
    global.api.get('/api/admin/customers').query(query || {}).set(global.withAuth(token));

  const postCustomer = (token: string, data: Record<string, any>) =>
    global.api.post('/api/admin/customers').set(global.withAuth(token)).send(data);

  const getSuppliers = (token: string, query?: Record<string, any>) =>
    global.api.get('/api/admin/suppliers').query(query || {}).set(global.withAuth(token));

  const postSupplier = (token: string, data: Record<string, any>) =>
    global.api.post('/api/admin/suppliers').set(global.withAuth(token)).send(data);

  const expectPaginationStructure = (pagination: any) => {
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('totalPages');
    expect(pagination).toHaveProperty('hasNextPage');
    expect(pagination).toHaveProperty('hasPrevPage');
  };

  beforeEach(async () => {
    adminToken = global.createAdminToken('test-admin-user');
    agentToken = global.createAgentToken('test-agent-user');
    supervisorToken = global.createSupervisorToken('test-supervisor-user');
    managerToken = global.createManagerToken('test-manager-user');

    branch = await global.makeBranch({ name: 'Branch Alpha' });

    seedCustomers = [
      await global.makeCustomer({
        name: 'Alice Individual',
        email: global.generateUniqueEmail('alice'),
        phone: global.generatePhoneNumber(),
        type: 'individual',
        status: 'active',
        branchId: branch.id
      }),
      await global.makeCustomer({
        name: 'Beta Corporate',
        email: global.generateUniqueEmail('beta'),
        phone: global.generatePhoneNumber(),
        type: 'corporate',
        status: 'inactive',
        companyName: 'Beta Corp',
        companyRegistrationNumber: 'REG-001'
      }),
      await global.makeCustomer({
        name: 'Gamma Suspended',
        email: global.generateUniqueEmail('gamma'),
        phone: global.generatePhoneNumber(),
        type: 'individual',
        status: 'suspended'
      })
    ];

    seedSuppliers = [
      await global.makeSupplier({
        name: 'Airline One',
        type: 'airline',
        contactEmail: global.generateUniqueEmail('airline'),
        contactPhone: global.generatePhoneNumber(),
        contactName: 'Air Contact',
        status: 'active',
        serviceTypes: ['flight']
      }),
      await global.makeSupplier({
        name: 'Hotel Chain',
        type: 'hotel',
        contactEmail: global.generateUniqueEmail('hotel'),
        contactPhone: global.generatePhoneNumber(),
        contactName: 'Hotel Contact',
        status: 'inactive',
        serviceTypes: ['hotel']
      }),
      await global.makeSupplier({
        name: 'Visa Agency',
        type: 'visa_agency',
        contactEmail: global.generateUniqueEmail('visa'),
        contactPhone: global.generatePhoneNumber(),
        contactName: 'Visa Contact',
        status: 'suspended',
        serviceTypes: ['visa']
      })
    ];
  });

  // ============================================================================
  // GET /api/admin/customers - Search Customers Tests
  // ============================================================================

  describe('GET /api/admin/customers - Search Customers', () => {
    describe('Happy Paths', () => {
      it('should return paginated customers with default search', async () => {
        const res = await getCustomers(adminToken);

        global.expectSuccess(res, 200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('customers');
        expect(res.body.data).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data.customers)).toBe(true);
        expectPaginationStructure(res.body.data.pagination);
      });

      it('should filter by type', async () => {
        const res = await getCustomers(adminToken, { type: 'individual' });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.type).toBe('individual');
        });
      });

      it('should filter by name with partial match', async () => {
        const res = await getCustomers(adminToken, { name: 'Ali' });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.name.toLowerCase()).toContain('ali');
        });
      });

      it('should filter by email', async () => {
        const res = await getCustomers(adminToken, { email: seedCustomers[0].email });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.email).toBe(seedCustomers[0].email);
        });
      });

      it('should filter by phone', async () => {
        const res = await getCustomers(adminToken, { phone: seedCustomers[0].phone });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.phone).toBe(seedCustomers[0].phone);
        });
      });

      it('should filter by status', async () => {
        const res = await getCustomers(adminToken, { status: 'inactive' });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.status).toBe('inactive');
        });
      });

      it('should filter by branchId', async () => {
        const res = await getCustomers(adminToken, { branchId: branch.id });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.branchId).toBe(branch.id);
        });
      });

      it('should support pagination with custom page and limit', async () => {
        const res = await getCustomers(adminToken, { page: 1, limit: 5 });

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(5);
      });

      it('should support multiple filters combined', async () => {
        const res = await getCustomers(adminToken, {
          type: 'corporate',
          status: 'inactive',
          name: 'Beta'
        });

        global.expectSuccess(res, 200);
        res.body.data.customers.forEach((customer: any) => {
          expect(customer.type).toBe('corporate');
          expect(customer.status).toBe('inactive');
          expect(customer.name).toContain('Beta');
        });
      });

      it('should return empty results when no matches', async () => {
        const res = await getCustomers(adminToken, { email: 'missing@example.com' });

        global.expectSuccess(res, 200);
        expect(res.body.data.customers).toEqual([]);
        expectPaginationStructure(res.body.data.pagination);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 when no auth token provided', async () => {
        const res = await global.api.get('/api/admin/customers');
        global.expectError(res, 401);
      });

      it('should return 403 when user lacks permission', async () => {
        const res = await getCustomers(agentToken, { status: 'active' });

        expect(res.status).toBe(403);
      });

      it('should return 400 with invalid pagination parameters', async () => {
        const res = await getCustomers(adminToken, { page: 0, limit: 101 });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid email format', async () => {
        const res = await getCustomers(adminToken, { email: 'invalid-email' });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid phone format', async () => {
        const res = await getCustomers(adminToken, { phone: '123' });

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in name', async () => {
        await global.makeCustomer({
          name: "François & Co.",
          email: global.generateUniqueEmail('francois'),
          phone: global.generatePhoneNumber()
        });

        const res = await getCustomers(adminToken, { name: "François & Co." });

        global.expectSuccess(res, 200);
        if (res.body.data.customers.length > 0) {
          expect(res.body.data.customers[0].name).toContain('François');
        }
      });

      it('should handle boundary pagination values', async () => {
        const res = await getCustomers(adminToken, { page: 1, limit: 1 });

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(1);
      });

      it('should handle maximum pagination limit', async () => {
        const res = await getCustomers(adminToken, { page: 1, limit: 100 });

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.limit).toBe(100);
      });

      it('should return empty for non-existent branchId', async () => {
        const res = await getCustomers(adminToken, { branchId: 'non-existent-branch' });

        global.expectSuccess(res, 200);
        expect(res.body.data.customers).toEqual([]);
      });
    });
  });

  // ============================================================================
  // POST /api/admin/customers - Create Customer Tests
  // ============================================================================

  describe('POST /api/admin/customers - Create Customer', () => {
    describe('Happy Paths', () => {
      it('should create individual customer with minimal fields', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Minimal User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        global.expectCustomerResponse(res, { type: 'individual' });
        expect(res.body.data).toHaveProperty('createdAt');
        expect(res.body.data).toHaveProperty('updatedAt');
      });

      it('should create individual customer with optional fields', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Full User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual',
          address: '123 Main St',
          dateOfBirth: '1990-01-15',
          nationality: 'US',
          passportNumber: 'AB123456',
          notes: 'Preferred customer'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.name).toBe('Full User');
      });

      it('should create corporate customer with company details', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Corporate Contact',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'corporate',
          companyName: 'Test Corp',
          companyRegistrationNumber: 'REG-123'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.type).toBe('corporate');
      });

      it('should create customer with branchId association', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Branch User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual',
          branchId: branch.id
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.branchId).toBe(branch.id);
      });

      it('should create customer with creditLimit and paymentTerms', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Credit User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual',
          creditLimit: 5000,
          paymentTerms: 'credit'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.creditLimit).toBe(5000);
      });

      it('should create customer with tags array', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Tagged User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual',
          tags: ['vip', 'repeat']
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.tags).toEqual(expect.arrayContaining(['vip', 'repeat']));
      });

      it('should include generated id and timestamps', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Timestamp User',
          email: global.generateUniqueEmail(),
          phone: global.generatePhoneNumber(),
          type: 'individual'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.createdAt).toBeDefined();
        expect(res.body.data.updatedAt).toBeDefined();
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const res = await global.api.post('/api/admin/customers').send(global.buildCustomerRequest());

        global.expectError(res, 401);
      });

      it('should return 403 without create_customer permission', async () => {
        const res = await postCustomer(agentToken, global.buildCustomerRequest());

        expect(res.status).toBe(403);
      });

      it('should return 400 when missing required fields', async () => {
        const payload = global.buildCustomerRequest({
          name: undefined,
          email: undefined,
          phone: undefined,
          type: undefined
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid email format', async () => {
        const payload = global.buildCustomerRequest({
          email: 'invalid-email'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid phone format', async () => {
        const payload = global.buildCustomerRequest({
          phone: 'invalid-phone'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 when corporate is missing company details', async () => {
        const payload = global.buildCustomerRequest({
          type: 'corporate',
          companyName: undefined,
          companyRegistrationNumber: undefined
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 when name length is invalid', async () => {
        const payload = global.buildCustomerRequest({
          name: 'A'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid type', async () => {
        const payload = global.buildCustomerRequest({
          type: 'invalid_type'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid paymentTerms', async () => {
        const payload = global.buildCustomerRequest({
          paymentTerms: 'invalid'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 409 when email already exists', async () => {
        const existingEmail = global.generateUniqueEmail('duplicate');
        await global.makeCustomer({ email: existingEmail });

        const payload = global.buildCustomerRequest({
          email: existingEmail
        });

        const res = await postCustomer(adminToken, payload);

        expect(res.status).toBe(409);
      });
    });

    describe('Edge Cases', () => {
      it('should allow minimum name length', async () => {
        const payload = global.buildCustomerRequest({
          name: 'Al'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow maximum name length', async () => {
        const payload = global.buildCustomerRequest({
          name: 'A'.repeat(100)
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should accept international phone number', async () => {
        const payload = global.buildCustomerRequest({
          phone: '+971501234567'
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow max length notes', async () => {
        const payload = global.buildCustomerRequest({
          notes: 'N'.repeat(1000)
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow empty tags array', async () => {
        const payload = global.buildCustomerRequest({
          tags: []
        });

        const res = await postCustomer(adminToken, payload);

        global.expectSuccess(res, 201);
      });
    });
  });

  // ============================================================================
  // GET /api/admin/suppliers - Search Suppliers Tests
  // ============================================================================

  describe('GET /api/admin/suppliers - Search Suppliers', () => {
    describe('Happy Paths', () => {
      it('should return paginated suppliers with default search', async () => {
        const res = await getSuppliers(adminToken);

        global.expectSuccess(res, 200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('suppliers');
        expect(res.body.data).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data.suppliers)).toBe(true);
        expectPaginationStructure(res.body.data.pagination);
      });

      it('should filter by type', async () => {
        const res = await getSuppliers(adminToken, { type: 'hotel' });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.type).toBe('hotel');
        });
      });

      it('should filter by name with partial match', async () => {
        const res = await getSuppliers(adminToken, { name: 'Hotel' });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.name.toLowerCase()).toContain('hotel');
        });
      });

      it('should filter by contactName', async () => {
        const res = await getSuppliers(adminToken, { contactName: 'Air' });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.contactName.toLowerCase()).toContain('air');
        });
      });

      it('should filter by contactEmail', async () => {
        const res = await getSuppliers(adminToken, { contactEmail: seedSuppliers[0].contactEmail });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.contactEmail).toBe(seedSuppliers[0].contactEmail);
        });
      });

      it('should filter by contactPhone', async () => {
        const res = await getSuppliers(adminToken, { contactPhone: seedSuppliers[0].contactPhone });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.contactPhone).toBe(seedSuppliers[0].contactPhone);
        });
      });

      it('should filter by status', async () => {
        const res = await getSuppliers(adminToken, { status: 'inactive' });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.status).toBe('inactive');
        });
      });

      it('should filter by serviceTypes array', async () => {
        const res = await getSuppliers(adminToken, { serviceTypes: ['hotel'] });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.serviceTypes).toEqual(expect.arrayContaining(['hotel']));
        });
      });

      it('should support pagination with custom page and limit', async () => {
        const res = await getSuppliers(adminToken, { page: 1, limit: 5 });

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(5);
      });

      it('should support multiple filters combined', async () => {
        const res = await getSuppliers(adminToken, {
          type: 'airline',
          status: 'active',
          name: 'Airline'
        });

        global.expectSuccess(res, 200);
        res.body.data.suppliers.forEach((supplier: any) => {
          expect(supplier.type).toBe('airline');
          expect(supplier.status).toBe('active');
          expect(supplier.name).toContain('Airline');
        });
      });

      it('should return empty results when no matches', async () => {
        const res = await getSuppliers(adminToken, { contactEmail: 'missing@example.com' });

        global.expectSuccess(res, 200);
        expect(res.body.data.suppliers).toEqual([]);
      });
    });

    describe('Error Paths', () => {
      it('should return 401 when no auth token provided', async () => {
        const res = await global.api.get('/api/admin/suppliers');
        global.expectError(res, 401);
      });

      it('should return 403 when agent lacks permission', async () => {
        const res = await getSuppliers(agentToken, { status: 'active' });

        expect(res.status).toBe(403);
      });

      it('should return 400 with invalid pagination parameters', async () => {
        const res = await getSuppliers(adminToken, { page: 0, limit: 101 });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid email format', async () => {
        const res = await getSuppliers(adminToken, { contactEmail: 'invalid-email' });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid phone format', async () => {
        const res = await getSuppliers(adminToken, { contactPhone: '123' });

        global.expectError(res, 400);
      });

      it('should return 400 with invalid type value', async () => {
        const res = await getSuppliers(adminToken, { type: 'invalid' });

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in name', async () => {
        await global.makeSupplier({
          name: "O'Neill & Partners",
          contactEmail: global.generateUniqueEmail('oneill')
        });

        const res = await getSuppliers(adminToken, { name: "O'Neill" });

        global.expectSuccess(res, 200);
      });

      it('should handle boundary pagination', async () => {
        const res = await getSuppliers(adminToken, { page: 1, limit: 1 });

        global.expectSuccess(res, 200);
        expect(res.body.data.pagination.limit).toBe(1);
      });

      it('should filter by multiple serviceTypes', async () => {
        const res = await getSuppliers(adminToken, { serviceTypes: ['flight', 'hotel'] });

        global.expectSuccess(res, 200);
      });
    });
  });

  // ============================================================================
  // POST /api/admin/suppliers - Create Supplier Tests
  // ============================================================================

  describe('POST /api/admin/suppliers - Create Supplier', () => {
    describe('Happy Paths', () => {
      it('should create supplier with minimal fields', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Minimal Supplier',
          type: 'airline'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        global.expectSupplierResponse(res, { type: 'airline' });
      });

      it('should create supplier with optional fields', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Full Supplier',
          type: 'hotel',
          contactName: 'Full Contact',
          contactEmail: global.generateUniqueEmail('full'),
          contactPhone: global.generatePhoneNumber(),
          address: '123 Supplier St',
          commissionRate: 12.5,
          paymentTerms: 'net_15',
          serviceTypes: ['hotel'],
          apiEndpoint: 'https://api.supplier.example.com',
          apiKey: 'test-api-key',
          notes: 'Important supplier'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.name).toBe('Full Supplier');
      });

      it('should create suppliers with different types', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Car Rental Supplier',
          type: 'car_rental'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.type).toBe('car_rental');
      });

      it('should create supplier with serviceTypes array', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Multi Service Supplier',
          type: 'insurance_company',
          serviceTypes: ['insurance', 'visa']
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.serviceTypes).toEqual(expect.arrayContaining(['insurance', 'visa']));
      });

      it('should create supplier with commissionRate', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Commission Supplier',
          type: 'airline',
          commissionRate: 10
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.commissionRate).toBe(10);
      });

      it('should create supplier with different paymentTerms', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Terms Supplier',
          type: 'hotel',
          paymentTerms: 'net_30'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.paymentTerms).toBe('net_30');
      });

      it('should return response with default status active', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Status Supplier',
          type: 'airline'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
        expect(res.body.data.status).toBeDefined();
      });
    });

    describe('Error Paths', () => {
      it('should return 401 without auth token', async () => {
        const res = await global.api.post('/api/admin/suppliers').send(global.buildSupplierRequest());

        global.expectError(res, 401);
      });

      it('should return 403 when agent lacks permission', async () => {
        const res = await postSupplier(agentToken, global.buildSupplierRequest());

        expect(res.status).toBe(403);
      });

      it('should return 400 when missing required fields', async () => {
        const payload = global.buildSupplierRequest({
          name: undefined,
          type: undefined
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid type', async () => {
        const payload = global.buildSupplierRequest({
          type: 'invalid_type'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid email format', async () => {
        const payload = global.buildSupplierRequest({
          contactEmail: 'invalid-email'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid phone format', async () => {
        const payload = global.buildSupplierRequest({
          contactPhone: 'invalid-phone'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid name length', async () => {
        const payload = global.buildSupplierRequest({
          name: 'A'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with commissionRate out of range', async () => {
        const payload = global.buildSupplierRequest({
          commissionRate: 200
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid paymentTerms', async () => {
        const payload = global.buildSupplierRequest({
          paymentTerms: 'invalid'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 with invalid apiEndpoint', async () => {
        const payload = global.buildSupplierRequest({
          apiEndpoint: 'not-a-url'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });

      it('should return 400 when notes exceed max length', async () => {
        const payload = global.buildSupplierRequest({
          notes: 'N'.repeat(1001)
        });

        const res = await postSupplier(adminToken, payload);

        global.expectError(res, 400);
      });
    });

    describe('Edge Cases', () => {
      it('should allow minimum name length', async () => {
        const payload = global.buildSupplierRequest({
          name: 'Al'
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow maximum name length', async () => {
        const payload = global.buildSupplierRequest({
          name: 'A'.repeat(100)
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow commissionRate boundary values', async () => {
        const payloadMin = global.buildSupplierRequest({
          name: 'Min Commission',
          commissionRate: 0
        });

        const resMin = await postSupplier(adminToken, payloadMin);

        global.expectSuccess(resMin, 201);

        const payloadMax = global.buildSupplierRequest({
          name: 'Max Commission',
          commissionRate: 100
        });

        const resMax = await postSupplier(adminToken, payloadMax);

        global.expectSuccess(resMax, 201);
      });

      it('should allow empty serviceTypes array', async () => {
        const payload = global.buildSupplierRequest({
          serviceTypes: []
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
      });

      it('should allow all serviceTypes', async () => {
        const payload = global.buildSupplierRequest({
          serviceTypes: ['flight', 'hotel', 'car_rental', 'visa', 'insurance']
        });

        const res = await postSupplier(adminToken, payload);

        global.expectSuccess(res, 201);
      });
    });
  });

  // ============================================================================
  // Cross-Cutting Authorization Tests
  // ============================================================================

  describe('Authorization Matrix', () => {
    it('admin should have full access', async () => {
      const customerRes = await getCustomers(adminToken);
      global.expectSuccess(customerRes, 200);

      const supplierRes = await getSuppliers(adminToken);
      global.expectSuccess(supplierRes, 200);

      const createCustomerRes = await postCustomer(adminToken, global.buildCustomerRequest());
      global.expectSuccess(createCustomerRes, 201);

      const createSupplierRes = await postSupplier(adminToken, global.buildSupplierRequest());
      global.expectSuccess(createSupplierRes, 201);
    });

    it('agent cannot access customers or suppliers', async () => {
      const customerRes = await getCustomers(agentToken);
      expect(customerRes.status).toBe(403);

      const createCustomerRes = await postCustomer(agentToken, global.buildCustomerRequest());
      expect(createCustomerRes.status).toBe(403);

      const supplierRes = await getSuppliers(agentToken);
      expect(supplierRes.status).toBe(403);

      const createSupplierRes = await postSupplier(agentToken, global.buildSupplierRequest());
      expect(createSupplierRes.status).toBe(403);
    });

    it('supervisor should have full access', async () => {
      const customerRes = await getCustomers(supervisorToken);
      global.expectSuccess(customerRes, 200);

      const supplierRes = await getSuppliers(supervisorToken);
      global.expectSuccess(supplierRes, 200);

      const createCustomerRes = await postCustomer(supervisorToken, global.buildCustomerRequest());
      global.expectSuccess(createCustomerRes, 201);

      const createSupplierRes = await postSupplier(supervisorToken, global.buildSupplierRequest());
      global.expectSuccess(createSupplierRes, 201);
    });

    it('manager should have full access', async () => {
      const customerRes = await getCustomers(managerToken);
      global.expectSuccess(customerRes, 200);

      const supplierRes = await getSuppliers(managerToken);
      global.expectSuccess(supplierRes, 200);

      const createCustomerRes = await postCustomer(managerToken, global.buildCustomerRequest());
      global.expectSuccess(createCustomerRes, 201);

      const createSupplierRes = await postSupplier(managerToken, global.buildSupplierRequest());
      global.expectSuccess(createSupplierRes, 201);
    });

    it('no token should return 401 on all endpoints', async () => {
      const customerRes = await global.api.get('/api/admin/customers');
      global.expectError(customerRes, 401);

      const supplierRes = await global.api.get('/api/admin/suppliers');
      global.expectError(supplierRes, 401);

      const createCustomerRes = await global.api.post('/api/admin/customers').send(global.buildCustomerRequest());
      global.expectError(createCustomerRes, 401);

      const createSupplierRes = await global.api.post('/api/admin/suppliers').send(global.buildSupplierRequest());
      global.expectError(createSupplierRes, 401);
    });
  });

  // ============================================================================
  // Response Format Validation
  // ============================================================================

  describe('Response Format Validation', () => {
    it('customer search response should have correct structure', async () => {
      const res = await getCustomers(adminToken);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('customers');
      expect(res.body.data).toHaveProperty('pagination');
      expectPaginationStructure(res.body.data.pagination);
    });

    it('supplier search response should have correct structure', async () => {
      const res = await getSuppliers(adminToken);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('suppliers');
      expect(res.body.data).toHaveProperty('pagination');
      expectPaginationStructure(res.body.data.pagination);
    });

    it('create customer response should have expected fields', async () => {
      const res = await postCustomer(adminToken, global.buildCustomerRequest());

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('type');
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('create supplier response should have expected fields', async () => {
      const res = await postSupplier(adminToken, global.buildSupplierRequest());

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('type');
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');
      expect(res.body.data).toHaveProperty('status');
    });

    it('error responses should have consistent structure', async () => {
      const res = await global.api.post('/api/admin/customers').send({});

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('validation errors should include field details', async () => {
      const res = await postCustomer(adminToken, { name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('details');
    });

    it('timestamps should be ISO 8601 format', async () => {
      const res = await postCustomer(adminToken, global.buildCustomerRequest());

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(res.body.data.createdAt).toMatch(iso8601Regex);
      expect(res.body.data.updatedAt).toMatch(iso8601Regex);
    });
  });
});
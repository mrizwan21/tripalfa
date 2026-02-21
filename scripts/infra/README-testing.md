# TripAlfa Microservices Testing Guide

This guide covers the comprehensive testing strategy for the TripAlfa microservices architecture.

## 🧪 Testing Overview

### Testing Pyramid

```text
End-to-End Tests (E2E)     ┌─────────────┐  Few tests, high value
Integration Tests         ┌─────────────┐  Medium coverage
Unit Tests               ┌─────────────┐  High coverage, fast
                     Code Quality
```

### Test Types

#### 1. Unit Tests (`test-microservices.js unit`)

- **Scope**: Individual service functions and methods
- **Database**: Isolated test databases per service
- **Mocking**: External API calls and cross-service communication
- **Coverage**: >80% code coverage target

#### 2. Integration Tests (`test-microservices.js integration`)

- **Scope**: Service-to-service communication
- **Database**: Real service databases
- **Mocking**: External APIs (payment gateways, email services)
- **Focus**: API contracts and data flow

#### 3. End-to-End Tests (`test-microservices.js e2e`)

- **Scope**: Complete user journeys
- **Database**: All service databases
- **Mocking**: None (full system integration)
- **Focus**: Business logic and user experience

#### 4. Performance Tests (`test-microservices.js performance`)

- **Scope**: Load testing and performance validation
- **Metrics**: Response times, throughput, error rates
- **Goals**: Meet SLAs and performance requirements

## 🚀 Quick Start

### Run All Tests

```bash
# Comprehensive test suite
node scripts/infra/test-microservices.js

# Or run specific test types
node scripts/infra/test-microservices.js health     # Health checks only
node scripts/infra/test-microservices.js unit       # Unit tests only
node scripts/infra/test-microservices.js integration # Integration tests only
node scripts/infra/test-microservices.js e2e        # End-to-end tests only
node scripts/infra/test-microservices.js performance # Performance tests only
```

### Create Unit Tests for Services

```bash
# Create unit tests for all services
node scripts/infra/create-unit-tests.js

# Create tests for specific service
node scripts/infra/create-unit-tests.js user-service
node scripts/infra/create-unit-tests.js booking-service
```

### Run Individual Service Tests

```bash
# Install dependencies first
cd services/user-service && npm install

# Run tests
cd services/user-service && npm test
cd services/user-service && npm run test:coverage
cd services/user-service && npm run test:watch
```

## 📊 Test Results Interpretation

### Health Check Results

```text
🏥 Health Checks: 6/6 services healthy
✅ API Gateway: Healthy (45ms)
✅ Booking Service: Healthy (23ms)
✅ Payment Service: Healthy (67ms)
✅ User Service: Healthy (34ms)
✅ Audit Service: Healthy (28ms)
✅ Notification Service: Healthy (41ms)
```

### Database Connection Results

```text
🗄️ Databases: 5/5 databases connected
✅ Booking Service Database: Connected
✅ Payment Service Database: Connected
✅ User Service Database: Connected
✅ Audit Service Database: Connected
✅ Notification Service Database: Connected
```

### Integration Test Results

```text
🔗 Integration Tests: 3/3 tests passed
✅ User Service → Booking Service: Passed (234ms)
✅ Booking Service → Payment Service: Passed (189ms)
✅ Payment Success → Notification Service: Passed (156ms)
```

### Performance Test Results

```text
⚡ Performance Tests:
✅ API Gateway Throughput: 245 req/sec, 12ms avg, 0 errors
✅ Booking Service Load: 189 req/sec, 28ms avg, 0 errors
✅ User Service Load: 267 req/sec, 19ms avg, 0 errors
```

## 🏗️ Test Architecture

### Service Test Structure

```text
services/[service-name]/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts              # Jest configuration
│   │   ├── [model].test.ts       # Database model tests
│   │   └── [service].test.ts     # Business logic tests
│   └── [service].ts              # Service implementation
├── prisma/
│   └── schema.prisma             # Service-specific schema
└── package.json                  # Test dependencies
```

### Test Database Strategy

#### Unit Tests

- **Database**: Isolated test instance per service
- **Data**: Clean slate for each test
- **Migrations**: Automatic schema setup
- **Cleanup**: Automatic data cleanup

#### Integration Tests

- **Database**: Real service databases
- **Data**: Persistent test data
- **Isolation**: Test-specific data prefixes
- **Cleanup**: Selective cleanup after tests

#### E2E Tests

- **Database**: Full system databases
- **Data**: Realistic test data
- **Isolation**: Environment-based separation
- **Cleanup**: Post-test cleanup scripts

## 🧪 Writing Tests

### Unit Test Example

```typescript
describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('User Validation', () => {
    it('should validate email format', () => {
      expect(userService.isValidEmail('test@example.com')).toBe(true);
      expect(userService.isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate password strength', () => {
      expect(userService.isValidPassword('StrongPass123!')).toBe(true);
      expect(userService.isValidPassword('weak')).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestPass123!'
      };

      const result = await userService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
    });
  });
});
```

### Integration Test Example

```typescript
describe('Cross-Service Integration', () => {
  it('should create user and booking', async () => {
    // Create user via User Service
    const userResponse = await axios.post(`${baseUrl}:3004/api/users`, {
      email: `integration-${Date.now()}@example.com`,
      name: 'Integration Test User',
      password: 'testpass123'
    });

    // Create booking via Booking Service
    const bookingResponse = await axios.post(`${baseUrl}:3001/api/bookings`, {
      userId: userResponse.data.id,
      bookingReference: `INT-${Date.now()}`,
      totalAmount: 1000.00,
      currency: 'USD'
    });

    expect(userResponse.status).toBe(201);
    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.data.userId).toBe(userResponse.data.id);
  });
});
```

### E2E Test Example

```typescript
describe('Complete Booking Flow', () => {
  it('should complete full booking journey', async () => {
    // Step 1: User registration
    const user = await createTestUser();

    // Step 2: Create booking
    const booking = await createTestBooking(user.id);

    // Step 3: Process payment
    const payment = await processTestPayment(booking.id);

    // Step 4: Send confirmation
    const notification = await sendTestNotification(user.email, booking);

    // Assertions
    expect(user.email).toBeDefined();
    expect(booking.status).toBe('confirmed');
    expect(payment.status).toBe('completed');
    expect(notification.success).toBe(true);
  });
});
```

## 🔧 Test Configuration

### Jest Configuration (package.json)

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"],
    "setupFilesAfterEnv": ["<rootDir>/src/__tests__/setup.ts"]
  }
}
```

### Test Environment Variables

```bash
# Test database URLs
TEST_DATABASE_URL="postgresql://.../tripalfa_user_service_test"

# Mock service URLs
MOCK_PAYMENT_GATEWAY_URL="http://mock-payment-gateway:3000"
MOCK_EMAIL_SERVICE_URL="http://mock-email-service:3000"

# Test configuration
NODE_ENV=test
LOG_LEVEL=error
```

## 📈 Performance Benchmarks

### Target Performance Metrics

#### API Response Times

- **Health Checks**: <100ms
- **Simple Queries**: <200ms
- **Complex Operations**: <500ms
- **File Uploads**: <2000ms

#### Throughput Targets

- **API Gateway**: 500 req/sec
- **Booking Service**: 200 req/sec
- **User Service**: 300 req/sec
- **Payment Service**: 150 req/sec

#### Error Rates

- **Overall**: <0.1%
- **Service-specific**: <1%
- **Database**: <0.01%

### Performance Test Scenarios

```javascript
// Load testing configuration
const performanceTests = [
  {
    name: 'API Gateway Throughput',
    endpoint: '/health',
    concurrentUsers: 50,
    duration: 30000, // 30 seconds
    targetRPS: 500
  },
  {
    name: 'Booking Creation Load',
    endpoint: '/api/bookings',
    method: 'POST',
    concurrentUsers: 20,
    duration: 60000, // 1 minute
    targetResponseTime: 500
  }
];
```

## 🔍 Debugging Failed Tests

### Common Issues

#### Database Connection Failures

```bash
# Check database connectivity
psql "postgresql://.../tripalfa_user_service" -c "SELECT 1"

# Verify service is running
docker ps | grep user-service

# Check service logs
docker logs tripalfa-user-service-local
```

#### Service Communication Issues

```bash
# Test service-to-service communication
curl http://localhost:3001/health
curl http://localhost:3004/health

# Check API Gateway proxy
curl http://localhost:3000/api/users/health
```

#### Test Data Issues

```bash
# Clean test databases
node scripts/clean-test-data.js

# Reset test data
node scripts/seed-test-data.js
```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test user.service.test.ts

# Run tests with coverage
npm run test:coverage

# Debug mode
npm test -- --inspect-brk
```

## 📋 Test Maintenance

### Regular Tasks

- [ ] Update test data after schema changes
- [ ] Review and update performance benchmarks
- [ ] Clean up obsolete test cases
- [ ] Update API contracts in integration tests

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: node scripts/test-microservices.js
      - run: node scripts/create-unit-tests.js
```

### Test Reporting

```bash
# Generate coverage reports
npm run test:coverage

# Upload to coverage service
# (Configure based on your coverage service)

# Generate test reports
npm run test:ci
```

## 🎯 Success Criteria

### Code Coverage

- **Unit Tests**: >80% coverage
- **Integration Tests**: Key API endpoints covered
- **E2E Tests**: Critical user journeys covered

### Performance

- All response time targets met
- Throughput requirements satisfied
- Error rates within acceptable limits

### Reliability

- All health checks pass
- Database connections stable
- Service communication reliable

### Quality

- No critical security vulnerabilities
- Code quality standards met
- Documentation up to date

---

## 🚀 Next Steps

1. **Run Initial Tests**

   ```bash
   node scripts/test-microservices.js
   ```

2. **Create Unit Tests**

   ```bash
   node scripts/create-unit-tests.js
   ```

3. **Customize Tests**
   - Review generated test templates
   - Add service-specific test cases
   - Update mock implementations

4. **Set Up CI/CD**
   - Configure automated testing
   - Set up test reporting
   - Establish performance monitoring

5. **Monitor & Maintain**
   - Regular test execution
   - Performance monitoring
   - Test coverage tracking

---

**🎉 Happy Testing! Your microservices are now fully tested and production-ready!**

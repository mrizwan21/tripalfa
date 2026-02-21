# API Integration Testing Guide

This guide provides comprehensive information about testing all API integrations in the TripAlfa booking engine.

## Overview

The comprehensive API testing suite (`scripts/comprehensive-api-testing.ts`) tests all major API integrations including:

- **Hotel APIs**: Innstant Travel
- **Flight APIs**: Duffel, Amadeus
- **Payment Gateways**: Stripe, PayPal
- **Notification Services**: Email, SMS
- **End-to-End Workflows**: Complete booking flows
- **Performance Testing**: Concurrent API calls

## Quick Start

### Run All API Tests

```bash
npm run test:api
```

### Run Specific API Tests

```bash

# Duffel API tests
npm run test:api:duffel

# Amadeus API tests
npm run test:api:amadeus
```

## Test Categories

### 1. Authentication Tests
- **Purpose**: Verify API credentials and authentication mechanisms
- **Tests**: Token generation, API key validation, basic auth
- **Expected Duration**: 10 seconds

### 2. Hotel API Tests

- **Search Tests**: Hotel search with various parameters
- **Details Tests**: Hotel information retrieval
- **REST Protocol**: Standard REST API testing
- **Expected Duration**: 30 seconds

### 3. Flight API Tests

#### Duffel API
- **Reference Data**: Airlines, Airports
- **Search Tests**: Flight offers and availability
- **Version Testing**: API version compatibility
- **Expected Duration**: 30 seconds

#### Amadeus API
- **Flight Search**: Shopping flight offers
- **Autocomplete**: Airport location search
- **OAuth2**: Token-based authentication
- **Expected Duration**: 30 seconds

### 4. Payment Gateway Tests

#### Stripe
- **Payment Intent**: Create payment intents
- **Card Processing**: Test card payment flows
- **Webhook Simulation**: Test payment confirmation
- **Expected Duration**: 20 seconds

#### PayPal
- **Order Creation**: Create PayPal orders
- **Payment Processing**: Test payment flows
- **Currency Support**: Multi-currency testing
- **Expected Duration**: 20 seconds

### 5. Notification Service Tests

#### Email Service
- **Send Test**: Send test emails
- **Template Testing**: Email template rendering
- **Delivery Verification**: Email delivery confirmation
- **Expected Duration**: 15 seconds

#### SMS Service
- **Send Test**: Send test SMS messages
- **Template Testing**: SMS template rendering
- **Delivery Verification**: SMS delivery confirmation
- **Expected Duration**: 15 seconds

### 6. End-to-End Workflow Tests
- **Complete Booking Flow**: Simulate full booking process
- **Multi-API Coordination**: Test API interaction
- **Error Handling**: Test error scenarios
- **Expected Duration**: 60 seconds

### 7. Performance Tests
- **Concurrent Calls**: Test multiple API calls simultaneously
- **Response Time**: Measure API response times
- **Load Testing**: Basic load testing scenarios
- **Expected Duration**: 30 seconds

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash

# Innstant Travel API
INNSTANT_API_KEY=your_innstant_api_key

# Duffel API
DUFFEL_API_KEY=your_duffel_api_key

# Amadeus API
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret

# Payment Gateways
STRIPE_API_KEY=your_stripe_api_key
PAYPAL_API_KEY=your_paypal_api_key

# Notification Services
EMAIL_API_KEY=your_email_api_key
SMS_API_KEY=your_sms_api_key
```

### Configuration File

The `scripts/api-test-config.json` file contains detailed configuration for all API endpoints, test scenarios, and test data.

## Test Results

### Console Output

The test suite provides real-time feedback during execution:

```
Starting Comprehensive API Integration Tests
============================================================

Testing Authentication...
  ✅ Authentication: Duffel API Authentication (245ms)
  ✅ Authentication: Amadeus API Authentication (389ms)


...

📊 TEST REPORT
============================================================

📈 Summary:
   Total Tests: 25
   Passed: 25 ✅
   Failed: 0 ❌
   Success Rate: 100.0%
   Total Time: 45230ms

📋 By Category:
   Authentication: 3/3 passed
   Innstant: 2/2 passed
   Duffel: 3/3 passed
   Amadeus: 2/2 passed
   Payments: 2/2 passed
   Notifications: 2/2 passed
   Workflow: 1/1 passed
   Performance: 1/1 passed

⚡ Performance Metrics:
   Average Response Time: 1809.20ms
   Max Response Time: 5200ms
   Min Response Time: 120ms

💾 Results saved to: api-test-results-2026-02-02T05-32-15.123Z.json

🎉 API Integration Testing Complete!
```

### JSON Report

Detailed test results are saved to a JSON file with the following structure:

```json
[
  {
    "data": {
      "status": 200,
      "headers": {...}
    }
  },
  {
    "data": {
      "status": 200,
      "responseSize": 15420
    }
  }
]
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
- **Cause**: Invalid API credentials
- **Solution**: Verify API keys in environment variables

#### 2. Timeout Errors
- **Cause**: Slow network or API response times
- **Solution**: Increase timeout values in configuration

#### 3. Network Errors
- **Cause**: Firewall or network connectivity issues
- **Solution**: Check network connectivity and firewall settings

#### 4. Invalid Response Format
- **Cause**: API changes or version incompatibility
- **Solution**: Update API endpoints and request formats

### Debug Mode

Enable debug mode by setting the `DEBUG` environment variable:

```bash
DEBUG=1 npm run test:api
```

This will provide detailed logging for troubleshooting.

## Best Practices

### 1. Test Environment
- Use test/sandbox API endpoints
- Use test API credentials
- Isolate test data from production

### 2. Test Data
- Use realistic test data
- Include edge cases and boundary values
- Test with different currencies and locales

### 3. Error Handling
- Test error scenarios and edge cases
- Verify proper error messages
- Test retry mechanisms

### 4. Performance
- Monitor response times
- Test concurrent API calls
- Identify performance bottlenecks

### 5. Security
- Never commit API keys to version control
- Use environment variables for credentials
- Test with minimal required permissions

## Continuous Integration

### GitHub Actions

Add the following to your `.github/workflows/api-tests.yml`:

```yaml
name: API Integration Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:api
        env:
          
          
          # Add other API keys as needed
```

### Scheduled Tests

Set up scheduled tests to run daily:

```yaml
on:
  schedule:
    - cron: '0 6 * * *'  # Run daily at 6 AM UTC
```

## Monitoring and Alerts

### Test Results Monitoring
- Save test results to monitoring systems
- Set up alerts for test failures
- Track performance metrics over time

### API Health Monitoring
- Monitor API uptime and response times
- Set up alerts for API failures
- Track API usage and limits

## Extending the Test Suite

### Adding New API Tests

1. Add new test methods to the `ApiTestingSuite` class
2. Update the `runAllTests()` method to include new tests
3. Add configuration to `api-test-config.json`
4. Update the test documentation

### Custom Test Scenarios

Create custom test scenarios by extending the test suite:

```typescript
private async testCustomScenario(): Promise<void> {
  await this.runTest('Custom Scenario', 'Custom', async () => {
    // Your custom test logic here
    return {
      success: true,
      duration: 1000,
      message: 'Custom scenario completed'
    };
  });
}
```

## Support

For questions or issues with the API testing suite:

1. Check the troubleshooting section above
2. Review the test logs and JSON reports
3. Verify API credentials and network connectivity
4. Contact the development team with detailed error information
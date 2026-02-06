/**
 * API Integration Test Module
 * 
 * Centralized exports for all API integration testing utilities.
 * This module provides comprehensive tools for API testing in E2E scenarios.
 * 
 * @module api-integration
 * 
 * @example
 * ```typescript
 * import { 
 *   ApiAuthManager, 
 *   ApiTestDataManager, 
 *   ApiMockBuilder,
 *   authMocks,
 *   flightMocks 
 * } from './api-integration';
 * 
 * // Use in your tests
 * const authManager = new ApiAuthManager();
 * await authManager.authenticate('user@example.com', 'password');
 * ```
 */

// Core API Test Helpers
export {
  // Classes
  ApiMockBuilder,
  ApiRequestInterceptor,
  ApiResponseValidator,
  ApiTestScenario,
  ApiLogger,
  // Functions
  mockApiRoute,
  waitForApiResponse,
  extractResponseData,
  logApiCall,
  retryApiCall,
  // Constants
  API_ENDPOINTS,
  // Types
  type ValidationResult,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type RequestLog,
} from './api-test-helpers';

// API Authentication
export {
  // Classes
  ApiAuthManager,
  PageAuthHelper,
  // Functions
  createAuthenticatedContext,
  quickLogin,
  quickApiAuth,
  getAuthState,
  // Constants
  AUTH_CONFIG,
  // Types
  type AuthState,
  // Errors
  AuthenticationError,
  TokenExpiredError,
  InvalidCredentialsError,
} from './api-auth';

// API Test Data Management
export {
  // Classes
  ApiTestDataManager,
  ApiTestDataFactory,
  // Constants
  TEST_DATA_CONFIG,
  // Types
  type TestUserData,
  type TestBookingData,
  type TestWalletData,
  type TestPaymentData,
  type PassengerData,
  type FlightSearchParams,
  type HotelSearchParams,
  type TestCardData,
  type TestAddressData,
  type TestFlightOffer,
  type TestHotelOffer,
} from './api-test-data';

// API Mock Fixtures
export {
  authMocks,
  flightMocks,
  hotelMocks,
  walletMocks,
  paymentMocks,
  bookingMocks,
  healthMocks,
  networkErrorMocks,
} from './fixtures/api-mocks';

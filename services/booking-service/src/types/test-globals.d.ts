// Test global type declarations
declare global {
  var api: import('supertest').SuperTest<import('supertest').Test>;

  var jwtSign: any;

  var jwtVerify: any;

  var prismaClient: typeof import('@prisma/client').PrismaClient;

  var testEnv: { isIntegrationTest: boolean; shouldResetDB: boolean };

  // Factories
  var makeCustomer: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeSupplier: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeBooking: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeCompany: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeBranch: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeDocument: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeAmendment: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeRefund: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeAuditLog: (overrides?: Record<string, unknown>) => Promise<any>;

  var makeNote: (overrides?: Record<string, unknown>) => Promise<any>;

  // Auth token helpers
  var createAdminToken: (userId?: string) => string;

  var createAgentToken: (userId?: string) => string;

  var createSupervisorToken: (userId?: string) => string;

  var createManagerToken: (userId?: string) => string;

  // HTTP helpers
  var post: (path: string, data?: any) => any;

  var put: (path: string, data?: any) => any;

  var del: (path: string) => any;

  var withAuth: (token?: string) => { Authorization: string };

  var postAuth: (path: string, data: any, role?: string) => Promise<any>;

  // Assertion helpers
  var expectSuccess: (res: any, status?: number) => void;

  var expectError: (res: any, status?: number, message?: string) => void;

  var expectBookingResponse: (res: any) => void;

  var expectCustomerResponse: (res: any) => void;

  var expectSupplierResponse: (res: any) => void;

  // Data generation helpers
  var generateUniqueEmail: (prefix?: string) => string;

  var generatePhoneNumber: () => string;

  var generatePNR: () => string;

  var generateDateRange: (daysFromNow?: number) => { checkIn: string; checkOut: string };

  // Request builders
  var buildBookingRequest: (overrides?: Record<string, unknown>) => any;

  var buildCustomerRequest: (overrides?: Record<string, unknown>) => any;

  var buildSupplierRequest: (overrides?: Record<string, unknown>) => any;

  var makePricingRule: (overrides?: Record<string, unknown>) => Promise<any>;
}

export {};
/**
 * Coverage Tracking Type Definitions
 */

export interface FileCoverage {
  file: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

export interface CoverageMetric {
  current: number;
  baseline: number;
  difference: number; // percentage point change
  trend: 'improved' | 'degraded' | 'stable';
}

export interface ServiceCoverage {
  serviceName: string;
  path: string;
  summary: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  files: FileCoverage[];
  timestamp: Date;
}

export interface CoverageThreshold {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  allowedDegradation?: number; // percentage points
}

export interface CoverageConfig {
  thresholds: Record<string, CoverageThreshold>;
  regressionThreshold: number; // percentage points
  outputDir: string;
  strict: boolean; // fail on any regression
  trackingEnabled: boolean;
}

export interface CoverageReport {
  timestamp: Date;
  services: ServiceCoverage[];
  regressions: RegressionDetected[];
  recommendations: string[];
  status: 'passing' | 'warning' | 'critical';
}

export interface RegressionDetected {
  service: string;
  file: string;
  metric: 'statements' | 'branches' | 'functions' | 'lines';
  baseline: number;
  current: number;
  difference: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Default configuration
export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  thresholds: {
    'payment-service': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
      allowedDegradation: 2,
    },
    'booking-service': {
      statements: 82,
      branches: 78,
      functions: 82,
      lines: 82,
      allowedDegradation: 2,
    },
    'notification-service': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      allowedDegradation: 2,
    },
    'wallet-service': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
      allowedDegradation: 2,
    },
    'kyc-service': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      allowedDegradation: 2,
    },
    'api-gateway': {
      statements: 78,
      branches: 70,
      functions: 78,
      lines: 78,
      allowedDegradation: 2,
    },
    'booking-engine': {
      statements: 75,
      branches: 65,
      functions: 75,
      lines: 75,
      allowedDegradation: 2,
    },
    'b2b-admin': {
      statements: 72,
      branches: 62,
      functions: 72,
      lines: 72,
      allowedDegradation: 2,
    },
    'shared': {
      statements: 88,
      branches: 85,
      functions: 88,
      lines: 88,
      allowedDegradation: 2,
    },
  },
  regressionThreshold: 2, // 2 percentage points
  outputDir: './coverage-results',
  strict: false,
  trackingEnabled: true,
};

/**
 * Service mapping for coverage tracking
 * Maps service names to their paths and test locations
 */
export const SERVICE_MAPPING: Record<string, { path: string; testGlob: string }> = {
  'payment-service': {
    path: 'services/payment-service',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'booking-service': {
    path: 'services/booking-service',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'notification-service': {
    path: 'services/notification-service',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'wallet-service': {
    path: 'services/wallet-service',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'kyc-service': {
    path: 'services/kyc-service',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'api-gateway': {
    path: 'services/api-gateway',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'booking-engine': {
    path: 'apps/booking-engine',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'b2b-admin': {
    path: 'apps/b2b-admin',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'shared-types': {
    path: 'packages/shared-types',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'shared-utils': {
    path: 'packages/shared-utils',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
  'shared-database': {
    path: 'packages/shared-database',
    testGlob: 'src/**/*.{test,spec}.ts',
  },
};

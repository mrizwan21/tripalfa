export interface BenchmarkResult {
  name: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  hz: number;
  samples: number;
  timestamp: Date;
}

export interface PerformanceThreshold {
  metric: string;
  expectedMs?: number;
  maxMs?: number;
  minHz?: number;
  allowedDeviation?: number; // percentage
}

export interface PerformanceReport {
  timestamp: Date;
  duration: number;
  benchmarks: BenchmarkResult[];
  regressions: RegressionDetected[];
  recommendations: string[];
}

export interface RegressionDetected {
  benchmark: string;
  metric: string;
  baseline: number;
  current: number;
  percentageChange: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PerformanceConfig {
  enabled: boolean;
  minSamples: number;
  maxTime: number;
  warmupTime: number;
  thresholds: Record<string, PerformanceThreshold>;
  outputDir: string;
  failOnRegression: boolean;
  regressionThreshold: number; // percentage
}

// Default configuration
export const DEFAULT_PERF_CONFIG: PerformanceConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  minSamples: 100,
  maxTime: 10,
  warmupTime: 1,
  thresholds: {
    'payment-processing': {
      metric: 'Payment Processing',
      maxMs: 500,
      allowedDeviation: 10,
    },
    'booking-orchestration': {
      metric: 'Booking Workflow',
      maxMs: 2000,
      allowedDeviation: 15,
    },
    'database-query': {
      metric: 'Database Query',
      maxMs: 100,
      allowedDeviation: 5,
    },
    'api-gateway': {
      metric: 'API Gateway',
      maxMs: 300,
      allowedDeviation: 10,
    },
  },
  outputDir: './perf-results',
  failOnRegression: process.env.CI === 'true',
  regressionThreshold: 10, // 10% regression triggers warning
};

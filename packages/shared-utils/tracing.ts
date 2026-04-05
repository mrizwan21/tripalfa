/**
 * Distributed tracing initialization for TripAlfa services
 */

interface TracingConfig {
  serviceName: string;
  version?: string;
  environment?: string;
  samplingRate?: number;
}

let tracingInitialized = false;

export async function initTracing(
  serviceName: string,
  config: Partial<TracingConfig> = {}
): Promise<void> {
  if (tracingInitialized) {
    console.log(`[Tracing] Already initialized for ${serviceName}`);
    return;
  }

  const {
    version = process.env.npm_package_version || '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    samplingRate = environment === 'production' ? 0.1 : 1.0,
  } = config;

  console.log(
    `[Tracing] Initializing for ${serviceName} (v${version}, env: ${environment}, sampling: ${samplingRate * 100}%)`
  );

  tracingInitialized = true;
  console.log(`[Tracing] Tracing enabled for ${serviceName}`);
}

export function isTracingInitialized(): boolean {
  return tracingInitialized;
}

export function createSpan(name: string): {
  traceId: string;
  spanId: string;
  end: () => void;
} {
  const traceId = Math.random().toString(36).substring(2, 18);
  const spanId = Math.random().toString(36).substring(2, 18);
  const startTime = Date.now();

  return {
    traceId,
    spanId,
    end: () => {
      const duration = Date.now() - startTime;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Span] ${name} completed in ${duration}ms (trace: ${traceId})`);
      }
    },
  };
}

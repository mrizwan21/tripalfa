export interface MetricsStore {
  increment(metric: string, tags?: Record<string, any>): void;
  recordBookingCreated?(type: string, status: string): void;
  // add other commonly used methods as needed
}

export interface CacheService {
  ping?(): Promise<void> | void;
  del(key: string): Promise<void> | void;
}

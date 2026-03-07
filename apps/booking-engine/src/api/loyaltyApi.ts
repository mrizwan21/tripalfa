// Type definitions for loyalty module
export interface CustomerLoyaltyRecord {
  id: string;
  customerId: string;
  tierId: string;
  pointsBalance: number;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  tierName: string;
  tierLevel: number;
  pointsExpiringDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTierRecord {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountPercentage: number;
  pointsMultiplier: number;
  benefits: string[];
}

export type CustomerLoyalty = CustomerLoyaltyRecord;

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: "EARN" | "REDEEM" | "EXPIRE" | "BONUS" | "ADJUSTMENT";
  description: string;
  bookingReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TierBenefits {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountPercentage: number;
  pointsMultiplier: number;
  benefits: string[];
}

export interface RedemptionRequest {
  points: number;
  bookingId?: string;
  description: string;
}

export interface RedemptionResult {
  success: boolean;
  pointsRemaining: number;
  redemptionAmount: number;
  message: string;
}

class LoyaltyApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "LoyaltyApiError";
  }
}

class LoyaltyApi {
  private static instance: LoyaltyApi;
  private baseUrl: string;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  private constructor() {
    // Use booking-service through API gateway
    this.baseUrl =
      import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:3001";
  }

  static getInstance(): LoyaltyApi {
    if (!LoyaltyApi.instance) {
      LoyaltyApi.instance = new LoyaltyApi();
    }
    return LoyaltyApi.instance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(exponentialDelay, this.retryConfig.maxDelay);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...options.headers,
        };

        const authToken = localStorage.getItem("authToken");
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new LoyaltyApiError(
            response.status,
            errorData.message || `HTTP ${response.status}`,
            errorData,
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        const delay = this.calculateBackoff(attempt);
        await this.delay(delay);
      }
    }

    throw new Error("Max retries exceeded");
  }

  async getUserLoyalty(userId: string): Promise<CustomerLoyaltyRecord> {
    return this.request<CustomerLoyaltyRecord>(`/api/loyalty/user/${userId}`);
  }

  async getPointsHistory(
    userId: string,
    filters?: {
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ data: LoyaltyTransaction[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.append("dateTo", filters.dateTo);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    return this.request<{ data: LoyaltyTransaction[]; total: number }>(
      `/api/loyalty/transactions/${userId}?${params.toString()}`,
    );
  }

  async getTierBenefits(): Promise<TierBenefits[]> {
    return this.request<TierBenefits[]>("/api/loyalty/tiers");
  }

  async getTierBenefit(tierId: string): Promise<TierBenefits> {
    return this.request<TierBenefits>(`/api/loyalty/tiers/${tierId}`);
  }

  async redeemPoints(
    userId: string,
    request: RedemptionRequest,
  ): Promise<RedemptionResult> {
    return this.request<RedemptionResult>(
      `/api/loyalty/user/${userId}/redeem-points`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async getExpiringPoints(userId: string): Promise<{
    expiringPoints: number;
    expiryDate: string;
  }> {
    return this.request<{ expiringPoints: number; expiryDate: string }>(
      `/api/loyalty/user/${userId}/expiring-points`,
    );
  }

  async awardPoints(
    userId: string,
    points: number,
    bookingReference: string,
    description: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    return this.request<{ success: boolean; newBalance: number }>(
      `/api/loyalty/user/${userId}/award-points`,
      {
        method: "POST",
        body: JSON.stringify({
          points,
          bookingReference,
          description,
        }),
      },
    );
  }
}

export const loyaltyApi = LoyaltyApi.getInstance();
export { LoyaltyApiError };

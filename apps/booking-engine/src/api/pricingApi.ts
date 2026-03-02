// Type definitions for pricing module
export interface DiscountCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  description?: string;
}

interface PricingCalculationRequest {
  baseAmount: number;
  serviceType: string;
  couponCode?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

interface PriceBreakdown {
  basePrice: number;
  markup: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  commission: number;
  tax: number;
  totalPrice: number;
  details: {
    markupPercentage: number;
    couponPercentage: number;
    loyaltyTier: string;
    loyaltyPercentage: number;
    taxPercentage: number;
  };
}

interface CouponValidationResult {
  valid: boolean;
  discountAmount?: number;
  discountPercentage?: number;
  error?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class PricingApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "PricingApiError";
  }
}

class PricingApi {
  private static instance: PricingApi;
  private baseUrl: string;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  }

  static getInstance(): PricingApi {
    if (!PricingApi.instance) {
      PricingApi.instance = new PricingApi();
    }
    return PricingApi.instance;
  }

  private async delay(ms: number): Promise<void> {
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
          throw new PricingApiError(
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

  async calculatePrice(
    request: PricingCalculationRequest,
  ): Promise<PriceBreakdown> {
    return this.request<PriceBreakdown>("/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async validateCoupon(
    code: string,
    amount: number,
    serviceType?: string,
  ): Promise<CouponValidationResult> {
    return this.request<CouponValidationResult>(
      "/api/pricing/validate-coupon",
      {
        method: "POST",
        body: JSON.stringify({ code, amount, serviceType }),
      },
    );
  }

  async getPriceBreakdown(bookingId: string): Promise<PriceBreakdown> {
    return this.request<PriceBreakdown>(`/api/pricing/breakdown/${bookingId}`);
  }

  async getCouponDetails(code: string): Promise<DiscountCoupon> {
    return this.request<DiscountCoupon>(`/api/pricing/coupons/${code}`);
  }
}

export const pricingApi = PricingApi.getInstance();
export type {
  PriceBreakdown,
  CouponValidationResult,
  PricingCalculationRequest,
};
export { PricingApiError };

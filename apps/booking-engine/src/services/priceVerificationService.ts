/**
 * Price Verification Service
 *
 * Provides functionality to verify and refresh flight prices before booking.
 * According to Duffel API best practices, prices should be refreshed before
 * final booking confirmation to ensure accuracy.
 *
 * Documentation: https://duffel.com/docs/guides/getting-an-accurate-price-before-booking
 */

import { api } from "../lib/api";

type DuffelOffer = Record<string, any>;

// ============================================================================
// TYPES
// ============================================================================

export interface PriceVerificationResult {
  success: boolean;
  offer?: DuffelOffer;
  priceChanged: boolean;
  originalPrice?: {
    amount: string;
    currency: string;
  };
  newPrice?: {
    amount: string;
    currency: string;
  };
  priceDifference?: {
    amount: number;
    percentage: number;
    increased: boolean;
  };
  expiresAt?: string;
  error?: string;
}

export interface PriceRefreshParams {
  offerId: string;
  originalAmount: string;
  originalCurrency: string;
  passengerIds?: string[];
}

export interface OrderPricingParams {
  orderId: string;
  payment?: {
    type: "balance" | "card";
    card_id?: string;
  };
}

export interface OrderPricingResult {
  success: boolean;
  order?: any;
  totalAmount?: string;
  currency?: string;
  error?: string;
}

// ============================================================================
// PRICE VERIFICATION SERVICE
// ============================================================================

class PriceVerificationService {
  private baseUrl = "/api/flights";

  /**
   * Verify offer price before booking
   *
   * This fetches the latest offer data from Duffel and compares it with
   * the original price shown to the user. If the price has changed,
   * the user should be notified before proceeding.
   *
   * @param params - Price verification parameters
   * @returns Price verification result with change details
   */
  async verifyOfferPrice(
    params: PriceRefreshParams,
  ): Promise<PriceVerificationResult> {
    try {
      const { offerId, originalAmount, originalCurrency } = params;

      // Fetch latest offer data
      const response = await api.get(`${this.baseUrl}/offers/${offerId}`);

      const offer = response.offer || (response as any);

      if (!offer) {
        return {
          success: false,
          priceChanged: false,
          error: "Offer not found",
        };
      }

      const newAmount = offer.total_amount;
      const newCurrency = offer.total_currency;
      const originalAmountNum = parseFloat(originalAmount);
      const newAmountNum = parseFloat(newAmount);

      // Calculate price difference
      const difference = newAmountNum - originalAmountNum;
      const percentage =
        originalAmountNum > 0
          ? Math.abs((difference / originalAmountNum) * 100)
          : 0;

      const priceChanged = Math.abs(difference) > 0.01; // Allow for small rounding differences

      return {
        success: true,
        offer,
        priceChanged,
        originalPrice: {
          amount: originalAmount,
          currency: originalCurrency,
        },
        newPrice: {
          amount: newAmount,
          currency: newCurrency,
        },
        priceDifference: {
          amount: Math.abs(difference),
          percentage: Math.round(percentage * 100) / 100,
          increased: difference > 0,
        },
        expiresAt: offer.expires_at,
      };
    } catch (error: any) {
      console.error("[PriceVerification] Verify error:", error);
      return {
        success: false,
        priceChanged: false,
        error: error?.message || "Failed to verify price",
      };
    }
  }

  /**
   * Refresh offer and get updated price
   *
   * This creates a new offer request with the same parameters to get
   * fresh pricing. Useful when the original offer has expired.
   *
   * @param offerRequestId - Original offer request ID
   */
  async refreshOfferRequest(offerRequestId: string): Promise<{
    success: boolean;
    offers?: any[];
    offerRequestId?: string;
    error?: string;
  }> {
    try {
      // Get original offer request
      const originalRequest = await api.get(
        `${this.baseUrl}/offer-requests/${offerRequestId}`,
      );

      if (!originalRequest) {
        return {
          success: false,
          error: "Original offer request not found",
        };
      }

      // Create new offer request with same parameters
      const response = await api.post(`${this.baseUrl}/offer-requests`, {
        slices: originalRequest.slices,
        passengers: originalRequest.passengers,
        cabin_class: originalRequest.cabin_class,
        return_available_services: true,
      });

      return {
        success: true,
        offers: response.offers,
        offerRequestId: response.id,
      };
    } catch (error: any) {
      console.error("[PriceVerification] Refresh error:", error);
      return {
        success: false,
        error: error?.message || "Failed to refresh offers",
      };
    }
  }

  /**
   * Get accurate price for an order before payment
   *
   * This prices an order with the selected payment method to get
   * the final amount including any payment fees.
   *
   * @param params - Order pricing parameters
   */
  async priceOrder(params: OrderPricingParams): Promise<OrderPricingResult> {
    try {
      const { orderId, payment } = params;

      const response = await api.post(
        `${this.baseUrl}/orders/${orderId}/price`,
        { payment },
      );

      if (response.success && response.data) {
        return {
          success: true,
          order: response.data,
          totalAmount: response.data.total_amount,
          currency: response.data.total_currency,
        };
      }

      return {
        success: false,
        error: response.error || "Failed to price order",
      };
    } catch (error: any) {
      console.error("[PriceVerification] Price order error:", error);
      return {
        success: false,
        error: error?.message || "Failed to price order",
      };
    }
  }

  /**
   * Check if offer is still valid (not expired)
   */
  isOfferValid(offer: DuffelOffer): boolean {
    if (!offer.expires_at) return true;

    const expiresAt = new Date(offer.expires_at);
    return expiresAt > new Date();
  }

  /**
   * Get time remaining until offer expires
   */
  getTimeUntilExpiry(offer: DuffelOffer): {
    valid: boolean;
    milliseconds: number;
    seconds: number;
    minutes: number;
    formatted: string;
  } {
    if (!offer.expires_at) {
      return {
        valid: true,
        milliseconds: Infinity,
        seconds: Infinity,
        minutes: Infinity,
        formatted: "No expiry",
      };
    }

    const expiresAt = new Date(offer.expires_at).getTime();
    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0) {
      return {
        valid: false,
        milliseconds: 0,
        seconds: 0,
        minutes: 0,
        formatted: "Expired",
      };
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return {
      valid: true,
      milliseconds: diff,
      seconds,
      minutes,
      formatted: `${minutes}m ${seconds}s`,
    };
  }

  /**
   * Format price change for display
   */
  formatPriceChange(result: PriceVerificationResult): string {
    if (!result.priceChanged || !result.priceDifference) {
      return "Price verified";
    }

    const { amount, percentage, increased } = result.priceDifference;
    const direction = increased ? "increased" : "decreased";
    const symbol = result.newPrice?.currency || "USD";

    return `Price has ${direction} by ${symbol} ${amount.toFixed(2)} (${percentage.toFixed(1)}%)`;
  }
}

// Export singleton instance
const priceVerificationService = new PriceVerificationService();
export default priceVerificationService;

// Export class for testing
{ PriceVerificationService }

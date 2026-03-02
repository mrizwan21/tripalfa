/**
 * Supplier Payment API Service
 * Handles payment processing through the booking system's internal payment API
 * Called after payment confirmation from Duffel
 *
 * Routes through centralized API Manager for consistency
 */

import { api } from "../lib/api";

/**
 * Process payment through the supplier/booking system
 * Called after Duffel payment confirmation
 *
 * @param bookingId - The booking ID from Duffel order
 * @param amount - Payment amount
 * @param paymentMethod - Payment method ID
 * @returns Payment processing result
 */
export async function processSupplierPayment(
  bookingId: string,
  amount: number,
  paymentMethod: string,
): Promise<any> {
  try {
    console.log("[Supplier] Processing payment for booking:", {
      bookingId,
      amount,
      paymentMethod,
    });

    const result = await api.post(`/bookings/${bookingId}/payment`, {
      amount,
      paymentMethod,
    });

    console.log("[Supplier] Payment processed successfully:", result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[Supplier] Payment processing error:", error);
    throw error;
  }
}

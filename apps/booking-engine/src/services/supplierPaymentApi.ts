/**
 * Supplier Payment API Service
 * Handles payment processing through the booking system's internal payment API
 * Called after payment confirmation from Duffel
 */

import { API_BASE_URL } from '../lib/constants';

const API_KEY = import.meta.env.VITE_API_KEY || '';

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
  paymentMethod: string
): Promise<any> {
  try {
    console.log('[Supplier] Processing payment for booking:', {
      bookingId,
      amount,
      paymentMethod
    });

    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          amount,
          paymentMethod
        }),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to process supplier payment: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[Supplier] Payment processed successfully:', result);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[Supplier] Payment processing error:', error);
    throw error;
  }
}

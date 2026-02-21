import axios from 'axios';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export class PaymentService {
  private static baseURL = process.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3003';

  /**
   * Process a payment
   */
  static async processPayment(data: PaymentRequest): Promise<Payment> {
    try {
      const response = await axios.post<Payment>(
        `${this.baseURL}/api/payments`,
        data
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to process payment: ${error}`);
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(paymentId: string): Promise<Payment> {
    try {
      const response = await axios.get<Payment>(
        `${this.baseURL}/api/payments/${paymentId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get payment: ${error}`);
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    try {
      const response = await axios.post<Payment>(
        `${this.baseURL}/api/payments/${paymentId}/refund`,
        { amount }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error}`);
    }
  }

  /**
   * Get payments for a booking
   */
  static async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    try {
      const response = await axios.get<Payment[]>(
        `${this.baseURL}/api/payments/booking/${bookingId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get payments for booking: ${error}`);
    }
  }
}

export default PaymentService;
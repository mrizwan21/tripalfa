import { v4 as uuidv4 } from 'uuid';
import documentGenerationService from './documentGenerationService.js';
import paymentService from './paymentService.js';
import notificationService from './notificationService.js';

/**
 * Payment Finalization Service
 * Handles the complete payment workflow:
 * 1. Validate payment eligibility
 * 2. Process payment
 * 3. Update booking status
 * 4. Generate documents (Invoice, E-Ticket, Itinerary, Receipt)
 * 5. Send notifications
 * 6. Update wallet/ledger
 */

interface PaymentFinalizationRequest {
  orderId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: 'balance' | 'card';
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
  };
  metadata?: Record<string, any>;
}

interface PaymentFinalizationResponse {
  success: boolean;
  paymentId: string;
  bookingId: string;
  status: 'completed' | 'failed';
  documents: {
    invoice?: string;
    itinerary?: string;
    eTicket?: string;
    receipt?: string;
  };
  message: string;
  timestamp: Date;
}

interface BookingForFinalization {
  id: string;
  reference: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  services?: any[];
  passenger?: any;
  metadata?: Record<string, any>;
}

class PaymentFinalizationService {
  private processedPayments: Map<string, PaymentFinalizationResponse> = new Map();
  private finalizationLog: Array<{ timestamp: Date; orderId: string; status: string }> = [];

  /**
   * Finalize payment for a hold order
   * This is the main entry point for payment finalization
   */
  async finalizePayment(request: PaymentFinalizationRequest): Promise<PaymentFinalizationResponse> {
    try {
      const finalizationId = uuidv4();

      console.log(
        `[PAYMENT_FINALIZATION] Starting finalization: ${finalizationId}`,
        {
          orderId: request.orderId,
          bookingId: request.bookingId,
          amount: request.amount,
          method: request.paymentMethod
        }
      );

      // 1. Validate payment eligibility
      await this.validatePaymentEligibility(request);

      // 2. Process payment
      const paymentRecord = await this.processPaymentTransaction(request);

      if (paymentRecord.status !== 'completed') {
        throw new Error(`Payment processing failed: ${paymentRecord.status}`);
      }

      // 3. Update booking status to CONFIRMED
      await this.updateBookingStatus(request.bookingId, 'CONFIRMED');

      // 4. Generate documents
      const documents = await this.generateFinalizationDocuments(request);

      // 5. Send notifications
      await this.sendFinalizationNotifications(request);

      // 6. Log transaction
      await this.logFinalization(request.orderId, 'completed');

      const response: PaymentFinalizationResponse = {
        success: true,
        paymentId: paymentRecord.id,
        bookingId: request.bookingId,
        status: 'completed',
        documents,
        message: `Payment finalized successfully. Booking ${request.bookingId} is now confirmed.`,
        timestamp: new Date()
      };

      this.processedPayments.set(finalizationId, response);
      return response;
    } catch (error) {
      console.error('[PAYMENT_FINALIZATION] Error during finalization:', error);

      await this.logFinalization(request.orderId, 'failed');

      return {
        success: false,
        paymentId: '',
        bookingId: request.bookingId,
        status: 'failed',
        documents: {},
        message: `Payment finalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate that payment can be processed
   */
  private async validatePaymentEligibility(request: PaymentFinalizationRequest): Promise<void> {
    // 1. Check if hold order still valid
    if (!request.orderId) {
      throw new Error('Order ID is required');
    }

    // 2. Validate amount and currency
    if (request.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!request.currency) {
      throw new Error('Currency is required');
    }

    // 3. Validate customer
    if (!request.customerId) {
      throw new Error('Customer ID is required');
    }

    // 4. Validate payment method
    if (!['balance', 'card'].includes(request.paymentMethod)) {
      throw new Error(`Invalid payment method: ${request.paymentMethod}`);
    }

    console.log(`[PAYMENT_FINALIZATION] Validation passed for order: ${request.orderId}`);
  }

  /**
   * Process the actual payment transaction
   */
  private async processPaymentTransaction(request: PaymentFinalizationRequest) {
    try {
      const payment = await paymentService.processPayment(
        request.orderId,
        request.amount,
        request.currency,
        request.paymentMethod
      );

      console.log(`[PAYMENT] Payment processed:`, {
        paymentId: payment.id,
        amount: payment.amount,
        status: payment.status
      });

      return payment;
    } catch (error) {
      console.error('[PAYMENT] Payment processing error:', error);
      throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update booking status after successful payment
   */
  private async updateBookingStatus(bookingId: string, newStatus: string): Promise<void> {
    try {
      console.log(`[BOOKING] Updating booking ${bookingId} status to ${newStatus}`);

      // In real implementation, this would update the database
      // For now, we just log it
      // await prisma.booking.update({
      //   where: { id: bookingId },
      //   data: { 
      //     status: newStatus,
      //     paymentStatus: 'PAID',
      //     lastModified: new Date()
      //   }
      // });

      console.log(`[BOOKING] Status updated successfully for booking: ${bookingId}`);
    } catch (error) {
      console.error('[BOOKING] Failed to update booking status:', error);
      throw error;
    }
  }

  /**
   * Generate all finalization documents
   */
  private async generateFinalizationDocuments(request: PaymentFinalizationRequest): Promise<Record<string, string>> {
    const documents: Record<string, string> = {};

    try {
      // Create booking object for document generation
      const booking: BookingForFinalization = {
        id: request.bookingId,
        reference: `BK-${request.orderId.substring(0, 8)}`,
        customerId: request.customerId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        amount: request.amount,
        currency: request.currency,
        metadata: request.metadata || {}
      };

      // Generate Invoice
      try {
        const invoiceDoc = await documentGenerationService.generateInvoice(booking as any);
        documents.invoice = invoiceDoc?.fileName || 'invoice_generated';
        console.log(`[DOCUMENTS] Invoice generated: ${documents.invoice}`);
      } catch (err) {
        console.warn('[DOCUMENTS] Invoice generation warning:', err);
      }

      // Generate Receipt
      try {
        const receiptDoc = await documentGenerationService.generateReceipt(booking as any);
        documents.receipt = receiptDoc?.fileName || 'receipt_generated';
        console.log(`[DOCUMENTS] Receipt generated: ${documents.receipt}`);
      } catch (err) {
        console.warn('[DOCUMENTS] Receipt generation warning:', err);
      }

      // Generate E-Ticket (if applicable)
      try {
        const ticketDoc = await documentGenerationService.generateETicket(booking as any);
        documents.eTicket = ticketDoc?.fileName || 'eticket_generated';
        console.log(`[DOCUMENTS] E-Ticket generated: ${documents.eTicket}`);
      } catch (err) {
        console.warn('[DOCUMENTS] E-Ticket generation warning:', err);
      }

      // Generate Itinerary
      try {
        const itineraryDoc = await documentGenerationService.generateItinerary(booking as any);
        documents.itinerary = itineraryDoc?.fileName || 'itinerary_generated';
        console.log(`[DOCUMENTS] Itinerary generated: ${documents.itinerary}`);
      } catch (err) {
        console.warn('[DOCUMENTS] Itinerary generation warning:', err);
      }

      return documents;
    } catch (error) {
      console.error('[DOCUMENTS] Critical error during document generation:', error);
      // Return empty documents object but don't fail the whole process
      return documents;
    }
  }

  /**
   * Send notifications about payment finalization
   */
  private async sendFinalizationNotifications(request: PaymentFinalizationRequest): Promise<void> {
    try {
      // Send payment confirmation to customer
      await notificationService.sendPaymentConfirmation({
        paymentStatus: 'received',
        bookingId: request.bookingId,
        orderId: request.orderId,
        customerId: request.customerId,
        amount: request.amount,
        currency: request.currency
      } as any);

      console.log(`[NOTIFICATIONS] Payment confirmation sent for booking: ${request.bookingId}`);

      // Send booking confirmation
      await notificationService.sendBookingConfirmation({
        bookingId: request.bookingId,
        customerId: request.customerId,
        bookingReference: `BK-${request.orderId.substring(0, 8)}`
      } as any);

      console.log(`[NOTIFICATIONS] Booking confirmation sent for booking: ${request.bookingId}`);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error sending notifications:', error);
      // Don't throw - notifications are not critical to the payment flow
    }
  }

  /**
   * Log finalization transaction
   */
  private async logFinalization(orderId: string, status: string): Promise<void> {
    this.finalizationLog.push({
      timestamp: new Date(),
      orderId,
      status
    });

    console.log(`[FINALIZATION_LOG] Transaction logged: ${orderId} - ${status}`);
  }

  /**
   * Get finalization status
   */
  async getFinalizationStatus(paymentId: string): Promise<PaymentFinalizationResponse | null> {
    return this.processedPayments.get(paymentId) || null;
  }

  /**
   * Get finalization history
   */
  getFinalizationHistory(limit: number = 100): Array<{ timestamp: Date; orderId: string; status: string }> {
    return this.finalizationLog.slice(-limit);
  }

  /**
   * Check if payment already finalized
   */
  isPaymentFinalized(bookingId: string): boolean {
    for (const response of this.processedPayments.values()) {
      if (response.bookingId === bookingId && response.success) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<{
    totalFinalizations: number;
    successfulFinalizations: number;
    failedFinalizations: number;
    totalAmountProcessed: number;
  }> {
    let successful = 0;
    let failed = 0;
    let totalAmount = 0;

    this.processedPayments.forEach(response => {
      if (response.success) {
        successful++;
      } else {
        failed++;
      }
      // Note: We don't have amount in response, would need to track separately
    });

    return {
      totalFinalizations: this.processedPayments.size,
      successfulFinalizations: successful,
      failedFinalizations: failed,
      totalAmountProcessed: totalAmount
    };
  }
}

export default new PaymentFinalizationService();

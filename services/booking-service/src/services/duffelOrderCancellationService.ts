import logger from '../utils/logger';
import { duffelClient } from '../integrations/duffelApiClient';
import { prisma } from '../database/index';
import { BookingStatus } from '../types/booking';

/**
 * Enum for cancellation method types
 */
export enum CancellationMethod {
  RESERVATION_ONLY = 'reservation_only', // Hold booking - no ticket issued
  TICKET_VOID = 'ticket_void', // Same day cancellation before 23:59
  TICKET_REFUND = 'ticket_refund' // Next day cancellation after 00:00
}

/**
 * Interface for cancellation request
 */
export interface OrderCancellationRequest {
  orderId: string;
  reason?: string;
  cancellationMethod?: CancellationMethod;
}

/**
 * Interface for cancellation response
 */
export interface OrderCancellationResponse {
  success: boolean;
  orderId: string;
  cancellationId?: string;
  cancellationMethod: CancellationMethod;
  refundAmount?: number;
  refundCurrency?: string;
  refundTo?: string;
  message: string;
  timestamp: Date;
  expiresAt?: string;
}

/**
 * Interface for ticket information
 */
export interface TicketInfo {
  ticketNumber: string;
  issueDate: Date;
  pnr: string;
  passengerId?: string;
}

export class DuffelOrderCancellationService {
  /**
   * Determine the appropriate cancellation method based on booking status and timing
   */
  private determineCancellationMethod(
    isHoldBooking: boolean,
    ticketIssuedAt?: Date
  ): CancellationMethod {
    // If it's a hold booking, no ticket is issued - only cancel reservation
    if (isHoldBooking) {
      return CancellationMethod.RESERVATION_ONLY;
    }

    // If no ticket issued date provided, treat as reservation only
    if (!ticketIssuedAt) {
      return CancellationMethod.RESERVATION_ONLY;
    }

    // Check if ticket was issued today or before today
    const now = new Date();
    const issueDate = new Date(ticketIssuedAt);
    
    // Reset hours to compare dates only
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const issueDateMidnight = new Date(issueDate.getFullYear(), issueDate.getMonth(), issueDate.getDate(), 0, 0, 0, 0);

    // If ticket was issued today and it's before 23:59:59
    if (issueDateMidnight.getTime() === todayMidnight.getTime()) {
      // Check if current time is before 23:59:59
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const beforeMidnight = currentSeconds < 86399; // 86399 = 23:59:59
      
      if (beforeMidnight) {
        logger.info('[CancellationService] Ticket issued today, before 23:59 - using VOID method');
        return CancellationMethod.TICKET_VOID;
      }
    }

    // If ticket was issued before today, or after 23:59:59 today - must refund
    logger.info('[CancellationService] Ticket issued before today or after 23:59 - using REFUND method');
    return CancellationMethod.TICKET_REFUND;
  }

  /**
   * Get ticket information from booking
   */
  private async getTicketInformation(bookingId: string): Promise<TicketInfo | null> {
    try {
      // Query the booking to find ticket information
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          documents: true
        }
      });

      if (!booking) {
        logger.warn(`[CancellationService] Booking not found: ${bookingId}`);
        return null;
      }

      // Check if ticket document exists
      const ticketDoc = booking.documents?.find((doc: any) => 
        (doc as any).type === 'ticket' || (doc as any).type === 'e_ticket'
      );

      if (!ticketDoc) {
        logger.info(`[CancellationService] No ticket document found for booking: ${bookingId}`);
        return null;
      }

      // Extract ticket information from the document
      // Note: This assumes ticket metadata is stored in the document
      const ticketInfo: TicketInfo = {
        ticketNumber: (ticketDoc as any).ticketNumber || 'UNKNOWN',
        issueDate: ticketDoc.createdAt,
        pnr: booking.supplierPnr || 'UNKNOWN'
      };

      return ticketInfo;
    } catch (error) {
      logger.error('[CancellationService] Error getting ticket information:', error);
      return null;
    }
  }

  /**
   * Validate order can be cancelled
   */
  private async validateOrderCancellation(orderId: string): Promise<boolean> {
    try {
      const isCancellable = await duffelClient.isOrderCancellable(orderId);

      if (!isCancellable) {
        logger.warn(`[CancellationService] Order is not cancellable: ${orderId}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[CancellationService] Error validating order cancellation:', error);
      return false;
    }
  }

  /**
   * Create cancellation quote and review refund terms
   */
  private async reviewCancellationTerms(orderId: string): Promise<any> {
    try {
      logger.info(`[CancellationService] Creating cancellation quote for order: ${orderId}`);

      const cancellationQuote = await duffelClient.createCancellationQuote(orderId);

      if (!cancellationQuote) {
        logger.error(`[CancellationService] Failed to create cancellation quote`);
        return null;
      }

      logger.info(`[CancellationService] Cancellation quote created:`, {
        cancellationId: cancellationQuote.id || cancellationQuote.data?.id,
        refundAmount: cancellationQuote.refund_amount || cancellationQuote.data?.refund_amount,
        refundCurrency: cancellationQuote.refund_currency || cancellationQuote.data?.refund_currency,
        refundTo: cancellationQuote.refund_to || cancellationQuote.data?.refund_to,
        expiresAt: cancellationQuote.expires_at || cancellationQuote.data?.expires_at
      });

      return cancellationQuote;
    } catch (error) {
      logger.error('[CancellationService] Error creating cancellation quote:', error);
      return null;
    }
  }

  /**
   * Confirm cancellation after reviewing terms
   */
  private async confirmCancellationProcess(
    cancellationId: string,
    method: CancellationMethod
  ): Promise<any> {
    try {
      logger.info(`[CancellationService] Confirming cancellation with method: ${method}`, {
        cancellationId
      });

      const confirmed = await duffelClient.confirmCancellation(cancellationId);

      logger.info(`[CancellationService] Cancellation confirmed successfully`);
      return confirmed;
    } catch (error) {
      logger.error('[CancellationService] Error confirming cancellation:', error);
      return null;
    }
  }

  /**
   * Extract and store airline credits from cancellation response
   */
  private async storeAirlineCredits(
    bookingId: string,
    customerId: string | undefined,
    cancellationDetails: any
  ): Promise<number> {
    try {
      const airlineCreditsArray = cancellationDetails?.airline_credits || 
                                 cancellationDetails?.data?.airline_credits || 
                                 [];

      if (!Array.isArray(airlineCreditsArray) || airlineCreditsArray.length === 0) {
        logger.info(`[CancellationService] No airline credits found in cancellation response`);
        return 0;
      }

      logger.info(`[CancellationService] Processing ${airlineCreditsArray.length} airline credits`);

      let creditsStored = 0;

      for (const credit of airlineCreditsArray) {
        try {
          // Extract credit data from Duffel response
          const creditId = credit.id || credit.duffel_credit_id;
          const code = credit.code || '';
          const amount = parseFloat(credit.amount || '0');
          const currency = credit.currency || 'USD';
          const type = credit.type || 'unknown';
          const airlineIataCode = credit.airline_iata_code || '';
          const givenName = credit.given_name;
          const familyName = credit.family_name;
          const issuedOn = credit.issued_on ? new Date(credit.issued_on) : new Date();
          const expiresAt = credit.expires_at ? new Date(credit.expires_at) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          const passengerId = credit.passenger_id;
          const originalOrderId = credit.order_id;
          const liveMode = credit.live_mode || false;

          // Store airline credit in database
          const storedCredit = await prisma.airlineCredit.create({
            data: {
              duffelCreditId: creditId,
              bookingId,
              customerId: customerId || null,
              passengerId: passengerId || null,
              code,
              amount,
              currency,
              type,
              airlineIataCode,
              givenName: givenName || null,
              familyName: familyName || null,
              issuedOn,
              expiresAt,
              status: 'active',
              availableForUse: true,
              originalOrderId: originalOrderId || null,
              liveMode
            }
          });

          logger.info(`[CancellationService] Airline credit stored successfully:`, {
            duffelCreditId: creditId,
            code,
            amount,
            currency,
            airlineIataCode
          });

          creditsStored++;
        } catch (creditError) {
          logger.error(`[CancellationService] Error storing individual airline credit:`, creditError);
          // Continue processing other credits even if one fails
        }
      }

      logger.info(`[CancellationService] Successfully stored ${creditsStored} airline credits`);
      return creditsStored;
    } catch (error) {
      logger.error('[CancellationService] Error processing airline credits:', error);
      return 0;
    }
  }

  /**
   * Update booking status in database after successful cancellation
   */
  private async updateBookingStatus(
    bookingId: string,
    cancellationId: string,
    method: CancellationMethod,
    cancellationDetails: any
  ): Promise<void> {
    try {
      logger.info(`[CancellationService] Updating booking status:`, {
        bookingId,
        cancellationId,
        method
      });

      // Get booking to access customerId
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      // Create refund record if applicable
      let refundAmount = 0;
      let refundCurrency = 'USD';

      if (cancellationDetails) {
        refundAmount = parseFloat(
          cancellationDetails.refund_amount || 
          cancellationDetails.data?.refund_amount || 
          '0'
        );
        refundCurrency = cancellationDetails.refund_currency || 
                        cancellationDetails.data?.refund_currency || 
                        'USD';
      }

      // Update booking status
      const status = method === CancellationMethod.TICKET_REFUND ? 
        BookingStatus.REFUNDED : 
        BookingStatus.CANCELLED;

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status,
          paymentStatus: method === CancellationMethod.TICKET_REFUND ? 'REFUNDED' : 'CANCELLED'
        }
      });

      // Create refund record
      if (refundAmount > 0) {
        await prisma.refund.create({
          data: {
            bookingId,
            amount: refundAmount,
            reason: `Order cancelled via Duffel - Method: ${method} - Cancellation ID: ${cancellationId}`,
            status: 'completed'
          }
        });
      }

      // Extract and store airline credits from cancellation response
      const creditsStored = await this.storeAirlineCredits(
        bookingId,
        booking.customerId,
        cancellationDetails
      );

      // Create audit log with credit information
      await prisma.auditLog.create({
        data: {
          bookingId,
          action: `order_cancelled`,
          actor: 'system',
          details: {
            cancellationId,
            method,
            refundAmount,
            refundCurrency,
            airlineCreditsStored: creditsStored,
            timestamp: new Date().toISOString()
          }
        }
      });

      logger.info(`[CancellationService] Booking status updated successfully with ${creditsStored} airline credits`);
    } catch (error) {
      logger.error('[CancellationService] Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Main cancellation process
   */
  async cancelOrder(request: OrderCancellationRequest): Promise<OrderCancellationResponse> {
    const { orderId, reason = 'Customer requested cancellation' } = request;

    try {
      logger.info(`[CancellationService] Starting order cancellation process:`, {
        orderId,
        reason
      });

      // Step 1: Validate order exists and is cancellable
      const isValid = await this.validateOrderCancellation(orderId);
      if (!isValid) {
        return {
          success: false,
          orderId,
          cancellationMethod: CancellationMethod.RESERVATION_ONLY,
          message: 'Order is not cancellable or does not exist',
          timestamp: new Date()
        };
      }

      // Step 2: Get booking details from database
      const booking = await prisma.booking.findFirst({
        where: { supplierRef: orderId }
      });

      if (!booking) {
        logger.warn(`[CancellationService] Booking not found for Duffel order: ${orderId}`);
        return {
          success: false,
          orderId,
          cancellationMethod: CancellationMethod.RESERVATION_ONLY,
          message: 'Booking not found in system',
          timestamp: new Date()
        };
      }

      // Step 3: Determine cancellation method based on booking type and ticket issue date
      const isHoldBooking = booking.status === 'HOLD';
      const ticketInformation = await this.getTicketInformation(booking.id);
      const cancellationMethod = this.determineCancellationMethod(
        isHoldBooking,
        ticketInformation?.issueDate
      );

      logger.info(`[CancellationService] Determined cancellation method:`, {
        method: cancellationMethod,
        isHoldBooking,
        ticketIssued: !!ticketInformation
      });

      // Step 4: Create cancellation quote
      const cancellationQuote = await this.reviewCancellationTerms(orderId);

      if (!cancellationQuote) {
        return {
          success: false,
          orderId,
          cancellationMethod,
          message: 'Failed to create cancellation quote',
          timestamp: new Date()
        };
      }

      // Step 5: Confirm cancellation
      const cancellationId = cancellationQuote.id || cancellationQuote.data?.id;
      const confirmedCancellation = await this.confirmCancellationProcess(
        cancellationId,
        cancellationMethod
      );

      if (!confirmedCancellation) {
        return {
          success: false,
          orderId,
          cancellationId,
          cancellationMethod,
          message: 'Failed to confirm cancellation',
          timestamp: new Date()
        };
      }

      // Step 6: Update booking status in database
      await this.updateBookingStatus(
        booking.id,
        cancellationId,
        cancellationMethod,
        confirmedCancellation
      );

      // Step 7: Prepare response with cancellation details
      const refundAmount = parseFloat(
        confirmedCancellation.refund_amount || 
        confirmedCancellation.data?.refund_amount || 
        '0'
      );
      const refundCurrency = confirmedCancellation.refund_currency || 
                            confirmedCancellation.data?.refund_currency || 
                            'USD';
      const refundTo = confirmedCancellation.refund_to || 
                      confirmedCancellation.data?.refund_to || 
                      'unknown';

      const message = this.buildCancellationMessage(cancellationMethod, refundAmount, refundTo);

      logger.info(`[CancellationService] Order cancellation completed successfully:`, {
        orderId,
        cancellationId,
        method: cancellationMethod,
        refundAmount,
        refundCurrency
      });

      return {
        success: true,
        orderId,
        cancellationId,
        cancellationMethod,
        refundAmount,
        refundCurrency,
        refundTo,
        message,
        timestamp: new Date()
      };

    } catch (error: any) {
      logger.error(`[CancellationService] Error during order cancellation:`, error);

      return {
        success: false,
        orderId,
        cancellationMethod: CancellationMethod.RESERVATION_ONLY,
        message: `Cancellation failed: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Build user-friendly cancellation message
   */
  private buildCancellationMessage(
    method: CancellationMethod,
    refundAmount: number,
    refundTo: string
  ): string {
    switch (method) {
      case CancellationMethod.RESERVATION_ONLY:
        return 'Reservation has been cancelled. This was a hold booking with no ticket issued.';

      case CancellationMethod.TICKET_VOID:
        return `Ticket has been voided (cancelled) successfully. This cancellation was processed on the same day of ticket issuance. ` +
               `Refund amount: ${refundAmount} will be credited to ${refundTo}.`;

      case CancellationMethod.TICKET_REFUND:
        return `Ticket has been refunded successfully. This cancellation was processed after the ticket issuance date. ` +
               `Refund amount: ${refundAmount} will be credited to ${refundTo}.`;

      default:
        return 'Order has been cancelled successfully.';
    }
  }

  /**
   * Get cancellation status for an order
   */
  async getCancellationStatus(orderId: string): Promise<any> {
    try {
      logger.info(`[CancellationService] Fetching cancellation status for order: ${orderId}`);

      const booking = await prisma.booking.findFirst({
        where: { supplierRef: orderId }
      });

      if (!booking) {
        return {
          success: false,
          orderId,
          message: 'Booking not found'
        };
      }

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          bookingId: booking.id,
          action: 'order_cancelled'
        },
        orderBy: { timestamp: 'desc' }
      });

      const refunds = await prisma.refund.findMany({
        where: { bookingId: booking.id }
      });

      return {
        success: true,
        orderId,
        bookingId: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        cancellations: auditLogs,
        refunds,
        message: 'Cancellation status retrieved successfully'
      };

    } catch (error: any) {
      logger.error('[CancellationService] Error fetching cancellation status:', error);

      return {
        success: false,
        orderId,
        message: `Failed to fetch status: ${error.message}`
      };
    }
  }
}

export const duffelOrderCancellationService = new DuffelOrderCancellationService();

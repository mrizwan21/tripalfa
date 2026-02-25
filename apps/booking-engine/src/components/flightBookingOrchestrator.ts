/**
 * Flight Booking Orchestrator Service
 * 
 * Unified service that orchestrates the complete end-to-end flight booking lifecycle:
 * 1. Hold Booking - Reserve inventory without immediate payment
 * 2. Itinerary Generation - Create travel itinerary document
 * 3. Invoice Generation - Create commercial invoice
 * 4. Retrieve Booking - Get booking details and status
 * 5. Issue Ticket - Convert hold to confirmed ticket
 * 6. Generate Receipt - Create payment receipt
 * 7. Cancel Booking - Cancel ticket/reservation
 * 8. Generate Refund Note - Create refund documentation
 * 
 * This service integrates with:
 * - HoldOrdersService (hold booking, payment, cancellation)
 * - DocumentGenerationService (itinerary, invoice, ticket, receipt, refund)
 * - Duffel API (flight order management)
 */

import holdOrdersService from './holdOrdersService';
import { DocumentGenerationService } from './documentGenerationService';
import { 
  FlightBooking, 
  DocumentCustomerInfo, 
  PaymentBreakdown, 
  RefundDetails,
  FlightSegment,
  DocumentPassenger
} from './documentGenerationService';

// Use native crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FlightBookingParticipant {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
  born_on: string;
  gender: string;
}

export interface CreateHoldBookingRequest {
  offerId: string;
  passengers: FlightBookingParticipant[];
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'balance' | 'card';
}

export interface IssueTicketRequest {
  orderId: string;
  passengers: Array<{
    passengerId: string;
    ticketNumber: string;
    seatNumber?: string;
    baggageAllowance?: string;
  }>;
}

export interface CancelBookingRequest {
  orderId: string;
  bookingId?: string;
  reason: string;
}

export interface BookingWorkflowResult {
  success: boolean;
  workflowId: string;
  currentStep: string;
  data?: any;
  error?: string;
  // Documents generated at each step
  itinerary?: { fileName: string; content: string };
  invoice?: { fileName: string; content: string };
  ticket?: { fileName: string; content: string };
  receipt?: { fileName: string; content: string };
  refundNote?: { fileName: string; content: string };
}

export interface BookingWorkflowState {
  workflowId: string;
  orderId: string;
  bookingReference: string;
  status: 'hold' | 'paid' | 'ticketed' | 'cancelled' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  steps: {
    hold: { completed: boolean; timestamp?: Date; data?: any };
    payment: { completed: boolean; timestamp?: Date; data?: any };
    ticketing: { completed: boolean; timestamp?: Date; data?: any };
    cancellation: { completed: boolean; timestamp?: Date; data?: any };
    refund: { completed: boolean; timestamp?: Date; data?: any };
  };
}

// ============================================================================
// ORCHESTRATOR SERVICE
// ============================================================================

// Session storage key for workflow states
const WORKFLOW_STORAGE_KEY = 'flight_booking_workflows';

/**
 * Persist workflow states to sessionStorage
 */
function persistWorkflowStates(states: Map<string, BookingWorkflowState>): void {
  try {
    const statesObj = Object.fromEntries(states);
    sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(statesObj));
  } catch (error) {
    console.warn('[FlightBookingOrchestrator] Failed to persist workflow states. Storage may be full or unavailable.');
  }
}

/**
 * Load workflow states from sessionStorage
 */
function loadWorkflowStates(): Map<string, BookingWorkflowState> {
  try {
    const stored = sessionStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (stored) {
      const statesObj = JSON.parse(stored);
      return new Map(Object.entries(statesObj));
    }
  } catch (error) {
    console.warn('[FlightBookingOrchestrator] Failed to load workflow states. Storage may be corrupted.');
  }
  return new Map();
}

class FlightBookingOrchestrator {
  private documentService: DocumentGenerationService;
  
  // Workflow state storage with sessionStorage persistence
  private workflowStates: Map<string, BookingWorkflowState> = loadWorkflowStates();

  constructor() {
    this.documentService = new DocumentGenerationService();
  }

  /**
   * Save workflow state to storage
   */
  private saveWorkflowState(state: BookingWorkflowState): void {
    this.workflowStates.set(state.workflowId, state);
    persistWorkflowStates(this.workflowStates);
  }

  // ========================================================================
  // STEP 1: CREATE HOLD BOOKING
  // ========================================================================
  
  /**
   * Create a hold booking (Step 1 of E2E flow)
   * This reserves the flight without immediate payment
   */
  async createHoldBooking(request: CreateHoldBookingRequest): Promise<BookingWorkflowResult> {
    const workflowId = uuidv4();
    
    try {
      // Call hold orders service to create hold
      const holdOrder = await holdOrdersService.createHoldOrder({
        offerId: request.offerId,
        passengers: request.passengers,
        customerId: request.customerId,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        totalAmount: request.totalAmount,
        currency: request.currency,
        type: 'flight'
      });

      // Generate itinerary document
      const bookingData = this.mapToFlightBooking(holdOrder, request);
      const customerInfo: DocumentCustomerInfo = {
        id: request.customerId,
        name: `${request.passengers[0]?.given_name || ''} ${request.passengers[0]?.family_name || ''}`,
        email: request.customerEmail,
        phone: request.customerPhone
      };

      const itineraryHtml = this.documentService.generateFlightItinerary(bookingData, customerInfo);
      const invoiceHtml = this.documentService.generateFlightInvoice(
        bookingData, 
        customerInfo, 
        this.createPaymentBreakdown(request.totalAmount, request.currency)
      );

      // Store workflow state
      const workflowState: BookingWorkflowState = {
        workflowId,
        orderId: holdOrder.orderId,
        bookingReference: holdOrder.reference,
        status: 'hold',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: {
          hold: { completed: true, timestamp: new Date(), data: holdOrder },
          payment: { completed: false },
          ticketing: { completed: false },
          cancellation: { completed: false },
          refund: { completed: false }
        }
      };
      
      this.saveWorkflowState(workflowState);

      return {
        success: true,
        workflowId,
        currentStep: 'hold',
        data: {
          orderId: holdOrder.orderId,
          bookingReference: holdOrder.reference,
          paymentRequiredBy: holdOrder.paymentRequiredBy,
          priceGuaranteeExpiresAt: holdOrder.priceGuaranteeExpiresAt,
          totalAmount: holdOrder.totalAmount,
          currency: holdOrder.currency
        },
        itinerary: {
          fileName: `itinerary_${holdOrder.reference}.html`,
          content: itineraryHtml
        },
        invoice: {
          fileName: `invoice_${holdOrder.reference}.html`,
          content: invoiceHtml
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId,
        currentStep: 'hold',
        error: error instanceof Error ? error.message : 'Failed to create hold booking'
      };
    }
  }

  // ========================================================================
  // STEP 2: PROCESS PAYMENT (Convert Hold to Paid)
  // ========================================================================
  
  /**
   * Process payment for hold booking (Step 2 of E2E flow)
   * Converts hold booking to confirmed booking
   */
  async processPayment(request: PaymentRequest, workflowId: string): Promise<BookingWorkflowResult> {
    try {
      const workflowState = this.workflowStates.get(workflowId);
      if (!workflowState) {
        throw new Error('Workflow not found. Please create a hold booking first.');
      }

      if (workflowState.status !== 'hold') {
        throw new Error(`Cannot process payment. Current status: ${workflowState.status}`);
      }

      // Process payment via hold orders service
      const paymentResult = await holdOrdersService.payForHoldOrder({
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.paymentMethod
      });

      // Update workflow state
      workflowState.status = 'paid';
      workflowState.updatedAt = new Date();
      workflowState.steps.payment = {
        completed: true,
        timestamp: new Date(),
        data: paymentResult
      };
      this.saveWorkflowState(workflowState);

      // Generate receipt
      const bookingData = this.createSampleFlightBooking(workflowState.bookingReference);
      const customerInfo: DocumentCustomerInfo = {
        id: 'customer-id',
        name: 'Customer Name',
        email: 'customer@email.com',
        phone: '+971500000000'
      };
      
      const receiptHtml = this.documentService.generateFlightReceipt(
        bookingData,
        customerInfo,
        this.createPaymentBreakdown(request.amount, request.currency)
      );

      return {
        success: true,
        workflowId,
        currentStep: 'payment',
        data: {
          orderId: request.orderId,
          paymentReference: paymentResult.paymentReference,
          paymentStatus: paymentResult.paymentStatus,
          message: paymentResult.message
        },
        receipt: {
          fileName: `receipt_${workflowState.bookingReference}.html`,
          content: receiptHtml
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId,
        currentStep: 'payment',
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // ========================================================================
  // STEP 3: RETRIEVE BOOKING
  // ========================================================================
  
  /**
   * Retrieve booking details (Step 3 of E2E flow)
   * Gets current booking status and details
   */
  async retrieveBooking(orderId: string, workflowId?: string): Promise<BookingWorkflowResult> {
    try {
      // Get booking from hold orders service
      const booking = await holdOrdersService.getHoldOrder(orderId);

      let workflowState: BookingWorkflowState | undefined;
      if (workflowId) {
        workflowState = this.workflowStates.get(workflowId);
      }

      return {
        success: true,
        workflowId: workflowId || uuidv4(),
        currentStep: 'retrieve',
        data: {
          orderId: booking.id,
          bookingReference: booking?.bookings?.[0]?.booking_reference,
          status: booking.status,
          totalAmount: booking.total_amount,
          currency: booking.total_currency,
          paymentStatus: booking.payment_status,
          createdAt: booking.created_at,
          slices: booking.slices,
          passengers: booking.passengers,
          workflowStatus: workflowState?.status
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId: workflowId || uuidv4(),
        currentStep: 'retrieve',
        error: error instanceof Error ? error.message : 'Failed to retrieve booking'
      };
    }
  }

  // ========================================================================
  // STEP 4: ISSUE TICKET
  // ========================================================================
  
  /**
   * Issue ticket for confirmed booking (Step 4 of E2E flow)
   * Generates e-ticket document
   */
  async issueTicket(request: IssueTicketRequest, workflowId: string): Promise<BookingWorkflowResult> {
    try {
      const workflowState = this.workflowStates.get(workflowId);
      if (!workflowState) {
        throw new Error('Workflow not found');
      }

      if (workflowState.status !== 'paid') {
        throw new Error(`Cannot issue ticket. Current status: ${workflowState.status}. Payment required first.`);
      }

      // Generate e-ticket
      const bookingData = this.createSampleFlightBooking(workflowState.bookingReference);
      const customerInfo: DocumentCustomerInfo = {
        id: 'customer-id',
        name: 'Customer Name',
        email: 'customer@email.com',
        phone: '+971500000000'
      };

      const ticketHtml = this.documentService.generateFlightETicket(bookingData, customerInfo);

      // Update workflow state
      workflowState.status = 'ticketed';
      workflowState.updatedAt = new Date();
      workflowState.steps.ticketing = {
        completed: true,
        timestamp: new Date(),
        data: {
          ticketNumber: request.passengers[0]?.ticketNumber || `TKT-${Date.now()}`,
          issuedAt: new Date()
        }
      };
      this.saveWorkflowState(workflowState);

      return {
        success: true,
        workflowId,
        currentStep: 'ticketing',
        data: {
          orderId: request.orderId,
          ticketNumber: request.passengers[0]?.ticketNumber || `TKT-${Date.now()}`,
          issuedAt: new Date().toISOString(),
          status: 'ticketed'
        },
        ticket: {
          fileName: `eticket_${workflowState.bookingReference}.html`,
          content: ticketHtml
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId,
        currentStep: 'ticketing',
        error: error instanceof Error ? error.message : 'Failed to issue ticket'
      };
    }
  }

  // ========================================================================
  // STEP 5: CANCEL BOOKING
  // ========================================================================
  
  /**
   * Cancel booking/ticket (Step 5 of E2E flow)
   * Cancels the reservation and initiates refund
   */
  async cancelBooking(request: CancelBookingRequest, workflowId: string): Promise<BookingWorkflowResult> {
    try {
      let workflowState = this.workflowStates.get(workflowId);
      
      if (!workflowState && request.bookingId) {
        // Try to find workflow by booking ID
        for (const [id, state] of this.workflowStates) {
          if (state.bookingReference === request.bookingId) {
            workflowState = state;
            workflowId = id;
            break;
          }
        }
      }

      if (!workflowState) {
        // Create a minimal workflow state for external orders
        workflowState = {
          workflowId,
          orderId: request.orderId,
          bookingReference: request.bookingId || request.orderId,
          status: 'paid',
          createdAt: new Date(),
          updatedAt: new Date(),
          steps: {
            hold: { completed: true },
            payment: { completed: true },
            ticketing: { completed: true },
            cancellation: { completed: false },
            refund: { completed: false }
          }
        };
      }

      // Cancel via hold orders service
      const cancellationResult = await holdOrdersService.cancelHoldOrder(
        request.orderId,
        request.reason
      );

      // Update workflow state
      workflowState.status = 'cancelled';
      workflowState.updatedAt = new Date();
      workflowState.steps.cancellation = {
        completed: true,
        timestamp: new Date(),
        data: cancellationResult
      };
      this.saveWorkflowState(workflowState);

      return {
        success: true,
        workflowId,
        currentStep: 'cancellation',
        data: {
          orderId: request.orderId,
          bookingReference: workflowState.bookingReference,
          cancellationId: cancellationResult.success ? `CNL-${Date.now()}` : undefined,
          cancelledAt: new Date().toISOString(),
          status: 'cancelled',
          message: cancellationResult.message
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId,
        currentStep: 'cancellation',
        error: error instanceof Error ? error.message : 'Failed to cancel booking'
      };
    }
  }

  // ========================================================================
  // STEP 6: GENERATE REFUND NOTE
  // ========================================================================
  
  /**
   * Generate refund note (Step 6 of E2E flow)
   * Creates refund documentation after cancellation
   */
  async generateRefundNote(
    orderId: string, 
    workflowId: string,
    refundAmount: number,
    currency: string,
    reason: string
  ): Promise<BookingWorkflowResult> {
    try {
      const workflowState = this.workflowStates.get(workflowId);
      
      if (!workflowState || !workflowState.steps.cancellation.completed) {
        throw new Error('Booking must be cancelled before generating refund note');
      }

      // Create refund details
      const refundDetails: RefundDetails = {
        id: uuidv4(),
        refundNumber: `RFN-${Date.now()}`,
        amount: refundAmount,
        currency,
        reason,
        type: 'full',
        status: 'completed',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        processedAt: new Date().toISOString(),
        refundedTo: 'original_payment',
        originalPaymentAmount: refundAmount,
        cancellationFees: 0,
        taxRefund: 0
      };

      const bookingData = this.createSampleFlightBooking(workflowState.bookingReference);
      const customerInfo: DocumentCustomerInfo = {
        id: 'customer-id',
        name: 'Customer Name',
        email: 'customer@email.com',
        phone: '+971500000000'
      };

      const refundNoteHtml = this.documentService.generateRefundNote(
        refundDetails,
        bookingData,
        customerInfo
      );

      // Update workflow state
      workflowState.status = 'refunded';
      workflowState.updatedAt = new Date();
      workflowState.steps.refund = {
        completed: true,
        timestamp: new Date(),
        data: refundDetails
      };
      this.saveWorkflowState(workflowState);

      return {
        success: true,
        workflowId,
        currentStep: 'refund',
        data: {
          orderId,
          refundNumber: refundDetails.refundNumber,
          refundAmount,
          currency,
          processedAt: refundDetails.processedAt,
          status: 'refunded'
        },
        refundNote: {
          fileName: `refund_note_${workflowState.bookingReference}.html`,
          content: refundNoteHtml
        }
      };

    } catch (error) {
      return {
        success: false,
        workflowId,
        currentStep: 'refund',
        error: error instanceof Error ? error.message : 'Failed to generate refund note'
      };
    }
  }

  // ========================================================================
  // GET WORKFLOW STATE
  // ========================================================================
  
  /**
   * Get current workflow state
   */
  getWorkflowState(workflowId: string): BookingWorkflowState | undefined {
    return this.workflowStates.get(workflowId);
  }

  /**
   * Get all active workflows
   */
  getAllWorkflows(): BookingWorkflowState[] {
    return Array.from(this.workflowStates.values());
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================
  
  private mapToFlightBooking(holdOrder: any, request: CreateHoldBookingRequest): FlightBooking {
    return {
      id: holdOrder.id,
      bookingReference: holdOrder.reference,
      passengers: request.passengers.map((p, i) => ({
        id: `pax-${i}`,
        firstName: p.given_name,
        lastName: p.family_name,
        type: 'adult' as const,
        nationality: '',
        passportNumber: ''
      })),
      segments: [],
      totalAmount: holdOrder.totalAmount || request.totalAmount,
      baseFare: (holdOrder.totalAmount || request.totalAmount) * 0.85,
      taxes: (holdOrder.totalAmount || request.totalAmount) * 0.15,
      currency: holdOrder.currency || request.currency
    };
  }

  private createSampleFlightBooking(reference: string): FlightBooking {
    const segment: FlightSegment = {
      id: 'seg-001',
      flightNumber: 'EK2',
      airline: 'Emirates',
      airlineIata: 'EK',
      departureAirport: 'Dubai International',
      departureAirportCode: 'DXB',
      departureCity: 'Dubai',
      departureTerminal: '3',
      departureTime: '08:30',
      departureDate: '2026-03-15',
      arrivalAirport: 'London Heathrow',
      arrivalAirportCode: 'LHR',
      arrivalCity: 'London',
      arrivalTerminal: '3',
      arrivalTime: '12:45',
      duration: '7h 15m',
      cabinClass: 'Economy',
      baggagAllowance: '30kg + 7kg',
      mealType: 'Meal Included'
    };

    const passenger: DocumentPassenger = {
      id: 'pax-001',
      firstName: 'John',
      lastName: 'Doe',
      type: 'adult',
      nationality: 'UAE',
      passportNumber: 'A12345678'
    };

    return {
      id: reference,
      bookingReference: reference,
      pnr: 'ABC123',
      ticketNumber: '176-2345678901',
      passengers: [passenger],
      segments: [segment],
      totalAmount: 1250.00,
      baseFare: 1000.00,
      taxes: 250.00,
      currency: 'USD'
    };
  }

  private createPaymentBreakdown(amount: number, currency: string): PaymentBreakdown {
    return {
      baseFare: amount * 0.85,
      taxes: amount * 0.15,
      fees: 0,
      total: amount,
      currency,
      paymentMethod: 'credit_card',
      paidAmount: amount
    };
  }
}

// Export singleton instance
export const flightBookingOrchestrator = new FlightBookingOrchestrator();
export default flightBookingOrchestrator;

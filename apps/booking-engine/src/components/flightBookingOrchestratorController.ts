/**
 * Flight Booking Orchestrator Controller
 *
 * Express controller that exposes the Flight Booking Orchestrator service
 * through RESTful API endpoints.
 *
 * Endpoints:
 * - POST /api/booking/hold - Create hold booking (Step 1)
 * - POST /api/booking/payment - Process payment (Step 2)
 * - GET /api/booking/:orderId - Retrieve booking (Step 3)
 * - POST /api/booking/ticket - Issue ticket (Step 4)
 * - POST /api/booking/cancel - Cancel booking (Step 5)
 * - POST /api/booking/refund - Generate refund note (Step 6)
 * - GET /api/booking/workflow/:workflowId - Get workflow state
 */

import { Request, Response, NextFunction } from "express";
import flightBookingOrchestrator, {
  CreateHoldBookingRequest,
  PaymentRequest,
  IssueTicketRequest,
  CancelBookingRequest,
} from "./flightBookingOrchestrator";

/**
 * POST /api/booking/hold
 * Create a hold booking (Step 1 of E2E flow)
 *
 * Request Body:
 * {
 *   offerId: string,
 *   passengers: Array<{
 *     title: string,
 *     given_name: string,
 *     family_name: string,
 *     email: string,
 *     phone_number: string,
 *     born_on: string,
 *     gender: string
 *   }>,
 *   customerId: string,
 *   customerEmail: string,
 *   customerPhone: string,
 *   totalAmount: number,
 *   currency: string
 * }
 */
export const createHoldBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const request: CreateHoldBookingRequest = req.body;

    // Validate required fields
    if (
      !request.offerId ||
      !request.passengers ||
      !request.customerId ||
      !request.customerEmail
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: offerId, passengers, customerId, customerEmail",
      });
    }

    const result = await flightBookingOrchestrator.createHoldBooking(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      documents: {
        itinerary: result.itinerary,
        invoice: result.invoice,
      },
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/booking/payment
 * Process payment for hold booking (Step 2 of E2E flow)
 *
 * Request Body:
 * {
 *   orderId: string,
 *   amount: number,
 *   currency: string,
 *   paymentMethod: 'balance' | 'card',
 *   workflowId: string
 * }
 */
export const processPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId, amount, currency, paymentMethod, workflowId } = req.body;

    if (!orderId || !amount || !currency || !workflowId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId, amount, currency, workflowId",
      });
    }

    const request: PaymentRequest = {
      orderId,
      amount,
      currency,
      paymentMethod: paymentMethod || "balance",
    };

    const result = await flightBookingOrchestrator.processPayment(
      request,
      workflowId,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      documents: {
        receipt: result.receipt,
      },
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/booking/:orderId
 * Retrieve booking details (Step 3 of E2E flow)
 *
 * Query Parameters:
 * - workflowId: Optional workflow ID for tracking
 */
export const retrieveBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];

    const { workflowId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const result = await flightBookingOrchestrator.retrieveBooking(
      orderId,
      workflowId as string | undefined,
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/booking/ticket
 * Issue ticket for confirmed booking (Step 4 of E2E flow)
 *
 * Request Body:
 * {
 *   orderId: string,
 *   passengers: Array<{
 *     passengerId: string,
 *     ticketNumber: string,
 *     seatNumber?: string,
 *     baggageAllowance?: string
 *   }>,
 *   workflowId: string
 * }
 */
export const issueTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId, passengers, workflowId } = req.body;

    if (!orderId || !passengers || !workflowId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId, passengers, workflowId",
      });
    }

    const request: IssueTicketRequest = {
      orderId,
      passengers,
    };

    const result = await flightBookingOrchestrator.issueTicket(
      request,
      workflowId,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      documents: {
        ticket: result.ticket,
      },
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/booking/cancel
 * Cancel booking/ticket (Step 5 of E2E flow)
 *
 * Request Body:
 * {
 *   orderId: string,
 *   bookingId?: string,
 *   reason: string,
 *   workflowId: string
 * }
 */
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId, bookingId, reason, workflowId } = req.body;

    if (!orderId || !reason || !workflowId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId, reason, workflowId",
      });
    }

    const request: CancelBookingRequest = {
      orderId,
      bookingId,
      reason,
    };

    const result = await flightBookingOrchestrator.cancelBooking(
      request,
      workflowId,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/booking/refund
 * Generate refund note (Step 6 of E2E flow)
 *
 * Request Body:
 * {
 *   orderId: string,
 *   workflowId: string,
 *   refundAmount: number,
 *   currency: string,
 *   reason: string
 * }
 */
export const generateRefundNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId, workflowId, refundAmount, currency, reason } = req.body;

    if (!orderId || !workflowId || !refundAmount || !currency || !reason) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: orderId, workflowId, refundAmount, currency, reason",
      });
    }

    const result = await flightBookingOrchestrator.generateRefundNote(
      orderId,
      workflowId,
      refundAmount,
      currency,
      reason,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      documents: {
        refundNote: result.refundNote,
      },
      meta: {
        workflowId: result.workflowId,
        currentStep: result.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/booking/workflow/:workflowId
 * Get workflow state
 */
export const getWorkflowState = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let { workflowId } = req.params;
    if (Array.isArray(workflowId)) workflowId = workflowId[0];

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: "Workflow ID is required",
      });
    }

    const workflowState =
      flightBookingOrchestrator.getWorkflowState(workflowId);

    if (!workflowState) {
      return res.status(404).json({
        success: false,
        error: "Workflow not found",
      });
    }

    res.status(200).json({
      success: true,
      data: workflowState,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/booking/workflows
 * Get all active workflows
 */
export const getAllWorkflows = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workflows = flightBookingOrchestrator.getAllWorkflows();

    res.status(200).json({
      success: true,
      data: workflows,
      meta: {
        total: workflows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/booking/full-flow
 * Execute complete end-to-end booking flow (for testing)
 * This endpoint runs the entire flow in one request
 */
export const executeFullFlow = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      offerId,
      passengers,
      customerId,
      customerEmail,
      customerPhone,
      totalAmount,
      currency,
      paymentMethod,
      cancelAfterTicketing,
      refundAmount,
    } = req.body;

    // Validate required fields
    if (
      !offerId ||
      !passengers ||
      !customerId ||
      !customerEmail ||
      !totalAmount ||
      !currency
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required booking fields",
      });
    }

    const results: any = {
      steps: {},
    };

    // Step 1: Create Hold Booking
    const holdResult = await flightBookingOrchestrator.createHoldBooking({
      offerId,
      passengers,
      customerId,
      customerEmail,
      customerPhone: customerPhone || "",
      totalAmount,
      currency,
    });

    if (!holdResult.success) {
      return res.status(400).json(holdResult);
    }

    results.steps.hold = {
      success: true,
      workflowId: holdResult.workflowId,
      orderId: holdResult.data.orderId,
      bookingReference: holdResult.data.bookingReference,
    };

    const workflowId = holdResult.workflowId;

    // Step 2: Process Payment (if requested)
    if (paymentMethod) {
      const paymentResult = await flightBookingOrchestrator.processPayment(
        {
          orderId: holdResult.data.orderId,
          amount: totalAmount,
          currency,
          paymentMethod,
        },
        workflowId,
      );

      results.steps.payment = paymentResult;

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          error: "Payment failed",
          workflowId,
          results: results.steps,
        });
      }
    }

    // Step 3: Retrieve Booking
    const retrieveResult = await flightBookingOrchestrator.retrieveBooking(
      holdResult.data.orderId,
      workflowId,
    );
    results.steps.retrieve = retrieveResult;

    // Step 4: Issue Ticket (if payment was made)
    if (paymentMethod) {
      const ticketResult = await flightBookingOrchestrator.issueTicket(
        {
          orderId: holdResult.data.orderId,
          passengers: passengers.map((p: any, i: number) => ({
            passengerId: `pax-${i}`,
            ticketNumber: `TKT-${Date.now()}-${i}`,
          })),
        },
        workflowId,
      );

      results.steps.ticketing = ticketResult;

      // Step 5 & 6: Cancel and Refund (if requested)
      if (cancelAfterTicketing) {
        const cancelResult = await flightBookingOrchestrator.cancelBooking(
          {
            orderId: holdResult.data.orderId,
            reason:
              cancelAfterTicketing.reason || "Customer requested cancellation",
          },
          workflowId,
        );
        results.steps.cancellation = cancelResult;

        if (refundAmount) {
          const refundResult =
            await flightBookingOrchestrator.generateRefundNote(
              holdResult.data.orderId,
              workflowId,
              refundAmount,
              currency,
              cancelAfterTicketing.reason || "Booking cancellation",
            );
          results.steps.refund = refundResult;
        }
      }
    }

    // Get final workflow state
    const finalState = flightBookingOrchestrator.getWorkflowState(workflowId);

    res.status(200).json({
      success: true,
      workflowId,
      status: finalState?.status || "hold",
      flowCompleted: cancelAfterTicketing ? true : false,
      results: results.steps,
      workflowState: finalState,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import holdOrdersService from '../services/holdOrdersService';
import paymentService from '../services/paymentService';

/**
 * Check if an offer is eligible for hold orders
 */
export const checkHoldEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { offerId } = req.params;
    if (Array.isArray(offerId)) offerId = offerId[0];

    if (!offerId) {
      return res.status(400).json({
        success: false,
        error: 'Offer ID is required'
      });
    }

    const eligibility = await holdOrdersService.checkHoldEligibility(offerId);

    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new hold order
 */
export const createHoldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offerId, passengers, customerId, customerEmail, customerPhone, type } = req.body;

    // Validate required fields
    if (!offerId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Offer ID and passengers array are required'
      });
    }

    if (!customerId || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and email are required'
      });
    }

    const holdOrder = await holdOrdersService.createHoldOrder({
      offerId,
      passengers,
      customerId,
      customerEmail,
      customerPhone: customerPhone || '',
      type: type || 'flight',
      totalAmount: req.body.totalAmount || req.body.amount,
      currency: req.body.currency
    });

    res.status(201).json({
      success: true,
      data: holdOrder,
      message: holdOrdersService.generateHoldOrderSummary(holdOrder)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hold order details
 */
export const getHoldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const order = await holdOrdersService.getHoldOrder(orderId);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if price has changed
 */
export const checkPriceChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];
    let { lastKnownPrice, currency } = req.body;
    if (Array.isArray(currency)) currency = currency[0];

    if (!orderId || lastKnownPrice === undefined || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, lastKnownPrice, and currency are required'
      });
    }

    const priceCheck = await holdOrdersService.checkPriceChange(
      orderId,
      lastKnownPrice,
      currency
    );

    res.json({
      success: true,
      data: priceCheck
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if schedule has changed
 */
export const checkScheduleChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];
    const { originalSlices } = req.body;

    if (!orderId || !originalSlices || !Array.isArray(originalSlices)) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and originalSlices array are required'
      });
    }

    const scheduleCheck = await holdOrdersService.checkScheduleChange(orderId, originalSlices);

    res.json({
      success: true,
      data: scheduleCheck
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pay for hold order
 */
export const payForHoldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];
    const { amount, currency } = req.body;
    let { paymentMethod } = req.body;
    if (Array.isArray(paymentMethod)) paymentMethod = paymentMethod[0];
    if (!paymentMethod) paymentMethod = 'balance';

    if (!orderId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, amount, and currency are required'
      });
    }

    // Process payment
    const paymentRecord = await paymentService.processPayment(
      orderId,
      amount,
      currency,
      paymentMethod as 'balance' | 'card'
    );

    if (paymentRecord.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment processing failed',
        data: paymentRecord
      });
    }

    // Complete payment in Duffel
    const paymentResult = await holdOrdersService.payForHoldOrder({
      orderId,
      amount,
      currency,
      paymentMethod,
      reference: paymentRecord.reference
    });

    res.status(200).json({
      success: true,
      data: paymentResult,
      paymentRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel hold order
 */
export const cancelHoldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];
    let { reason } = req.body;
    if (Array.isArray(reason)) reason = reason[0];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await holdOrdersService.cancelHoldOrder(orderId, reason);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available services for hold order
 */
export const getAvailableServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const services = await holdOrdersService.getAvailableServices(orderId);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add service to hold order
 */
export const addServiceToHoldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];
    let { serviceId } = req.body;
    if (Array.isArray(serviceId)) serviceId = serviceId[0];

    if (!orderId || !serviceId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and service ID are required'
      });
    }

    const result = await holdOrdersService.addServiceToHoldOrder(orderId, serviceId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { paymentId } = req.params;
    if (Array.isArray(paymentId)) paymentId = paymentId[0];

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const payment = await paymentService.getPaymentDetails(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments for an order
 */
export const getOrderPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { orderId } = req.params;
    if (Array.isArray(orderId)) orderId = orderId[0];

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const payments = await paymentService.getOrderPayments(orderId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available payment methods
 */
export const getAvailablePaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = paymentService.getAvailablePaymentMethods();

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { paymentId } = req.params;
    if (Array.isArray(paymentId)) paymentId = paymentId[0];
    let { reason } = req.body;
    if (Array.isArray(reason)) reason = reason[0];

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const result = await paymentService.refundPayment(paymentId, reason);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

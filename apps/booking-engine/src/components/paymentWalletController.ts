import { Request, Response, NextFunction } from "express";
import paymentFinalizationService from "../services/paymentFinalizationService";
import walletService from "../services/walletService";

/**
 * Finalize payment for a hold order
 */
export const finalizePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { holdOrderId, paymentMethod, paymentDetails } = req.body;

    if (!holdOrderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "Hold order ID and payment method are required",
      });
    }

    const result = await paymentFinalizationService.finalizePayment(
      holdOrderId,
      paymentMethod,
      paymentDetails,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Top up wallet with surcharge
 */
export const topUpWallet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, amount, paymentMethod, paymentDetails } = req.body;

    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "User ID, amount, and payment method are required",
      });
    }

    const result = await walletService.topUpWallet(
      userId,
      amount,
      paymentMethod,
      paymentDetails,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const balance = await walletService.getWalletBalance(userId as string);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const transactions = await walletService.getWalletTransactions(
      userId as string,
      Number(limit),
      Number(offset),
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

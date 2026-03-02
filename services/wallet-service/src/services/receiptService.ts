// src/services/receiptService.ts
// Receipt generation service for wallet transactions
// Generates receipts and sends email notifications for deposits/topups

import { prisma } from "@tripalfa/shared-database";
import { logger } from "../utils/logger.js";

const SERVICE_NAME = "receiptService";

interface ReceiptData {
  receiptNumber: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  transactionType: "deposit" | "withdrawal" | "transfer";
  amount: number;
  currency: string;
  previousBalance: number;
  newBalance: number;
  paymentMethod: string;
  referenceId: string;
  description?: string;
  createdAt: Date;
}

/**
 * Generate a unique receipt number
 */
function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

/**
 * Format date for receipt
 */
function formatDateForReceipt(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get user information for receipt
 */
async function getUserInfo(
  userId: string,
): Promise<{ email: string; name: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return null;
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "Valued Customer";

    return {
      email: user.email,
      name,
    };
  } catch (error) {
    logger.error(
      `[${SERVICE_NAME}] Failed to get user info for ${userId}`,
      error,
    );
    return null;
  }
}

/**
 * Create receipt record in database
 */
async function createReceiptRecord(data: ReceiptData): Promise<void> {
  try {
    await prisma.document.create({
      data: {
        userId: data.userId,
        type: "receipt",
        templateId: null,
        metadata: {
          receiptNumber: data.receiptNumber,
          transactionId: data.transactionId,
          transactionType: data.transactionType,
          amount: data.amount,
          currency: data.currency,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
          paymentMethod: data.paymentMethod,
          referenceId: data.referenceId,
          description: data.description,
          generatedAt: new Date().toISOString(),
        },
        status: "completed",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    logger.info(
      `[${SERVICE_NAME}] Receipt record created: ${data.receiptNumber}`,
    );
  } catch (error) {
    logger.error(`[${SERVICE_NAME}] Failed to create receipt record`, error);
    // Don't throw - receipt email is more important
  }
}

/**
 * Send receipt email to customer via Notification Service API
 */
async function sendReceiptEmail(data: ReceiptData): Promise<boolean> {
  try {
    // Call notification service via HTTP API
    // The notification service exposes endpoints for sending transactional emails
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3009";

    const response = await fetch(
      `${notificationServiceUrl}/api/notifications/wallet/deposit-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: data.userName,
          customerEmail: data.userEmail,
          receiptNumber: data.receiptNumber,
          transactionDate: formatDateForReceipt(data.createdAt),
          depositAmount: data.amount,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          referenceId: data.referenceId,
          description: data.description,
        }),
      },
    );

    if (response.ok) {
      logger.info(
        `[${SERVICE_NAME}] Receipt email sent successfully to ${data.userEmail}`,
      );
      return true;
    } else {
      logger.warn(
        `[${SERVICE_NAME}] Failed to send receipt email, status: ${response.status}`,
      );
      return false;
    }
  } catch (error) {
    // Log but don't fail - the receipt is still valid even if email fails
    logger.warn(
      `[${SERVICE_NAME}] Could not send receipt email (notification service may be unavailable):`,
      error,
    );
    return false;
  }
}

/**
 * Generate and send receipt for a wallet deposit/topup
 */
export async function generateDepositReceipt(
  transactionId: string,
  userId: string,
  amount: number,
  currency: string,
  previousBalance: number,
  newBalance: number,
  paymentMethod: string = "Card Payment",
  referenceId: string = "",
  description?: string,
): Promise<{ success: boolean; receiptNumber?: string; emailSent?: boolean }> {
  const receiptNumber = generateReceiptNumber();

  // Get user info
  const userInfo = await getUserInfo(userId);

  if (!userInfo) {
    logger.error(
      `[${SERVICE_NAME}] Cannot generate receipt - user not found: ${userId}`,
    );
    return { success: false };
  }

  const receiptData: ReceiptData = {
    receiptNumber,
    transactionId,
    userId,
    userEmail: userInfo.email,
    userName: userInfo.name,
    transactionType: "deposit",
    amount,
    currency,
    previousBalance,
    newBalance,
    paymentMethod,
    referenceId: referenceId || transactionId,
    description,
    createdAt: new Date(),
  };

  // Create receipt record in database
  await createReceiptRecord(receiptData);

  // Send email to customer
  const emailSent = await sendReceiptEmail(receiptData);

  logger.info(
    `[${SERVICE_NAME}] Receipt generated for transaction ${transactionId}: ${receiptNumber}, email sent: ${emailSent}`,
  );

  return {
    success: true,
    receiptNumber,
    emailSent,
  };
}

/**
 * Generate and send receipt for a wallet withdrawal
 */
export async function generateWithdrawalReceipt(
  transactionId: string,
  userId: string,
  amount: number,
  currency: string,
  previousBalance: number,
  newBalance: number,
  paymentMethod: string = "Card Payment",
  referenceId: string = "",
  description?: string,
): Promise<{ success: boolean; receiptNumber?: string; emailSent?: boolean }> {
  const receiptNumber = generateReceiptNumber();

  // Get user info
  const userInfo = await getUserInfo(userId);

  if (!userInfo) {
    logger.error(
      `[${SERVICE_NAME}] Cannot generate receipt - user not found: ${userId}`,
    );
    return { success: false };
  }

  const receiptData: ReceiptData = {
    receiptNumber,
    transactionId,
    userId,
    userEmail: userInfo.email,
    userName: userInfo.name,
    transactionType: "withdrawal",
    amount,
    currency,
    previousBalance,
    newBalance,
    paymentMethod,
    referenceId: referenceId || transactionId,
    description,
    createdAt: new Date(),
  };

  // Create receipt record in database
  await createReceiptRecord(receiptData);

  // Note: For withdrawal, we send a confirmation email (similar to deposit receipt)
  const emailSent = await sendReceiptEmail(receiptData);

  logger.info(
    `[${SERVICE_NAME}] Withdrawal receipt generated for transaction ${transactionId}: ${receiptNumber}, email sent: ${emailSent}`,
  );

  return {
    success: true,
    receiptNumber,
    emailSent,
  };
}

export default {
  generateDepositReceipt,
  generateWithdrawalReceipt,
};

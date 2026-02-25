/**
 * Brevo Email Service - Frontend Interface
 * 
 * This module provides email functionality through the API Gateway.
 * Emails are sent via the notification-service which uses Brevo (formerly Sendinblue).
 * 
 * Frontend should NOT directly call Brevo API (security risk).
 * All email operations must go through the backend API.
 */

import { api } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailAttachment {
  contentType: string;
  filename: string;
  base64Content: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: EmailAttachment[];
  from?: {
    email: string;
    name?: string;
  };
  templateId?: string;
  variables?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// EMAIL SERVICE
// ============================================================================

/**
 * Send an email through the API Gateway
 * Routes to notification-service which handles Brevo integration
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const response = await api.post('/api/notifications/email', {
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      attachments: params.attachments,
      from: params.from,
      templateId: params.templateId,
      variables: params.variables,
    });

    return {
      success: true,
      messageId: response.messageId || response.id,
    };
  } catch (error: any) {
    console.error('[Email Service] Failed to send email:', error?.message);
    return {
      success: false,
      error: error?.message || 'Failed to send email',
    };
  }
}

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  bookingData: {
    bookingRef: string;
    customerName: string;
    type: 'flight' | 'hotel';
    details: any;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Booking Confirmation - ${bookingData.bookingRef}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e1b4b;">Booking Confirmed</h2>
        <p>Dear ${bookingData.customerName},</p>
        <p>Your booking <strong>${bookingData.bookingRef}</strong> has been confirmed.</p>
        <p>Thank you for booking with TripAlfa!</p>
      </div>
    `,
    templateId: 'booking-confirmation',
    variables: bookingData,
  });
}

/**
 * Send a hold order notification email
 */
export async function sendHoldOrderEmail(
  to: string,
  holdData: {
    reference: string;
    totalAmount: number;
    currency: string;
    paymentRequiredBy: string;
    type: 'flight' | 'hotel';
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Booking on Hold - ${holdData.reference}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Booking on Hold</h2>
        <p>Your booking <strong>${holdData.reference}</strong> is currently on hold.</p>
        <p><strong>Amount:</strong> ${holdData.currency} ${holdData.totalAmount}</p>
        <p><strong>Payment Required By:</strong> ${holdData.paymentRequiredBy}</p>
        <p>Please complete payment to confirm your booking.</p>
      </div>
    `,
    templateId: 'hold-order-notification',
    variables: holdData,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetData: {
    resetLink: string;
    expiresIn: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Password Reset Request',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e1b4b;">Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetData.resetLink}">${resetData.resetLink}</a></p>
        <p>This link will expire in ${resetData.expiresIn}.</p>
      </div>
    `,
    templateId: 'password-reset',
    variables: resetData,
  });
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  userData: {
    name: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to TripAlfa!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e1b4b;">Welcome to TripAlfa!</h2>
        <p>Dear ${userData.name},</p>
        <p>Thank you for joining TripAlfa. We're excited to help you with your travel needs.</p>
        <p>Start exploring flights and hotels today!</p>
      </div>
    `,
    templateId: 'welcome',
    variables: userData,
  });
}

// Default export for backward compatibility
export default {
  sendEmail,
  sendBookingConfirmationEmail,
  sendHoldOrderEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};

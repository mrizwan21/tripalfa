/**
 * Email Service for Flight Amendment Notifications
 * Powered by Resend
 *
 * Handles:
 * - Amendment approval email sending
 * - Approval reminders
 * - Confirmation emails
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@tripalfa.com';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'TripAlfa';
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || 'support@tripalfa.com';

// Initialize Resend API
const resend = new Resend(RESEND_API_KEY);

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AmendmentNotificationData {
  travelerName: string;
  bookingReference: string;
  currentFlight: {
    airline?: string;
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  };
  proposedFlight: {
    airline: string;
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    price: number;
  };
  financialImpact: {
    adjustmentType: 'refund' | 'charge' | 'none';
    adjustmentAmount: number;
    currentFarePrice: number;
    newFarePrice: number;
    currency: string;
  };
  approvalLink: string;
  approvalToken: string;
  expiresAt: string;
  travelerEmail: string;
}

/**
 * Format date/time for display in email
 */
function formatDateTime(dateString: string, format: string = 'MMM DD, YYYY HH:mm'): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Replace template variables in HTML
 */
function replaceTemplateVariables(html: string, data: AmendmentNotificationData): string {
  let result = html;

  // Simple variable replacement for double braces
  result = result.replace(/\{\{travelerName\}\}/g, data.travelerName);
  result = result.replace(/\{\{bookingReference\}\}/g, data.bookingReference);

  // Current flight
  result = result.replace(/\{\{currentFlight\.airline\}\}/g, data.currentFlight.airline || 'TBD');
  result = result.replace(/\{\{currentFlight\.departure\}\}/g, data.currentFlight.departure);
  result = result.replace(/\{\{currentFlight\.arrival\}\}/g, data.currentFlight.arrival);
  result = result.replace(
    /\{\{currentFlight\.departureTime[\s\S]*?\}\}/g,
    formatDateTime(data.currentFlight.departureTime)
  );
  result = result.replace(
    /\{\{currentFlight\.arrivalTime[\s\S]*?\}\}/g,
    formatDateTime(data.currentFlight.arrivalTime)
  );
  result = result.replace(/\{\{currentFlight\.duration\}\}/g, data.currentFlight.duration);
  result = result.replace(/\{\{currentFlight\.stops\}\}/g, data.currentFlight.stops.toString());

  // Proposed flight
  result = result.replace(/\{\{proposedFlight\.airline\}\}/g, data.proposedFlight.airline);
  result = result.replace(/\{\{proposedFlight\.departure\}\}/g, data.proposedFlight.departure);
  result = result.replace(/\{\{proposedFlight\.arrival\}\}/g, data.proposedFlight.arrival);
  result = result.replace(
    /\{\{proposedFlight\.departureTime[\s\S]*?\}\}/g,
    formatDateTime(data.proposedFlight.departureTime)
  );
  result = result.replace(
    /\{\{proposedFlight\.arrivalTime[\s\S]*?\}\}/g,
    formatDateTime(data.proposedFlight.arrivalTime)
  );
  result = result.replace(/\{\{proposedFlight\.duration\}\}/g, data.proposedFlight.duration);
  result = result.replace(/\{\{proposedFlight\.stops\}\}/g, data.proposedFlight.stops.toString());

  // Financial impact
  result = result.replace(
    /\{\{financialImpact\.adjustmentType\}\}/g,
    data.financialImpact.adjustmentType
  );
  result = result.replace(
    /\{\{financialImpact\.adjustmentAmount\}\}/g,
    data.financialImpact.adjustmentAmount.toFixed(2)
  );
  result = result.replace(
    /\{\{financialImpact\.currentFarePrice\}\}/g,
    data.financialImpact.currentFarePrice.toFixed(2)
  );
  result = result.replace(
    /\{\{financialImpact\.newFarePrice\}\}/g,
    data.financialImpact.newFarePrice.toFixed(2)
  );
  result = result.replace(/\{\{financialImpact\.currency\}\}/g, data.financialImpact.currency);

  // Links and dates
  result = result.replace(/\{\{approvalLink\}\}/g, data.approvalLink);
  result = result.replace(/\{\{approvalToken\}\}/g, data.approvalToken);
  result = result.replace(/\{\{expiresAt[\s\S]*?\}\}/g, formatDateTime(data.expiresAt));

  return result;
}

/**
 * Load email template
 */
function loadEmailTemplate(templateName: string): string {
  try {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Generate amendment approval email HTML
 */
function generateAmendmentApprovalEmail(data: AmendmentNotificationData): string {
  try {
    const template = loadEmailTemplate('flight-amendment-approval');
    return replaceTemplateVariables(template, data);
  } catch (error) {
    console.error('Failed to generate amendment approval email', error);
    throw error;
  }
}

/**
 * Send email via Resend API with retry logic
 */
async function sendEmailViaResend(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
  tags?: string[],
  maxRetries: number = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('[EMAIL_SERVICE] RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured. Set RESEND_API_KEY environment variable.',
    };
  }

  // Retry configuration
  const baseDelay = 1000; // 1 second
  let lastError: string = 'Unknown error';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await resend.emails.send({
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to,
        subject,
        html: htmlContent,
        text:
          textContent ||
          htmlContent
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim(),
        reply_to: RESEND_REPLY_TO,
        headers: tags ? { 'X-Tags': tags.join(',') } : {},
      });

      if (response.error) {
        lastError = response.error.message || 'Failed to send email via Resend';
        throw new Error(lastError);
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      lastError = error.message || 'Failed to send email via Resend';
      console.error(
        `[EMAIL_SERVICE] Resend API error (attempt ${attempt}/${maxRetries}):`,
        lastError
      );

      // Don't retry on configuration errors
      if (lastError.includes('not configured') || lastError.includes('unauthorized')) {
        break;
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[EMAIL_SERVICE] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  console.error(`[EMAIL_SERVICE] Failed to send email after ${maxRetries} attempts:`, lastError);
  return {
    success: false,
    error: `Failed to send email after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Send amendment approval email via Resend
 */
async function sendAmendmentApprovalEmail(data: AmendmentNotificationData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log(`[EMAIL_SERVICE] Sending amendment approval email to ${data.travelerEmail}`);
    console.log(`  Booking: ${data.bookingReference}`);
    console.log(`  Traveler: ${data.travelerName}`);
    console.log(`  Expires: ${data.expiresAt}`);
    console.log(
      `  Financial Impact: ${data.financialImpact.adjustmentType} ${data.financialImpact.currency}${data.financialImpact.adjustmentAmount}`
    );

    const emailHtml = generateAmendmentApprovalEmail(data);
    const subject = `Confirm Your Flight Amendment for ${data.bookingReference}`;

    const result = await sendEmailViaResend(data.travelerEmail, subject, emailHtml, undefined, [
      'amendment',
      'approval',
      data.bookingReference,
    ]);

    if (result.success) {
      console.log(
        `[EMAIL_SERVICE] Email sent successfully via Resend (Message ID: ${result.messageId})`
      );
    } else {
      console.error(`[EMAIL_SERVICE] Failed to send email: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send amendment approval email`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send amendment reminder email via Resend (24 hours before expiry)
 */
async function sendAmendmentReminderEmail(data: AmendmentNotificationData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log(`[EMAIL_SERVICE] Sending amendment reminder email to ${data.travelerEmail}`);
    console.log(`  Booking: ${data.bookingReference}`);
    console.log(`  Expiring: ${data.expiresAt}`);

    const emailHtml = generateAmendmentApprovalEmail(data);
    const subject = `⏰ Reminder: Approve Your Flight Amendment for ${data.bookingReference}`;

    // Add reminder banner to email
    const reminderBanner = `
      <div style="background: rgb(255, 243, 205); border: 1px solid rgb(255, 193, 7); padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; color: rgb(133, 100, 4);">
        ⏰ REMINDER: Your approval link expires in 24 hours. Please approve your amendment before ${formatDateTime(data.expiresAt)}
      </div>
    `;

    const modifiedHtml = emailHtml.replace(
      '<p>Hi {{travelerName}},</p>',
      `<p>Hi {{travelerName}},</p>\n${reminderBanner}`
    );

    const result = await sendEmailViaResend(data.travelerEmail, subject, modifiedHtml, undefined, [
      'amendment',
      'reminder',
      data.bookingReference,
    ]);

    if (result.success) {
      console.log(
        `[EMAIL_SERVICE] Reminder email sent via Resend (Message ID: ${result.messageId})`
      );
    } else {
      console.error(`[EMAIL_SERVICE] Failed to send reminder email: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send reminder email`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send amendment confirmation email via Resend (after finalization)
 */
async function sendAmendmentConfirmationEmail(
  travelerEmail: string,
  bookingReference: string,
  newFlightDetails: {
    airline: string;
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    flightNumber?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`[EMAIL_SERVICE] Sending amendment confirmation email to ${travelerEmail}`);
    console.log(`  Booking: ${bookingReference}`);
    console.log(
      `  New Flight: ${newFlightDetails.airline} ${newFlightDetails.departure} → ${newFlightDetails.arrival}`
    );

    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Flight Amendment Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: rgb(51, 51, 51); max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">✓ Flight Amendment Confirmed</h1>
          </div>
          <div style="background: rgb(249, 249, 249); padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgb(221, 221, 221); border-top: none;">
            <p style="font-size: 16px;">Your flight amendment has been successfully processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgb(238, 238, 238);">
              <h3 style="margin-top: 0; color: rgb(102, 126, 234);">Booking Details</h3>
              <p><strong>Booking Reference:</strong> ${bookingReference}</p>
              <p><strong>Airline:</strong> ${newFlightDetails.airline}</p>
              ${newFlightDetails.flightNumber ? `<p><strong>Flight Number:</strong> ${newFlightDetails.flightNumber}</p>` : ''}
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgb(238, 238, 238);">
              <h3 style="margin-top: 0; color: rgb(102, 126, 234);">Flight Details</h3>
              <p><strong>Departure:</strong> ${newFlightDetails.departure} at ${formatDateTime(newFlightDetails.departureTime)}</p>
              <p><strong>Arrival:</strong> ${newFlightDetails.arrival} at ${formatDateTime(newFlightDetails.arrivalTime)}</p>
            </div>
            
            <p style="text-align: center; color: rgb(102, 102, 102); margin-top: 30px;">
              You will receive your updated itinerary and receipt shortly.<br>
              Thank you for choosing TripAlfa!
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: rgb(102, 102, 102); font-size: 12px;">
            <p>TripAlfa - Your Travel Partner</p>
            <p>Need help? Contact <a href="mailto:${RESEND_REPLY_TO}" style="color: rgb(102, 126, 234);">${RESEND_REPLY_TO}</a></p>
          </div>
        </body>
      </html>
    `;

    const subject = `✓ Flight Amendment Confirmed - ${bookingReference}`;

    const result = await sendEmailViaResend(travelerEmail, subject, confirmationHtml, undefined, [
      'amendment',
      'confirmation',
      bookingReference,
    ]);

    if (result.success) {
      console.log(
        `[EMAIL_SERVICE] Confirmation email sent via Resend (Message ID: ${result.messageId})`
      );
    } else {
      console.error(`[EMAIL_SERVICE] Failed to send confirmation email: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send confirmation email`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Email template registry
 */
const emailTemplates = {
  'flight-amendment-approval': {
    subject: 'Confirm Your Flight Amendment',
    description: 'Email sent to traveler with amendment details and approval link',
    requiredVariables: [
      'travelerName',
      'bookingReference',
      'currentFlight',
      'proposedFlight',
      'financialImpact',
      'approvalLink',
      'expiresAt',
    ],
  },
  'flight-amendment-reminder': {
    subject: 'Reminder: Approve Your Flight Amendment',
    description: 'Reminder email sent 24 hours before approval link expiry',
    requiredVariables: [
      'travelerName',
      'bookingReference',
      'proposedFlight',
      'approvalLink',
      'expiresAt',
    ],
  },
  'flight-amendment-confirmation': {
    subject: 'Flight Amendment Confirmed',
    description: 'Confirmation email sent after traveler approves amendment',
    requiredVariables: ['travelerName', 'bookingReference', 'newFlightDetails', 'financialImpact'],
  },
  'wallet-deposit-receipt': {
    subject: 'Deposit Receipt - {{receiptNumber}}',
    description: 'Email receipt sent to customer after wallet deposit/topup',
    requiredVariables: [
      'customerName',
      'receiptNumber',
      'transactionDate',
      'depositAmount',
      'previousBalance',
      'newBalance',
      'currency',
      'paymentMethod',
      'referenceId',
    ],
  },
};

// ============================================
// WALLET DEPOSIT RECEIPT EMAIL
// ============================================

interface WalletDepositReceiptData {
  customerName: string;
  customerEmail: string;
  receiptNumber: string;
  transactionDate: string;
  depositAmount: number;
  previousBalance: number;
  newBalance: number;
  currency: string;
  paymentMethod: string;
  referenceId: string;
  description?: string;
}

/**
 * Generate wallet deposit receipt email HTML
 */
function generateWalletDepositReceiptEmail(data: WalletDepositReceiptData): string {
  try {
    const template = loadEmailTemplate('wallet-deposit-receipt');
    return replaceWalletDepositVariables(template, data);
  } catch (error) {
    console.error('Failed to generate wallet deposit receipt email', error);
    throw error;
  }
}

/**
 * Replace template variables in wallet deposit receipt HTML
 */
function replaceWalletDepositVariables(html: string, data: WalletDepositReceiptData): string {
  let result = html;

  // Customer info
  result = result.replace(/\{\{customerName\}\}/g, data.customerName || 'Valued Customer');
  result = result.replace(/\{\{receiptNumber\}\}/g, data.receiptNumber);
  result = result.replace(/\{\{transactionDate\}\}/g, data.transactionDate);
  result = result.replace(/\{\{depositAmount\}\}/g, data.depositAmount.toFixed(2));
  result = result.replace(/\{\{previousBalance\}\}/g, data.previousBalance.toFixed(2));
  result = result.replace(/\{\{newBalance\}\}/g, data.newBalance.toFixed(2));
  result = result.replace(/\{\{currency\}\}/g, data.currency);
  result = result.replace(/\{\{paymentMethod\}\}/g, data.paymentMethod || 'Card Payment');
  result = result.replace(/\{\{referenceId\}\}/g, data.referenceId || 'N/A');

  // Handle description conditionally
  if (data.description) {
    result = result.replace(
      /\{\{#if description\}\}[\s\S]*?\{\{\/if\}\}/g,
      `<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgb(238, 238, 238);">
        <h3 style="margin-top: 0; color: rgb(102, 126, 234);">Description</h3>
        <p style="margin: 0;">${data.description}</p>
      </div>`
    );
  } else {
    result = result.replace(/\{\{#if description\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  return result;
}

/**
 * Send wallet deposit receipt email via Resend
 */
export async function sendWalletDepositReceiptEmail(data: WalletDepositReceiptData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log(`[EMAIL_SERVICE] Sending wallet deposit receipt email to ${data.customerEmail}`);
    console.log(`  Receipt: ${data.receiptNumber}`);
    console.log(`  Amount: ${data.currency}${data.depositAmount}`);

    const emailHtml = generateWalletDepositReceiptEmail(data);
    const subject = `💰 Deposit Receipt - ${data.receiptNumber}`;

    const result = await sendEmailViaResend(data.customerEmail, subject, emailHtml, undefined, [
      'wallet',
      'deposit',
      'receipt',
      data.receiptNumber,
    ]);

    if (result.success) {
      console.log(
        `[EMAIL_SERVICE] Wallet deposit receipt sent successfully via Resend (Message ID: ${result.messageId})`
      );
    } else {
      console.error(`[EMAIL_SERVICE] Failed to send wallet deposit receipt: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send wallet deposit receipt email`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default {
  loadEmailTemplate,
  generateAmendmentApprovalEmail,
  sendAmendmentApprovalEmail,
  sendAmendmentReminderEmail,
  sendAmendmentConfirmationEmail,
  generateWalletDepositReceiptEmail,
  sendWalletDepositReceiptEmail,
  emailTemplates,
};

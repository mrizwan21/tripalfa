/**
 * Email Service for Flight Amendment Notifications
 * Handles:
 * - Amendment approval email sending
 * - Approval reminders
 * - Confirmation emails
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    hour12: true
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
  result = result.replace(/\{\{currentFlight\.departureTime[\s\S]*?\}\}/g, formatDateTime(data.currentFlight.departureTime));
  result = result.replace(/\{\{currentFlight\.arrivalTime[\s\S]*?\}\}/g, formatDateTime(data.currentFlight.arrivalTime));
  result = result.replace(/\{\{currentFlight\.duration\}\}/g, data.currentFlight.duration);
  result = result.replace(/\{\{currentFlight\.stops\}\}/g, data.currentFlight.stops.toString());

  // Proposed flight
  result = result.replace(/\{\{proposedFlight\.airline\}\}/g, data.proposedFlight.airline);
  result = result.replace(/\{\{proposedFlight\.departure\}\}/g, data.proposedFlight.departure);
  result = result.replace(/\{\{proposedFlight\.arrival\}\}/g, data.proposedFlight.arrival);
  result = result.replace(/\{\{proposedFlight\.departureTime[\s\S]*?\}\}/g, formatDateTime(data.proposedFlight.departureTime));
  result = result.replace(/\{\{proposedFlight\.arrivalTime[\s\S]*?\}\}/g, formatDateTime(data.proposedFlight.arrivalTime));
  result = result.replace(/\{\{proposedFlight\.duration\}\}/g, data.proposedFlight.duration);
  result = result.replace(/\{\{proposedFlight\.stops\}\}/g, data.proposedFlight.stops.toString());

  // Financial impact
  result = result.replace(/\{\{financialImpact\.adjustmentType\}\}/g, data.financialImpact.adjustmentType);
  result = result.replace(/\{\{financialImpact\.adjustmentAmount\}\}/g, data.financialImpact.adjustmentAmount.toFixed(2));
  result = result.replace(/\{\{financialImpact\.currentFarePrice\}\}/g, data.financialImpact.currentFarePrice.toFixed(2));
  result = result.replace(/\{\{financialImpact\.newFarePrice\}\}/g, data.financialImpact.newFarePrice.toFixed(2));
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
export function loadEmailTemplate(templateName: string): string {
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
export function generateAmendmentApprovalEmail(data: AmendmentNotificationData): string {
  try {
    const template = loadEmailTemplate('flight-amendment-approval');
    return replaceTemplateVariables(template, data);
  } catch (error) {
    console.error('Failed to generate amendment approval email', error);
    throw error;
  }
}

/**
 * Send amendment approval email (mock implementation)
 * In production, integrate with SendGrid, SES, or another email provider
 */
export async function sendAmendmentApprovalEmail(data: AmendmentNotificationData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log(`[EMAIL_SERVICE] Sending amendment approval email to ${data.travelerEmail}`);
    console.log(`  Booking: ${data.bookingReference}`);
    console.log(`  Traveler: ${data.travelerName}`);
    console.log(`  Expires: ${data.expiresAt}`);
    console.log(`  Financial Impact: ${data.financialImpact.adjustmentType} ${data.financialImpact.currency}${data.financialImpact.adjustmentAmount}`);

    const emailHtml = generateAmendmentApprovalEmail(data);

    // Mock implementation - in production, use actual email service
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`[EMAIL_SERVICE] Email queued successfully (Message ID: ${messageId})`);

    // TODO: Replace with actual email service
    // const response = await sendGridOrSES({
    //   to: data.travelerEmail,
    //   subject: `Confirm Your Flight Amendment for ${data.bookingReference}`,
    //   html: emailHtml,
    //   from: process.env.EMAIL_FROM || 'noreply@tripalfa.com',
    //   replyTo: process.env.EMAIL_SUPPORT || 'support@tripalfa.com'
    // });

    return {
      success: true,
      messageId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send amendment approval email`, error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send amendment reminder email (24 hours before expiry)
 */
export async function sendAmendmentReminderEmail(data: AmendmentNotificationData): Promise<{
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
      <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; color: #856404;">
        ⏰ REMINDER: Your approval link expires in 24 hours. Please approve your amendment before {{expiresAt | formatDateTime: 'MMM DD, YYYY HH:mm'}}
      </div>
    `;

    const modifiedHtml = emailHtml.replace('<p>Hi {{travelerName}},</p>', `<p>Hi {{travelerName}},</p>\n${reminderBanner}`);

    // TODO: Replace with actual email service
    const messageId = `msg_reminder_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`[EMAIL_SERVICE] Reminder email queued (Message ID: ${messageId})`);

    return {
      success: true,
      messageId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send reminder email`, error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send amendment confirmation email (after finalization)
 */
export async function sendAmendmentConfirmationEmail(
  travelerEmail: string,
  bookingReference: string,
  newFlightDetails: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`[EMAIL_SERVICE] Sending amendment confirmation email to ${travelerEmail}`);
    console.log(`  Booking: ${bookingReference}`);
    console.log(`  New Flight: ${newFlightDetails.airline} ${newFlightDetails.departure} → ${newFlightDetails.arrival}`);

    // TODO: Create confirmation email template
    const confirmationHtml = `
      <html>
        <body>
          <h1>✓ Flight Amendment Confirmed</h1>
          <p>Your flight amendment has been successfully processed.</p>
          <p><strong>Booking Reference:</strong> ${bookingReference}</p>
          <p><strong>New Flight:</strong> ${newFlightDetails.airline}</p>
          <p><strong>Departure:</strong> ${newFlightDetails.departureTime}</p>
          <p><strong>Arrival:</strong> ${newFlightDetails.arrivalTime}</p>
          <p>Check your email for updated itinerary and receipt.</p>
        </body>
      </html>
    `;

    const messageId = `msg_conf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`[EMAIL_SERVICE] Confirmation email queued (Message ID: ${messageId})`);

    return {
      success: true,
      messageId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL_SERVICE] Failed to send confirmation email`, error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Email template registry
 */
export const emailTemplates = {
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
      'expiresAt'
    ]
  },
  'flight-amendment-reminder': {
    subject: 'Reminder: Approve Your Flight Amendment',
    description: 'Reminder email sent 24 hours before approval link expiry',
    requiredVariables: [
      'travelerName',
      'bookingReference',
      'proposedFlight',
      'approvalLink',
      'expiresAt'
    ]
  },
  'flight-amendment-confirmation': {
    subject: 'Flight Amendment Confirmed',
    description: 'Confirmation email sent after traveler approves amendment',
    requiredVariables: [
      'travelerName',
      'bookingReference',
      'newFlightDetails',
      'financialImpact'
    ]
  }
};

export default {
  loadEmailTemplate,
  generateAmendmentApprovalEmail,
  sendAmendmentApprovalEmail,
  sendAmendmentReminderEmail,
  sendAmendmentConfirmationEmail,
  emailTemplates
};

/**
 * Document Delivery Email Template
 */

import { COLORS } from "../lib/constants/theme";

export interface DocumentDeliveryData {
  customerName: string;
  bookingRef: string;
  requestRef: string;
  viewBookingUrl: string;
}

/**
 * Generate Document Delivery Email HTML
 */
export function generateDocumentDeliveryEmail(
  data: DocumentDeliveryData,
): string {
  return `
    <div style="font-family: 'Inter', sans-serif; padding: 40px; color: ${COLORS.slate[800]};">
      <h1 style="color: ${COLORS.primary}; margin-bottom: 24px;">Your Updated Travel Documents</h1>
      <p>Dear ${data.customerName},</p>
      <p>We have successfully processed your requested changes for booking <strong>${data.bookingRef}</strong> (Request: ${data.requestRef}).</p>
      <p>Attached to this email, you will find your updated travel documents, including your re-issued ticket/voucher and amendment invoice.</p>
      <div style="margin: 32px 0; padding: 24px; background: ${COLORS.slate[50]}; border-radius: 8px;">
        <p style="margin: 0;"><strong>Summary of Documents:</strong></p>
        <ul style="margin: 16px 0 0; padding-left: 20px;">
          <li>Updated Itinerary & E-Ticket/Voucher</li>
          <li>Detailed Amendment Invoice</li>
          <li>Payment Receipt</li>
        </ul>
      </div>
      <p>You can also view your updated booking details online at any time:</p>
      <a href="${data.viewBookingUrl}" style="display: inline-block; padding: 12px 24px; background: ${COLORS.primary}; color: ${COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">View Your Booking</a>
      <p style="margin-top: 32px; font-size: 14px; color: ${COLORS.slate[500]};">If you have any questions, our support team is available 24/7 to assist you.</p>
      <p style="margin-top: 8px; font-size: 14px; color: ${COLORS.slate[500]};">Best regards,<br/>The TripAlfa Team</p>
    </div>
  `;
}

/**
 * Generate Document Delivery Email Text
 */
export function generateDocumentDeliveryText(
  data: DocumentDeliveryData,
): string {
  return `
Dear ${data.customerName},

We have successfully processed your requested changes for booking ${data.bookingRef} (Request: ${data.requestRef}).

Attached to this email, you will find your updated travel documents, including your re-issued ticket/voucher and amendment invoice.

Summary of Documents:
- Updated Itinerary & E-Ticket/Voucher
- Detailed Amendment Invoice
- Payment Receipt

You can also view your updated booking details online at any time:
${data.viewBookingUrl}

If you have any questions, our support team is available 24/7 to assist you.

Best regards,
The TripAlfa Team
  `;
}

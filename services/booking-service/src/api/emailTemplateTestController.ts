/**
 * Email Template Test Controller
 * Provides endpoints for testing different email template styles
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import { sendBookingConfirmationEmail } from '../integrations/bookingConfirmationHandler';
import { getAvailableTemplates } from '../templates/emailTemplateManager';
import type { EmailTemplateStyle } from '../templates/emailTemplateManager';

/**
 * Get available email templates
 */
export async function getAvailableEmailTemplates(req: Request, res: Response): Promise<Response> {
  try {
    const templates = getAvailableTemplates();

    return res.status(200).json({
      success: true,
      data: {
        templates,
        message: 'Available email template styles',
      },
    });
  } catch (error) {
    logger.error('Error getting available templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get available templates',
    });
  }
}

/**
 * Send test booking confirmation email with specified template
 */
export async function sendTestBookingEmail(req: Request, res: Response): Promise<Response> {
  try {
    const { templateStyle, toEmail, testOrderData } = req.body;

    // Default test order data
    const orderData = testOrderData || {
      id: 'ord_test_' + Date.now(),
      booking_reference: 'TEST' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      custom_metadata: {
        customer_id: 'cust_test_' + Date.now(),
      },
      created_at: new Date().toISOString(),
      total_price: '599.99',
      total_currency: 'USD',
      base_amount: '500.00',
      tax_amount: '99.99',
      total_amount: '599.99',
      email: toEmail || 'test@tripalfa.com',
      passengers: [
        {
          id: 'pas_001',
          name: 'John Doe',
          email: toEmail || 'test@tripalfa.com',
          given_name: 'John',
          family_name: 'Doe',
          cabin_class: 'economy',
          seat_designator: '14E',
        },
        {
          id: 'pas_002',
          name: 'Jane Doe',
          given_name: 'Jane',
          family_name: 'Doe',
          cabin_class: 'economy',
          seat_designator: '14F',
        },
      ],
      slices: [
        {
          id: 'slice_001',
          segments: [
            {
              id: 'seg_001',
              operating_flight_number: 'BA086',
              flight_number: 'BA086',
              departing_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T21:35:00Z',
              arriving_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T22:50:00Z',
              origin: {
                iata_code: 'BCN',
                city_name: 'Barcelona',
                icao_code: 'LEBL/T1',
              },
              destination: {
                iata_code: 'LHR',
                city_name: 'London',
                icao_code: 'EGLL/T4',
              },
              airlines: [
                {
                  name: 'British Airways',
                },
              ],
              operating_carrier: {
                name: 'Iberia',
              },
              aircraft: {
                name: 'Boeing 777',
              },
            },
          ],
        },
      ],
    };

    logger.info('Sending test booking confirmation email', {
      templateStyle: templateStyle || 'default',
      toEmail: toEmail || 'test@tripalfa.com',
    });

    // Send email with specified template
    const result = await sendBookingConfirmationEmail(orderData, {
      templateStyle: (templateStyle as EmailTemplateStyle) || 'default',
      sendPlainText: true,
      templateOptions: {
        style: (templateStyle as EmailTemplateStyle) || 'default',
        includeTerminals: true,
        includeOperatingAirline: true,
        includeDuration: true,
        includeSeatInfo: true,
        includePricingBreakdown: true,
      },
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          messageId: result.messageId,
          templateStyle: templateStyle || 'default',
          toEmail: toEmail || 'test@tripalfa.com',
          bookingReference: orderData.booking_reference,
        },
        message: 'Test email sent successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send email',
      });
    }
  } catch (error) {
    logger.error('Error sending test booking email:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default {
  getAvailableEmailTemplates,
  sendTestBookingEmail,
};

/**
 * Email Template Selector & Manager
 * Manages multiple booking confirmation email template variations
 */

import {
  generateBookingConfirmationEmail,
  generateBookingConfirmationText,
  OrderDetails,
} from './bookingConfirmationEmailTemplate';
import {
  generateModernMinimalTemplate,
  generateCompactTemplate,
  generateDetailedTemplate,
} from './bookingConfirmationTemplateVariations';
import logger from '../utils/logger';

export type EmailTemplateStyle = 'default' | 'modern-minimal' | 'compact' | 'detailed';

export interface TemplateOptions {
  style?: EmailTemplateStyle;
  includeTerminals?: boolean;
  includeOperatingAirline?: boolean;
  includeDuration?: boolean;
  includeSeatInfo?: boolean;
  includePricingBreakdown?: boolean;
  trackingPixel?: string;
  unsubscribeLink?: string;
}

/**
 * Generate email HTML based on selected template style
 */
export function generateEmailTemplate(
  order: OrderDetails,
  options: TemplateOptions = {}
): { html: string; text: string } {
  const style = options.style || 'default';

  logger.info('Generating email template', {
    style,
    bookingReference: order.bookingReference,
  });

  try {
    let html: string;

    switch (style) {
      case 'modern-minimal':
        html = generateModernMinimalTemplate(order, options);
        break;

      case 'compact':
        html = generateCompactTemplate(order, options);
        break;

      case 'detailed':
        html = generateDetailedTemplate(order, options);
        break;

      case 'default':
      default:
        html = generateBookingConfirmationEmail(order);
        break;
    }

    // Add tracking pixel if provided
    if (options.trackingPixel) {
      html = html.replace('</body>', `<img src="${options.trackingPixel}" width="1" height="1" alt="" style="display:none;" /></body>`);
    }

    const text = generateBookingConfirmationText(order);

    return { html, text };
  } catch (error) {
    logger.error('Error generating email template', {
      error: error instanceof Error ? error.message : String(error),
      style,
    });

    // Fallback to default template
    return {
      html: generateBookingConfirmationEmail(order),
      text: generateBookingConfirmationText(order),
    };
  }
}

/**
 * Get available template styles
 */
export function getAvailableTemplates(): Array<{ style: EmailTemplateStyle; name: string; description: string }> {
  return [
    {
      style: 'default',
      name: 'Classic',
      description: 'Professional classic design with full details',
    },
    {
      style: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, minimalist design for modern brands',
    },
    {
      style: 'compact',
      name: 'Compact',
      description: 'Space-efficient design for quick scanning',
    },
    {
      style: 'detailed',
      name: 'Detailed',
      description: 'Comprehensive design with all available information',
    },
  ];
}

export default {
  generateEmailTemplate,
  getAvailableTemplates,
};

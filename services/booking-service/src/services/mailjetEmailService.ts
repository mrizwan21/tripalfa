import logger from '../utils/logger';

let mailjet: any = null;

export interface EmailAttachment {
  contentType: string;
  filename: string;
  base64Content: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
  attachments?: EmailAttachment[];
}

interface MailjetResponse {
  body: {
    Messages?: Array<{
      Status: string;
      MessageID: number;
      Errors?: any[];
    }>;
  };
}

/**
 * Lazily initialize Mailjet client
 */
function getMailjetClient(): any {
  if (!mailjet) {
    try {
      const Mailjet = require('node-mailjet').default;
      mailjet = new Mailjet({
        apiKey: process.env.MAILJET_API_KEY || '',
        apiSecret: process.env.MAILJET_API_SECRET || '',
      });
    } catch (error) {
      logger.error('Failed to initialize Mailjet client:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Return a mock client that logs errors instead of crashing
      mailjet = {
        post: () => ({
          request: () => Promise.reject(new Error('Mailjet client failed to initialize')),
        }),
      } as any;
    }
  }
  return mailjet;
}

/**
 * Send transactional email via Mailjet
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_API_SECRET) {
      logger.warn('Mailjet credentials not configured. Email not sent.');
      return { success: false, error: 'Mailjet credentials not configured' };
    }

    const mailjetClient = getMailjetClient();
    const request = mailjetClient.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: options.fromEmail || process.env.MAILJET_FROM_EMAIL || 'noreply@tripalfa.com',
            Name: options.fromName || 'TripAlfa Bookings',
          },
          To: [
            {
              Email: options.to,
            },
          ],
          Subject: options.subject,
          HTMLPart: options.htmlContent,
          TextPart: options.textContent || options.subject,
          Attachments: options.attachments?.map(attr => ({
            ContentType: attr.contentType,
            Filename: attr.filename,
            Base64Content: attr.base64Content
          })),
          Priority: 5,
          TrackOpening: true,
          TrackClick: true,
        },
      ],
    });

    const result = (await request) as MailjetResponse;

    if (result.body?.Messages && result.body.Messages[0].Status === 'success') {
      logger.info(`Email sent successfully to ${options.to}`, {
        messageId: result.body.Messages[0].MessageID,
      });
      return {
        success: true,
        messageId: result.body.Messages[0].MessageID.toString(),
      };
    } else {
      logger.error(`Failed to send email to ${options.to}`, {
        status: result.body?.Messages?.[0]?.Status,
        error: result.body?.Messages?.[0]?.Errors,
      });
      return {
        success: false,
        error: `Email send failed: ${result.body?.Messages?.[0]?.Status}`,
      };
    }
  } catch (error) {
    logger.error('Error sending email via Mailjet', {
      error: error instanceof Error ? error.message : String(error),
      recipientEmail: options.to,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Send batch emails via Mailjet
 */
export async function sendBatchEmails(
  emailList: EmailOptions[]
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const emailOptions of emailList) {
    const result = await sendEmail(emailOptions);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, sent, failed };
}

export default {
  sendEmail,
  sendBatchEmails,
};

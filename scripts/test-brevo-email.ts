#!/usr/bin/env tsx
/**
 * Test script for Brevo email integration
 * Usage: pnpm exec tsx scripts/test-brevo-email.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

async function testBrevoIntegration() {
  console.log('🧪 Testing Brevo Email Integration\n');
  console.log('=' .repeat(50));

  // Check environment variables
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@tripalfa.com';
  const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'TripAlfa';
  const BREVO_REPLY_TO = process.env.BREVO_REPLY_TO || 'support@tripalfa.com';

  console.log('\n📋 Configuration Check:');
  console.log(`  BREVO_API_KEY: ${BREVO_API_KEY ? '✅ Set (' + BREVO_API_KEY.substring(0, 20) + '...)' : '❌ Not Set'}`);
  console.log(`  BREVO_FROM_EMAIL: ${BREVO_FROM_EMAIL}`);
  console.log(`  BREVO_FROM_NAME: ${BREVO_FROM_NAME}`);
  console.log(`  BREVO_REPLY_TO: ${BREVO_REPLY_TO}`);

  if (!BREVO_API_KEY) {
    console.error('\n❌ Error: BREVO_API_KEY is not set in environment variables');
    process.exit(1);
  }

  // Initialize Brevo API
  const brevoApi = new TransactionalEmailsApi();
  brevoApi.setApiKey(0, BREVO_API_KEY);

  // Test email recipient - replace with your test email
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  console.log(`\n📧 Sending test email to: ${testEmail}`);
  console.log('   (Set TEST_EMAIL env var to change recipient)\n');

  const sendSmtpEmail: SendSmtpEmail = {
    sender: {
      email: BREVO_FROM_EMAIL,
      name: BREVO_FROM_NAME,
    },
    to: [{ email: testEmail }],
    subject: '🧪 TripAlfa Brevo Integration Test',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>TripAlfa Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">✅ Brevo Integration Successful!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #667eea;">Email Configuration Working</h2>
            <p>Congratulations! Your Brevo email integration is working correctly.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
              <h3 style="margin-top: 0; color: #667eea;">Configuration Details</h3>
              <p><strong>From:</strong> ${BREVO_FROM_NAME} <${BREVO_FROM_EMAIL}></p>
              <p><strong>Reply-To:</strong> ${BREVO_REPLY_TO}</p>
              <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 30px;">
              This is a test email from TripAlfa notification service.<br>
              Powered by Brevo (formerly Sendinblue)
            </p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Brevo Integration Successful!

Your Brevo email integration is working correctly.

Configuration Details:
- From: ${BREVO_FROM_NAME} <${BREVO_FROM_EMAIL}>
- Reply-To: ${BREVO_REPLY_TO}
- Test Time: ${new Date().toISOString()}

This is a test email from TripAlfa notification service.
Powered by Brevo (formerly Sendinblue)
    `,
    replyTo: {
      email: BREVO_REPLY_TO,
      name: 'TripAlfa Support',
    },
    tags: ['test', 'integration', 'tripalfa'],
  };

  try {
    console.log('📤 Sending email via Brevo API...');
    const response = await brevoApi.sendTransacEmail(sendSmtpEmail);
    
    console.log('\n✅ Email sent successfully!');
    console.log(`   Message ID: ${response.messageId || 'N/A'}`);
    console.log('\n' + '='.repeat(50));
    console.log('\n🎉 Brevo integration test PASSED!');
    console.log(`   Check your inbox at: ${testEmail}`);
    
    return { success: true, messageId: response.messageId };
  } catch (error: any) {
    console.error('\n❌ Failed to send email:');
    console.error(`   Error: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Body: ${JSON.stringify(error.response.body, null, 2)}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n💥 Brevo integration test FAILED!');
    
    return { success: false, error: error.message };
  }
}

// Run the test
testBrevoIntegration()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
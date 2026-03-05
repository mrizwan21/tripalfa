#!/usr/bin/env tsx
/**
 * Test script for Resend email integration
 * Usage: pnpm exec tsx scripts/test-brevo-email.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

import { Resend } from "resend";

async function testResendIntegration() {
  console.log("🧪 Testing Resend Email Integration\n");
  console.log("=".repeat(50));

  // Check environment variables
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || "noreply@tripalfa.com";
  const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || "TripAlfa";
  const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "support@tripalfa.com";

  console.log("\n📋 Configuration Check:");
  console.log(
    `  RESEND_API_KEY: ${RESEND_API_KEY ? "✅ Set (" + RESEND_API_KEY.substring(0, 20) + "...)" : "❌ Not Set"}`,
  );
  console.log(`  RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}`);
  console.log(`  RESEND_FROM_NAME: ${RESEND_FROM_NAME}`);
  console.log(`  RESEND_REPLY_TO: ${RESEND_REPLY_TO}`);

  if (!RESEND_API_KEY) {
    console.error(
      "\n❌ Error: RESEND_API_KEY is not set in environment variables",
    );
    process.exit(1);
  }

  // Initialize Resend API
  const resend = new Resend(RESEND_API_KEY);

  // Test email recipient - replace with your test email
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  console.log(`\n📧 Sending test email to: ${testEmail}`);
  console.log("   (Set TEST_EMAIL env var to change recipient)\n");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>TripAlfa Email Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: rgb(51, 51, 51); max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">✅ Resend Integration Successful!</h1>
        </div>
        <div style="background: rgb(249, 249, 249); padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgb(221, 221, 221); border-top: none;">
          <h2 style="color: rgb(102, 126, 234);">Email Configuration Working</h2>
          <p>Congratulations! Your Resend email integration is working correctly.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgb(238, 238, 238);">
            <h3 style="margin-top: 0; color: rgb(102, 126, 234);">Configuration Details</h3>
            <p><strong>From:</strong> ${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}></p>
            <p><strong>Reply-To:</strong> ${RESEND_REPLY_TO}</p>
            <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
          </div>
          
          <p style="text-align: center; color: rgb(102, 102, 102); margin-top: 30px;">
            This is a test email from TripAlfa notification service.<br>
            Powered by Resend
          </p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Resend Integration Successful!

Your Resend email integration is working correctly.

Configuration Details:
- From: ${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>
- Reply-To: ${RESEND_REPLY_TO}
- Test Time: ${new Date().toISOString()}

This is a test email from TripAlfa notification service.
Powered by Resend
  `;

  try {
    console.log("📤 Sending email via Resend API...");
    const response = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: testEmail,
      subject: "🧪 TripAlfa Resend Integration Test",
      html: htmlContent,
      text: textContent,
      replyTo: RESEND_REPLY_TO,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    console.log("\n✅ Email sent successfully!");
    console.log(`   Message ID: ${response.data?.id || "N/A"}`);
    console.log("\n" + "=".repeat(50));
    console.log("\n🎉 Resend integration test PASSED!");
    console.log(`   Check your inbox at: ${testEmail}`);

    return { success: true, messageId: response.data?.id };
  } catch (error: any) {
    console.error("\n❌ Failed to send email:");
    console.error(`   Error: ${error.message}`);

    console.log("\n" + "=".repeat(50));
    console.log("\n💥 Resend integration test FAILED!");

    return { success: false, error: error.message };
  }
}

// Run the test
testResendIntegration()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });

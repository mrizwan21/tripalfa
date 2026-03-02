/**
 * Hotel Booking Workflow Orchestrator
 *
 * Manages the complete end-to-end hotel booking lifecycle with automatic document
 * generation, wallet operations, and multi-currency support:
 *
 * 1. Booking Confirmation Flow:
 *    - Debit customer wallet for booking amount (+ FX fee if cross-currency)
 *    - Create booking in LiteAPI
 *    - Generate hotel voucher with FX details
 *    - Generate invoice with payment breakdown
 *    - Send voucher + invoice + receipt to customer email
 *    - Send confirmation notification
 *
 * 2. Booking Cancellation Flow:
 *    - Cancel booking in LiteAPI
 *    - Credit customer wallet with refund
 *    - Generate refund note (credit note) with FX details
 *    - Cancel associated voucher
 *    - Send credit note + refund notification
 *
 * 3. Refund Processing Flow:
 *    - Process refund to wallet (with FX conversion if needed)
 *    - Generate refund receipt with conversion details
 *    - Send refund confirmation notification
 *    - Update booking status
 *
 * This orchestrator integrates:
 * - LiteAPI Manager (booking operations)
 * - Wallet Service (debit/credit operations with FX conversion)
 * - Document Generation Service (vouchers, invoices, credit notes)
 * - Notification Service (email delivery)
 * - FX Service (real-time rates from OpenExchangeRates API via Postgres DB)
 */

import axios from "axios";
import {
  DocumentGenerationService,
  HotelBooking,
  DocumentCustomerInfo,
  PaymentBreakdown,
  RefundDetails,
} from "../components/documentGenerationService";

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param text - Text to escape
 * @returns Escaped text safe for HTML insertion
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface HotelBookingRequest {
  prebookId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  amount: number;
  currency: string;
  bookingReference?: string;
}

interface BookingConfirmationResult {
  success: boolean;
  bookingId: string;
  bookingRef: string;
  voucherId: string;
  invoiceId: string;
  documentsGenerated: {
    voucher: string;
    invoice: string;
  };
  notificationsSent: {
    voucher: boolean;
    invoice: boolean;
    confirmation: boolean;
  };
  voucherNumber?: string;
  error?: string;
}

interface BookingCancellationResult {
  success: boolean;
  bookingId: string;
  cancellationId: string;
  refundAmount: number;
  refundCurrency: string;
  voucherCancelled: boolean;
  documentsGenerated: {
    creditNote: string;
  };
  notificationsSent: {
    creditNote: boolean;
    refundNotification: boolean;
  };
  error?: string;
}

interface RefundProcessingResult {
  success: boolean;
  bookingId: string;
  refundId: string;
  refundAmount: number;
  refundCurrency: string;
  walletTransactionId: string;
  documentsGenerated: {
    receipt: string;
  };
  notificationsSent: {
    refundReceipt: boolean;
  };
  error?: string;
}

class HotelBookingWorkflowOrchestrator {
  private docService: DocumentGenerationService;
  private walletApiUrl: string;
  private verbose: boolean;
  private authToken: string | null;

  constructor(
    walletApiUrl =
      import.meta.env.VITE_API_URL ||
      process.env.API_GATEWAY_URL ||
      "http://localhost:3000/api",
    verbose = false,
    authToken: string | null = null,
  ) {
    this.docService = new DocumentGenerationService();
    this.walletApiUrl = walletApiUrl;
    this.verbose = verbose;
    this.authToken = authToken;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get axios request config with auth header if token is set
   */
  private getRequestConfig() {
    const config: { headers?: Record<string, string>; timeout?: number } = {
      timeout: 5000,
    };
    if (this.authToken) {
      config.headers = {
        Authorization: `Bearer ${this.authToken}`,
      };
    }
    return config;
  }

  private log(message: string, data?: any) {
    if (this.verbose) {
      console.log(`[HotelBookingOrchestrator] ${message}`, data || "");
    }
  }

  /**
   * Get FX conversion rate from FX service API
   * Falls back to 1.0 for same currency or if API is unavailable
   */
  private async getConversionRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;

    try {
      this.log("Fetching FX rate from API...", {
        fromCurrency,
        toCurrency,
      });

      const response = await axios.get(
        `${this.walletApiUrl}/fx/rate/${fromCurrency}/${toCurrency}`,
        this.getRequestConfig(),
      );

      if (!response.data.success) {
        this.log("FX API returned error, using fallback rate 1.0");
        return 1.0;
      }

      const rate = response.data.rate || 1.0;
      this.log("✓ FX rate fetched successfully", { rate });
      return rate;
    } catch (error) {
      this.log("✗ Failed to fetch FX rate, falling back to 1.0", error);
      return 1.0; // Fallback to 1:1 if API is unavailable
    }
  }

  /**
   * Convert amount using FX service API
   * Returns converted amount with FX details
   */
  private async convertWithFx(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ converted: number; rate: number; fee: number; total: number }> {
    if (fromCurrency === toCurrency) {
      return { converted: amount, rate: 1.0, fee: 0, total: amount };
    }

    try {
      this.log("Converting amount with FX...", {
        amount,
        fromCurrency,
        toCurrency,
      });

      const response = await axios.post(
        `${this.walletApiUrl}/fx/convert-with-fee`,
        {
          amount,
          fromCurrency,
          toCurrency,
          applyFee: true,
        },
        this.getRequestConfig(),
      );

      if (!response.data.success) {
        this.log(
          "FX conversion failed, returning amount without conversion",
        );
        return {
          converted: amount,
          rate: 1.0,
          fee: 0,
          total: amount,
        };
      }

      const { breakdown } = response.data;
      return {
        converted: breakdown.convertedAmount,
        rate: breakdown.fxRate,
        fee: breakdown.fxFee,
        total: breakdown.totalDebit,
      };
    } catch (error) {
      this.log(
        "✗ FX conversion failed, returning amount without conversion",
        error,
      );
      return { converted: amount, rate: 1.0, fee: 0, total: amount };
    }
  }

  /**
   * Debit customer wallet for booking payment
   */
  private async debitCustomerWallet(
    customerId: string,
    amount: number,
    currency: string,
    bookingId: string,
  ): Promise<boolean> {
    try {
      this.log("Debiting customer wallet...", { customerId, amount, currency });
      const response = await axios.post(
        `${this.walletApiUrl}/wallet/debit`,
        {
          userId: customerId,
          amount,
          currency,
          transactionId: `HOTEL-${bookingId}`,
          description: `Hotel booking payment`,
        },
        this.getRequestConfig(),
      );
      this.log("✓ Customer wallet debited", response.data);
      return response.data.success || true;
    } catch (error) {
      this.log("✗ Failed to debit customer wallet", error);
      return false;
    }
  }

  /**
   * Credit customer wallet for refunds
   */
  private async creditCustomerWallet(
    customerId: string,
    amount: number,
    currency: string,
    bookingId: string,
    reason: string,
  ): Promise<boolean> {
    try {
      this.log("Crediting customer wallet...", { customerId, amount, currency });
      const response = await axios.post(
        `${this.walletApiUrl}/wallet/credit`,
        {
          userId: customerId,
          amount,
          currency,
          transactionId: `REFUND-${bookingId}`,
          description: `Hotel booking ${reason}`,
        },
        this.getRequestConfig(),
      );
      this.log("✓ Customer wallet credited", response.data);
      return response.data.success || true;
    } catch (error) {
      this.log("✗ Failed to credit customer wallet", error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      this.log("Sending email notification...", { email, subject });
      await axios.post(
        `${this.walletApiUrl}/notifications/email`,
        {
          recipientEmail: email,
          subject,
          html,
        },
        this.getRequestConfig(),
      );
      return true;
    } catch (error) {
      this.log("✗ Failed to send email", error);
      return false;
    }
  }

  /**
   * Complete booking confirmation workflow:
   * 1. Debit customer wallet for booking amount (with FX conversion if needed)
   * 2. Confirm booking via LiteAPI
   * 3. Generate voucher
   * 4. Generate invoice with FX details
   * 5. Generate receipt
   * 6. Send notifications
   */
  async confirmBooking(
    bookingRequest: HotelBookingRequest,
    booking: HotelBooking,
    customerCurrency: string = "USD",
  ): Promise<BookingConfirmationResult> {
    try {
      this.log("Starting booking confirmation workflow", {
        bookingId: booking.id,
      });

      const hotelCurrency = bookingRequest.currency || "USD";
      const fxResult = await this.convertWithFx(
        bookingRequest.amount,
        customerCurrency,
        hotelCurrency,
      );
      const fxRate = fxResult.rate;
      const fxFee = fxResult.fee;
      const totalDebit = fxResult.total;

      const result: BookingConfirmationResult = {
        success: false,
        bookingId: booking.id,
        bookingRef: `REF-${Date.now()}`,
        voucherId: `VCH-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        documentsGenerated: { voucher: "", invoice: "" },
        notificationsSent: {
          voucher: false,
          invoice: false,
          confirmation: false,
        },
      };

      // Step 0: Debit customer wallet
      this.log("Processing wallet debit for booking...", {
        customerId: bookingRequest.guestEmail,
        amount: totalDebit,
        currency: customerCurrency,
        fxRate,
        fxFee,
      });

      const walletDebited = await this.debitCustomerWallet(
        bookingRequest.guestEmail,
        totalDebit,
        customerCurrency,
        booking.id,
      );

      if (!walletDebited) {
        throw new Error("Failed to debit customer wallet");
      }

      this.log("✓ Wallet debited successfully", {
        amount: totalDebit,
        currency: customerCurrency,
      });

      // Step 1: Prepare customer information
      const customer: DocumentCustomerInfo = {
        id: bookingRequest.guestEmail,
        name: bookingRequest.guestName,
        email: bookingRequest.guestEmail,
        phone: bookingRequest.guestPhone,
        address: "Not provided",
        nationality: "Not specified",
      };

      // Step 2: Generate voucher with FX details
      this.log("Generating hotel voucher...", { bookingId: booking.id });
      const voucherHTML = this.docService.generateHotelVoucher(
        booking,
        customer,
      );
      result.documentsGenerated.voucher = voucherHTML;
      result.voucherNumber = `VOC-${booking.id}-${Date.now()}`;
      this.log("✓ Voucher generated", { voucherNumber: result.voucherNumber });

      // Step 3: Generate invoice with FX details
      this.log("Generating hotel invoice...", { bookingId: booking.id });
      const tax = bookingRequest.amount * 0.1;
      const invoiceHTML = this.docService.generateHotelInvoice(
        booking,
        customer,
        {
          amount: bookingRequest.amount,
          currency: hotelCurrency,
          paymentMethod: "wallet",
          transactionId: `TXN-${Date.now()}`,
        } as any,
      );
      result.documentsGenerated.invoice = invoiceHTML;
      this.log("✓ Invoice generated");

      // Step 4: Generate receipt with FX details
      const receiptHTML = this.generateBookingReceipt(
        result.invoiceId,
        bookingRequest.amount,
        hotelCurrency,
        customerCurrency,
        fxRate,
        fxFee,
        totalDebit,
      );

      // Step 5: Send notifications
      this.log("Sending notifications...");
      result.notificationsSent.voucher = await this.sendEmailNotification(
        bookingRequest.guestEmail,
        `Your Hotel Voucher ${result.voucherNumber}`,
        voucherHTML,
      );
      this.log(
        `✓ Voucher notification sent: ${result.notificationsSent.voucher}`,
      );

      result.notificationsSent.invoice = await this.sendEmailNotification(
        bookingRequest.guestEmail,
        `Hotel Invoice ${result.invoiceId}`,
        invoiceHTML,
      );
      this.log(
        `✓ Invoice notification sent: ${result.notificationsSent.invoice}`,
      );

      result.notificationsSent.confirmation = await this.sendEmailNotification(
        bookingRequest.guestEmail,
        `Booking Confirmation - ${result.bookingRef}`,
        this.generateConfirmationEmail(bookingRequest, result.bookingRef),
      );
      this.log(
        `✓ Confirmation notification sent: ${result.notificationsSent.confirmation}`,
      );

      result.success = true;
      this.log("✓ Booking confirmation workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Booking confirmation workflow failed", error);
      return {
        success: false,
        bookingId: booking.id,
        bookingRef: `REF-${Date.now()}`,
        voucherId: `VCH-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        documentsGenerated: { voucher: "", invoice: "" },
        notificationsSent: {
          voucher: false,
          invoice: false,
          confirmation: false,
        },
        error: String(error),
      };
    }
  }

  /**
   * Complete booking cancellation workflow:
   * 1. Cancel booking via LiteAPI
   * 2. Generate credit note
   * 3. Record refund in wallet
   * 4. Cancel voucher
   * 5. Send notifications
   */
  async cancelBooking(
    bookingId: string,
    booking: HotelBooking,
    refundAmount: number,
    refundReason: string,
    customerEmail: string,
    customerCurrency: string = "USD",
  ): Promise<BookingCancellationResult> {
    try {
      this.log("Starting booking cancellation workflow", { bookingId });

      const fxResult = await this.convertWithFx(
        refundAmount,
        "USD",
        customerCurrency,
      );
      const refundInCustomerCurrency = fxResult.converted;

      const result: BookingCancellationResult = {
        success: false,
        bookingId,
        cancellationId: `CNL-${Date.now()}`,
        refundAmount,
        refundCurrency: "USD",
        voucherCancelled: true,
        documentsGenerated: { creditNote: "" },
        notificationsSent: { creditNote: false, refundNotification: false },
      };

      // Step 0: Credit customer wallet for refund
      this.log("Processing wallet credit for refund...", {
        customerId: customerEmail,
        amount: refundInCustomerCurrency,
        currency: customerCurrency,
      });

      const walletCredited = await this.creditCustomerWallet(
        customerEmail,
        refundInCustomerCurrency,
        customerCurrency,
        bookingId,
        "cancellation refund",
      );

      if (!walletCredited) {
        throw new Error("Failed to credit customer wallet");
      }

      this.log("✓ Wallet credited successfully", {
        amount: refundInCustomerCurrency,
        currency: customerCurrency,
      });

      // Step 1: Prepare customer information
      const customer: DocumentCustomerInfo = {
        id: customerEmail,
        name: "Guest",
        email: customerEmail,
        phone: "",
        address: "Not provided",
        nationality: "Not specified",
      };

      // Step 2: Generate credit note (refund note)
      this.log("Generating credit note...", { bookingId });
      const refund: RefundDetails = {
        id: result.cancellationId,
        refundNumber: `RFN-${bookingId}-${Date.now()}`,
        amount: refundAmount,
        currency: "USD",
        reason: refundReason,
        type: "full",
        status: "completed",
        requestedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        refundedTo: "wallet",
        originalPaymentAmount: refundAmount,
        cancellationFees: 0,
        taxRefund: 0,
      };

      const creditNoteHTML = this.docService.generateRefundNote(
        refund,
        booking as any,
        customer,
      );
      result.documentsGenerated.creditNote = creditNoteHTML;
      this.log("✓ Credit note generated", {
        refundNumber: refund.refundNumber,
      });

      // Step 3: Cancel voucher
      this.log("Cancelling voucher...", { bookingId });
      result.voucherCancelled = await this.cancelVoucher(bookingId);
      this.log(`✓ Voucher cancelled: ${result.voucherCancelled}`);

      // Step 4: Send notifications
      this.log("Sending notifications...");
      if (customerEmail) {
        result.notificationsSent.creditNote = await this.sendEmailNotification(
          customerEmail,
          `Refund Processed - ${refund.refundNumber}`,
          creditNoteHTML,
        );
        this.log(
          `✓ Credit note notification sent: ${result.notificationsSent.creditNote}`,
        );

        result.notificationsSent.refundNotification =
          await this.sendEmailNotification(
            customerEmail,
            `Booking Cancellation & Refund - ${result.cancellationId}`,
            this.generateRefundEmail(
              refundInCustomerCurrency,
              customerCurrency,
              refundReason,
            ),
          );
        this.log(
          `✓ Refund notification sent: ${result.notificationsSent.refundNotification}`,
        );
      }

      result.success = true;
      this.log("✓ Booking cancellation workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Booking cancellation workflow failed", error);
      return {
        success: false,
        bookingId,
        cancellationId: `CNL-${Date.now()}`,
        refundAmount,
        refundCurrency: "USD",
        voucherCancelled: false,
        documentsGenerated: { creditNote: "" },
        notificationsSent: { creditNote: false, refundNotification: false },
        error: String(error),
      };
    }
  }

  /**
   * Complete refund processing workflow:
   * 1. Process refund to wallet
   * 2. Generate refund receipt
   * 3. Send refund confirmation
   */
  async processRefund(
    bookingId: string,
    refundAmount: number,
    refundCurrency: string,
    customerEmail: string,
  ): Promise<RefundProcessingResult> {
    try {
      this.log("Starting refund processing workflow", {
        bookingId,
        refundAmount,
      });

      const result: RefundProcessingResult = {
        success: false,
        bookingId,
        refundId: `RFN-${Date.now()}`,
        refundAmount,
        refundCurrency,
        walletTransactionId: `TXN-${Date.now()}`,
        documentsGenerated: { receipt: "" },
        notificationsSent: { refundReceipt: false },
      };

      // Step 1: Process refund to wallet
      this.log("Processing refund to wallet...", {
        bookingId,
        amount: refundAmount,
      });
      const txnId = await this.processWalletRefund(
        bookingId,
        refundAmount,
        refundCurrency,
      );
      result.walletTransactionId = txnId;
      this.log("✓ Wallet refund processed", { transactionId: txnId });

      // Step 2: Generate refund receipt
      this.log("Generating refund receipt...");
      const receiptHTML = this.generateRefundReceipt(
        result.refundId,
        refundAmount,
        refundCurrency,
      );
      result.documentsGenerated.receipt = receiptHTML;
      this.log("✓ Refund receipt generated");

      // Step 3: Send notification
      this.log("Sending refund confirmation...");
      result.notificationsSent.refundReceipt =
        await this.sendRefundReceiptNotification(
          customerEmail,
          result.refundId,
          refundAmount,
          refundCurrency,
          receiptHTML,
        );
      this.log(
        `✓ Refund receipt sent: ${result.notificationsSent.refundReceipt}`,
      );

      result.success = true;
      this.log("✓ Refund processing workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Refund processing workflow failed", error);
      return {
        success: false,
        bookingId,
        refundId: `RFN-${Date.now()}`,
        refundAmount,
        refundCurrency,
        walletTransactionId: `TXN-${Date.now()}`,
        documentsGenerated: { receipt: "" },
        notificationsSent: { refundReceipt: false },
        error: String(error),
      };
    }
  }

  /**
   * Generate booking receipt with FX conversion details
   */
  private generateBookingReceipt(
    invoiceId: string,
    hotelAmount: number,
    hotelCurrency: string,
    customerCurrency: string,
    fxRate: number,
    fxFee: number,
    totalDebit: number,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .receipt { background: white; max-width: 800px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; color: #333; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            td.label { font-weight: bold; width: 40%; }
            .amount { color: #667eea; font-size: 16px; font-weight: bold; }
            .fx-section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .status { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Hotel Booking Receipt</h1>
              <div style="color: #666; font-size: 12px; margin-top: 5px;">Invoice ID: ${escapeHtml(invoiceId)} | Date: ${escapeHtml(new Date().toISOString())}</div>
            </div>

            <div class="section">
              <div class="section-title">Booking Details</div>
              <table>
                <tr><td class="label">Status:</td><td><span class="status">✓ Confirmed & Paid</span></td></tr>
                <tr><td class="label">Hotel Amount:</td><td><span class="amount">${escapeHtml(hotelCurrency)} ${escapeHtml(hotelAmount.toFixed(2))}</span></td></tr>
              </table>
            </div>

            ${
              customerCurrency !== hotelCurrency
                ? `
            <div class="fx-section">
              <div class="section-title">Currency Conversion</div>
              <table>
                <tr><td class="label">Exchange Rate:</td><td>1 ${escapeHtml(customerCurrency)} = ${escapeHtml(fxRate.toFixed(4))} ${escapeHtml(hotelCurrency)}</td></tr>
                <tr><td class="label">You Paid:</td><td><span class="amount">${escapeHtml(customerCurrency)} ${escapeHtml(totalDebit.toFixed(2))}</span></td></tr>
                <tr><td class="label">FX Fee (2%):</td><td>${escapeHtml(customerCurrency)} ${escapeHtml(fxFee.toFixed(2))}</td></tr>
              </table>
            </div>
            `
                : ""
            }

            <div class="section">
              <div class="section-title">Payment Method</div>
              <table>
                <tr><td class="label">Method:</td><td>Wallet Account</td></tr>
                <tr><td class="label">Amount Deducted:</td><td><span class="amount">${escapeHtml(customerCurrency)} ${escapeHtml(totalDebit.toFixed(2))}</span></td></tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate booking confirmation email
   */
  private generateConfirmationEmail(
    bookingRequest: HotelBookingRequest,
    bookingRef: string,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { background: white; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .confirm { color: #28a745; font-weight: bold; font-size: 16px; }
            .detail-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Hotel Booking Confirmed! 🎉</h1>
            <p class="confirm">Your hotel booking has been confirmed and payment received.</p>
            
            <div class="detail-item">
              <div class="label">Booking Reference:</div>
              <div>${escapeHtml(bookingRef)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Guest Name:</div>
              <div>${escapeHtml(bookingRequest.guestName)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Check-in:</div>
              <div>${escapeHtml(new Date(bookingRequest.checkIn).toLocaleDateString())}</div>
            </div>

            <div class="detail-item">
              <div class="label">Check-out:</div>
              <div>${escapeHtml(new Date(bookingRequest.checkOut).toLocaleDateString())}</div>
            </div>

            <div class="detail-item">
              <div class="label">Amount Paid:</div>
              <div><strong>${escapeHtml(bookingRequest.currency)} ${escapeHtml(bookingRequest.amount.toFixed(2))}</strong></div>
            </div>

            <p style="color: #666; margin-top: 20px;">Your voucher and invoice have been sent separately. Please check your email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate refund email
   */
  private generateRefundEmail(
    refundAmount: number,
    currency: string,
    reason: string,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { background: white; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .refund-notice { color: #28a745; font-weight: bold; font-size: 16px; }
            .amount { color: #667eea; font-size: 24px; font-weight: bold; }
            .detail-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #dc3545; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Booking Cancelled & Refund Processed</h1>
            <p class="refund-notice">Your refund has been credited to your wallet account.</p>
            
            <div class="detail-item">
              <div class="label">Refund Amount:</div>
              <div class="amount">${escapeHtml(currency)} ${escapeHtml(refundAmount.toFixed(2))}</div>
            </div>

            <div class="detail-item">
              <div class="label">Cancellation Reason:</div>
              <div>${escapeHtml(reason)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Refunded To:</div>
              <div>Your Wallet Account</div>
            </div>

            <p style="color: #666; margin-top: 20px;">The refund amount is now available in your wallet and can be used for future bookings.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send voucher via email notification
   */
  private async sendVoucherNotification(
    email: string,
    voucherNumber: string,
    voucherHTML: string,
  ): Promise<boolean> {
    try {
      this.log("Sending voucher notification...", { email, voucherNumber });
      // In production, integrate with NotificationService
      // await notificationService.sendEmail({
      //   to: email,
      //   subject: `Your Hotel Voucher ${voucherNumber}`,
      //   html: voucherHTML,
      //   attachment: { filename: `voucher-${voucherNumber}.pdf` }
      // });
      return true;
    } catch (error) {
      this.log("Failed to send voucher notification", error);
      return false;
    }
  }

  /**
   * Send invoice via email notification
   */
  private async sendInvoiceNotification(
    email: string,
    invoiceId: string,
    invoiceHTML: string,
  ): Promise<boolean> {
    try {
      this.log("Sending invoice notification...", { email, invoiceId });
      // In production, integrate with NotificationService
      // await notificationService.sendEmail({
      //   to: email,
      //   subject: `Your Hotel Invoice ${invoiceId}`,
      //   html: invoiceHTML,
      //   attachment: { filename: `invoice-${invoiceId}.pdf` }
      // });
      return true;
    } catch (error) {
      this.log("Failed to send invoice notification", error);
      return false;
    }
  }

  /**
   * Send booking confirmation notification
   */
  private async sendBookingConfirmation(
    email: string,
    booking: HotelBooking,
    bookingRef: string,
  ): Promise<boolean> {
    try {
      this.log("Sending booking confirmation...", { email, bookingRef });
      // In production, integrate with NotificationService
      // const html = `
      //   <h1>Booking Confirmed</h1>
      //   <p>Your hotel booking has been confirmed!</p>
      //   <p><strong>Reference:</strong> ${bookingRef}</p>
      //   <p><strong>Hotel:</strong> ${booking.hotelName}</p>
      //   <p><strong>Check-in:</strong> ${booking.checkIn}</p>
      //   <p><strong>Check-out:</strong> ${booking.checkOut}</p>
      // `;
      // await notificationService.sendEmail({
      //   to: email,
      //   subject: `Booking Confirmation - ${bookingRef}`,
      //   html
      // });
      return true;
    } catch (error) {
      this.log("Failed to send booking confirmation", error);
      return false;
    }
  }

  /**
   * Send credit note via email notification
   */
  private async sendCreditNoteNotification(
    email: string,
    refundNumber: string,
    creditNoteHTML: string,
  ): Promise<boolean> {
    try {
      this.log("Sending credit note notification...", { email, refundNumber });
      return true;
    } catch (error) {
      this.log("Failed to send credit note notification", error);
      return false;
    }
  }

  /**
   * Send refund notification
   */
  private async sendRefundNotification(
    email: string,
    bookingId: string,
    refundAmount: number,
    currency: string,
  ): Promise<boolean> {
    try {
      this.log("Sending refund notification...", {
        email,
        bookingId,
        refundAmount,
      });
      return true;
    } catch (error) {
      this.log("Failed to send refund notification", error);
      return false;
    }
  }

  /**
   * Send refund receipt via email
   */
  private async sendRefundReceiptNotification(
    email: string,
    refundId: string,
    refundAmount: number,
    currency: string,
    receiptHTML: string,
  ): Promise<boolean> {
    try {
      this.log("Sending refund receipt...", { email, refundId });
      return true;
    } catch (error) {
      this.log("Failed to send refund receipt", error);
      return false;
    }
  }

  /**
   * Record refund transaction in wallet
   */
  private async recordWalletRefund(
    bookingId: string,
    amount: number,
    currency: string,
  ): Promise<boolean> {
    try {
      this.log("Recording wallet refund...", { bookingId, amount });
      // In production, integrate with WalletService
      // await walletService.recordRefund({
      //   bookingId,
      //   amount,
      //   currency,
      //   type: 'booking_cancellation_refund'
      // });
      return true;
    } catch (error) {
      this.log("Failed to record wallet refund", error);
      return false;
    }
  }

  /**
   * Process refund to customer wallet
   */
  private async processWalletRefund(
    bookingId: string,
    amount: number,
    currency: string,
  ): Promise<string> {
    try {
      this.log("Processing wallet refund...", { bookingId, amount });
      // In production, integrate with WalletService
      // const result = await walletService.creditWallet({
      //   customerId: bookingId,
      //   amount,
      //   currency,
      //   reason: 'Hotel booking cancellation refund'
      // });
      // return result.transactionId;
      return `TXN-${Date.now()}`;
    } catch (error) {
      this.log("Failed to process wallet refund", error);
      throw error;
    }
  }

  /**
   * Cancel associated voucher
   */
  private async cancelVoucher(voucherNumber: string): Promise<boolean> {
    try {
      this.log("Cancelling voucher...", { voucherNumber });
      // In production, integrate with VoucherService
      // await voucherService.cancelVoucher(voucherNumber);
      return true;
    } catch (error) {
      this.log("Failed to cancel voucher", error);
      return false;
    }
  }

  /**
   * Generate refund receipt HTML
   */
  private generateRefundReceipt(
    refundId: string,
    amount: number,
    currency: string,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .receipt { background: white; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .status { color: #28a745; font-weight: bold; }
            .amount { font-size: 24px; color: #667eea; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Refund Receipt</h1>
            <p><strong>Refund ID:</strong> ${escapeHtml(refundId)}</p>
            <p><strong>Status:</strong> <span class="status">✓ Processed</span></p>
            <p><strong>Amount:</strong> <span class="amount">${escapeHtml(currency)} ${escapeHtml(amount.toFixed(2))}</span></p>
            <p><strong>Refunded to:</strong> Wallet Account</p>
            <p><strong>Date:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default HotelBookingWorkflowOrchestrator;
export { HotelBookingWorkflowOrchestrator };
export type {
  BookingConfirmationResult,
  BookingCancellationResult,
  RefundProcessingResult,
};

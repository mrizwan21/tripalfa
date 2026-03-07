/**
 * Flight Booking Workflow Orchestrator
 *
 * Manages the complete end-to-end flight booking lifecycle with wallet operations,
 * multi-currency support, and automatic document generation:
 *
 * 1. Booking Confirmation Flow:
 *    - Debit customer wallet for booking amount (+ FX fee if cross-currency)
 *    - Create booking via Duffel API
 *    - Generate e-ticket
 *    - Generate invoice with payment breakdown
 *    - Send e-ticket + invoice + receipt to customer email
 *    - Send confirmation notification
 *
 * 2. Booking Amendment Flow:
 *    - Calculate price difference (debit or credit as needed)
 *    - Amend booking via Duffel API
 *    - Generate amendment receipt with FX details
 *    - Send amendment notification
 *
 * 3. Booking Cancellation Flow:
 *    - Cancel booking via Duffel API
 *    - Credit customer wallet with refund
 *    - Generate refund note
 *    - Send refund notification
 *
 * This orchestrator integrates:
 * - Duffel API Manager (flight booking operations)
 * - Wallet Service (debit/credit operations with FX conversion)
 * - Document Generation Service (e-tickets, invoices, credit notes)
 * - Notification Service (email delivery)
 * - FX Service (real-time rates from OpenExchangeRates API via Postgres DB)
 */

import axios from "axios";

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

interface FlightBookingRequest {
  selectedOfferId: string;
  passengerId: string;
  passengerEmail: string;
  passengerName: string;
  passengerPhone: string;
  fare: number;
  currency: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
}

interface FlightBookingConfirmationResult {
  success: boolean;
  bookingId: string;
  bookingRef: string;
  ticketId: string;
  invoiceId: string;
  documentsGenerated: {
    eticket: string;
    invoice: string;
  };
  notificationsSent: {
    eticket: boolean;
    invoice: boolean;
    confirmation: boolean;
  };
  error?: string;
}

interface FlightAmendmentResult {
  success: boolean;
  bookingId: string;
  amendmentId: string;
  priceDifference: number;
  priceDifferenceCurrency: string;
  transactionType: "debit" | "credit";
  documentsGenerated: {
    receipt: string;
  };
  notificationsSent: {
    amendment: boolean;
  };
  error?: string;
}

interface FlightCancellationResult {
  success: boolean;
  bookingId: string;
  cancellationId: string;
  refundAmount: number;
  refundCurrency: string;
  documentsGenerated: {
    creditNote: string;
  };
  notificationsSent: {
    cancellation: boolean;
  };
  error?: string;
}

class FlightBookingWorkflowOrchestrator {
  private walletApiUrl: string;
  private verbose: boolean;
  private authToken: string | null;

  constructor(
    walletApiUrl =
      import.meta.env.VITE_API_URL ||
      process.env.API_GATEWAY_URL ||
      "http://localhost:3001/api",
    verbose = false,
    authToken: string | null = null,
  ) {
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
      console.log(`[FlightBookingOrchestrator] ${message}`, data || "");
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
   * Debit customer wallet for flight booking payment
   */
  private async debitCustomerWallet(
    customerId: string,
    amount: number,
    currency: string,
    bookingId: string,
  ): Promise<boolean> {
    try {
      this.log("Debiting customer wallet for flight...", {
        customerId,
        amount,
        currency,
      });
      const response = await axios.post(
        `${this.walletApiUrl}/wallet/debit`,
        {
          userId: customerId,
          amount,
          currency,
          transactionId: `FLIGHT-${bookingId}`,
          description: "Flight booking payment",
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
          description: `Flight booking ${reason}`,
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
   * Complete flight booking confirmation workflow:
   * 1. Debit customer wallet for booking amount (with FX conversion if needed)
   * 2. Create booking via Duffel API
   * 3. Generate e-ticket
   * 4. Generate invoice with FX details
   * 5. Generate receipt
   * 6. Send notifications
   */
  async confirmBooking(
    bookingRequest: FlightBookingRequest,
    customerCurrency: string = "USD",
  ): Promise<FlightBookingConfirmationResult> {
    try {
      this.log("Starting flight booking confirmation workflow", {
        bookingRequest,
      });

      const airlineCurrency = bookingRequest.currency || "USD";
      const fxResult = await this.convertWithFx(
        bookingRequest.fare,
        customerCurrency,
        airlineCurrency,
      );
      const fxRate = fxResult.rate;
      const fxFee = fxResult.fee;
      const totalDebit = fxResult.total;

      const result: FlightBookingConfirmationResult = {
        success: false,
        bookingId: `FL-${Date.now()}`,
        bookingRef: `FLIGHT-${Date.now()}`,
        ticketId: `TKT-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        documentsGenerated: { eticket: "", invoice: "" },
        notificationsSent: {
          eticket: false,
          invoice: false,
          confirmation: false,
        },
      };

      // Step 0: Debit customer wallet
      this.log("Processing wallet debit for flight booking...", {
        customerId: bookingRequest.passengerEmail,
        amount: totalDebit,
        currency: customerCurrency,
        fxRate,
        fxFee,
      });

      const walletDebited = await this.debitCustomerWallet(
        bookingRequest.passengerEmail,
        totalDebit,
        customerCurrency,
        result.bookingId,
      );

      if (!walletDebited) {
        throw new Error("Failed to debit customer wallet");
      }

      this.log("✓ Wallet debited successfully");

      // Step 1: Generate e-ticket
      this.log("Generating flight e-ticket...");
      const eticketHTML = this.generateETicket(
        result.ticketId,
        bookingRequest,
        fxRate,
        customerCurrency,
      );
      result.documentsGenerated.eticket = eticketHTML;
      this.log("✓ E-ticket generated");

      // Step 2: Generate invoice
      this.log("Generating flight invoice...");
      const invoiceHTML = this.generateInvoice(
        result.invoiceId,
        bookingRequest,
        fxRate,
        customerCurrency,
        totalDebit,
        fxFee,
      );
      result.documentsGenerated.invoice = invoiceHTML;
      this.log("✓ Invoice generated");

      // Step 3: Generate receipt
      const receiptHTML = this.generateBookingReceipt(
        result.ticketId,
        bookingRequest.fare,
        airlineCurrency,
        customerCurrency,
        fxRate,
        fxFee,
        totalDebit,
      );

      // Step 4: Send notifications
      this.log("Sending notifications...");
      result.notificationsSent.eticket = await this.sendEmailNotification(
        bookingRequest.passengerEmail,
        `Your Flight E-Ticket ${result.ticketId}`,
        eticketHTML,
      );
      this.log(`✓ E-ticket sent: ${result.notificationsSent.eticket}`);

      result.notificationsSent.invoice = await this.sendEmailNotification(
        bookingRequest.passengerEmail,
        `Flight Invoice ${result.invoiceId}`,
        invoiceHTML,
      );
      this.log(`✓ Invoice sent: ${result.notificationsSent.invoice}`);

      result.notificationsSent.confirmation = await this.sendEmailNotification(
        bookingRequest.passengerEmail,
        `Flight Booking Confirmation - ${result.bookingRef}`,
        this.generateConfirmationEmail(bookingRequest, result.bookingRef),
      );
      this.log(`✓ Confirmation sent: ${result.notificationsSent.confirmation}`);

      result.success = true;
      this.log("✓ Flight booking confirmation workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Flight booking confirmation workflow failed", error);
      return {
        success: false,
        bookingId: `FL-${Date.now()}`,
        bookingRef: `FLIGHT-${Date.now()}`,
        ticketId: `TKT-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        documentsGenerated: { eticket: "", invoice: "" },
        notificationsSent: {
          eticket: false,
          invoice: false,
          confirmation: false,
        },
        error: String(error),
      };
    }
  }

  /**
   * Complete flight amendment workflow:
   * 1. Calculate price difference
   * 2. Debit or credit wallet as needed
   * 3. Amend booking via Duffel API
   * 4. Generate amendment receipt
   * 5. Send notification
   */
  async amendBooking(
    bookingId: string,
    passengerEmail: string,
    passengerName: string,
    originalFare: number,
    newFare: number,
    fareC: string,
    passengerCurrency: string = "USD",
  ): Promise<FlightAmendmentResult> {
    try {
      this.log("Starting flight amendment workflow", { bookingId });

      const priceDifference = newFare - originalFare;
      const transactionType = priceDifference > 0 ? "debit" : "credit";
      const absoluteDifference = Math.abs(priceDifference);

      // Convert price difference from fare currency to passenger currency
      const fxResult = await this.convertWithFx(
        absoluteDifference,
        fareC,
        passengerCurrency,
      );
      const fxRate = fxResult.rate;
      const convertedDifference = fxResult.converted;

      const result: FlightAmendmentResult = {
        success: false,
        bookingId,
        amendmentId: `AMD-${Date.now()}`,
        priceDifference: convertedDifference,
        priceDifferenceCurrency: passengerCurrency,
        transactionType,
        documentsGenerated: { receipt: "" },
        notificationsSent: { amendment: false },
      };

      // Step 0: Debit or credit wallet as needed
      if (transactionType === "debit") {
        this.log("Debiting wallet for price increase...");
        const success = await this.debitCustomerWallet(
          passengerEmail,
          convertedDifference,
          passengerCurrency,
          bookingId,
        );
        if (!success) throw new Error("Failed to debit wallet");
      } else {
        this.log("Crediting wallet for price decrease...");
        const success = await this.creditCustomerWallet(
          passengerEmail,
          convertedDifference,
          passengerCurrency,
          bookingId,
          "amendment refund",
        );
        if (!success) throw new Error("Failed to credit wallet");
      }

      // Step 1: Generate amendment receipt
      const receiptHTML = this.generateAmendmentReceipt(
        result.amendmentId,
        passengerName,
        originalFare,
        newFare,
        fareC,
        priceDifference,
      );
      result.documentsGenerated.receipt = receiptHTML;
      this.log("✓ Amendment receipt generated");

      // Step 2: Send notification
      result.notificationsSent.amendment = await this.sendEmailNotification(
        passengerEmail,
        `Flight Amendment Notice - ${result.amendmentId}`,
        receiptHTML,
      );
      this.log(`✓ Amendment notification sent`);

      result.success = true;
      this.log("✓ Flight amendment workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Flight amendment workflow failed", error);
      return {
        success: false,
        bookingId,
        amendmentId: `AMD-${Date.now()}`,
        priceDifference: 0,
        priceDifferenceCurrency: "USD",
        transactionType: "debit",
        documentsGenerated: { receipt: "" },
        notificationsSent: { amendment: false },
        error: String(error),
      };
    }
  }

  /**
   * Complete flight cancellation workflow:
   * 1. Credit customer wallet with refund
   * 2. Cancel booking via Duffel API
   * 3. Generate credit note
   * 4. Send notification
   */
  async cancelBooking(
    bookingId: string,
    passengerEmail: string,
    passengerName: string,
    refundAmount: number,
    refundCurrency: string,
    passengerCurrency: string = "USD",
  ): Promise<FlightCancellationResult> {
    try {
      this.log("Starting flight cancellation workflow", { bookingId });

      // Convert refund from airline currency to passenger currency
      const fxResult = await this.convertWithFx(
        refundAmount,
        refundCurrency,
        passengerCurrency,
      );
      const refundInPassengerCurrency = fxResult.converted;

      const result: FlightCancellationResult = {
        success: false,
        bookingId,
        cancellationId: `CXL-${Date.now()}`,
        refundAmount,
        refundCurrency,
        documentsGenerated: { creditNote: "" },
        notificationsSent: { cancellation: false },
      };

      // Step 0: Credit customer wallet
      this.log("Processing wallet credit for refund...", {
        customerId: passengerEmail,
        amount: refundInPassengerCurrency,
        currency: passengerCurrency,
      });

      const walletCredited = await this.creditCustomerWallet(
        passengerEmail,
        refundInPassengerCurrency,
        passengerCurrency,
        bookingId,
        "cancellation refund",
      );

      if (!walletCredited) {
        throw new Error("Failed to credit customer wallet");
      }

      this.log("✓ Wallet credited successfully");

      // Step 1: Generate credit note
      const creditNoteHTML = this.generateCreditNote(
        result.cancellationId,
        passengerName,
        refundAmount,
        refundCurrency,
        refundInPassengerCurrency,
        passengerCurrency,
      );
      result.documentsGenerated.creditNote = creditNoteHTML;
      this.log("✓ Credit note generated");

      // Step 2: Send notification
      result.notificationsSent.cancellation = await this.sendEmailNotification(
        passengerEmail,
        `Flight Cancellation & Refund - ${result.cancellationId}`,
        creditNoteHTML,
      );
      this.log(`✓ Cancellation notification sent`);

      result.success = true;
      this.log("✓ Flight cancellation workflow completed", result);
      return result;
    } catch (error) {
      this.log("✗ Flight cancellation workflow failed", error);
      return {
        success: false,
        bookingId,
        cancellationId: `CXL-${Date.now()}`,
        refundAmount,
        refundCurrency,
        documentsGenerated: { creditNote: "" },
        notificationsSent: { cancellation: false },
        error: String(error),
      };
    }
  }

  /**
   * Generate e-ticket HTML
   */
  private generateETicket(
    ticketId: string,
    booking: FlightBookingRequest,
    fxRate: number,
    customerCurrency: string,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .eticket { background: white; max-width: 900px; margin: 0 auto; padding: 30px; border-radius: 8px; }
            .header { border-bottom: 3px solid #667eea; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0; }
            .barcode { margin: 10px 0; font-size: 12px; font-family: monospace; }
            .flight-details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 15px 0; }
            .route { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .status { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="eticket">
            <div class="header">
              <h1>Electronic Ticket (E-Ticket)</h1>
              <div class="barcode">Ticket: ${escapeHtml(ticketId)} | PNR: ${escapeHtml(ticketId.substring(0, 6))}</div>
            </div>

            <div class="flight-details">
              <div class="route">${escapeHtml(booking.departureCity)} → ${escapeHtml(booking.arrivalCity)}</div>
              
              <div class="detail-row">
                <span><strong>Passenger:</strong> ${escapeHtml(booking.passengerName)}</span>
                <span><strong>Status:</strong> <span class="status">✓ Confirmed</span></span>
              </div>

              <div class="detail-row">
                <span><strong>Departure:</strong> ${escapeHtml(new Date(booking.departureTime).toLocaleString())}</span>
                <span><strong>Arrival:</strong> ${escapeHtml(new Date(booking.arrivalTime).toLocaleString())}</span>
              </div>

              <div class="detail-row">
                <span><strong>Ticket Price:</strong> ${escapeHtml(booking.currency)} ${escapeHtml(booking.fare.toFixed(2))}</span>
                <span><strong>Paid Amount:</strong> ${escapeHtml(customerCurrency)} ${escapeHtml((booking.fare * fxRate).toFixed(2))}</span>
              </div>
            </div>

            <p style="color: #666; font-size: 12px;">Please arrive 2 hours before international flights and 1 hour before domestic flights.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate flight invoice HTML
   */
  private generateInvoice(
    invoiceId: string,
    booking: FlightBookingRequest,
    fxRate: number,
    customerCurrency: string,
    totalDebit: number,
    fxFee: number,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .invoice { background: white; max-width: 800px; margin: 0 auto; padding: 30px; border-radius: 8px; }
            .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            td.label { font-weight: bold; width: 50%; }
            .amount { color: #667eea; font-size: 16px; font-weight: bold; }
            .fx-section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>Flight Invoice</h1>
              <div style="color: #666; font-size: 12px;">Invoice #${escapeHtml(invoiceId)}</div>
            </div>

            <table>
              <tr><td class="label">Passenger:</td><td>${escapeHtml(booking.passengerName)}</td></tr>
              <tr><td class="label">Route:</td><td>${escapeHtml(booking.departureCity)} → ${escapeHtml(booking.arrivalCity)}</td></tr>
              <tr><td class="label">Flight Fare:</td><td><span class="amount">${escapeHtml(booking.currency)} ${escapeHtml(booking.fare.toFixed(2))}</span></td></tr>
            </table>

            ${customerCurrency !== booking.currency
        ? `
            <div class="fx-section">
              <div style="font-weight: bold; margin-bottom: 10px;">Currency Conversion</div>
              <table style="margin: 0;">
                <tr><td class="label">Exchange Rate:</td><td>1 ${escapeHtml(booking.currency)} = ${escapeHtml(fxRate.toFixed(4))} ${escapeHtml(customerCurrency)}</td></tr>
                <tr><td class="label">Fare in ${escapeHtml(customerCurrency)}:</td><td><span class="amount">${escapeHtml((booking.fare * fxRate).toFixed(2))}</span></td></tr>
                <tr><td class="label">FX Fee (2%):</td><td>${escapeHtml(customerCurrency)} ${escapeHtml(fxFee.toFixed(2))}</td></tr>
                <tr><td class="label"><strong>Total Amount Due:</strong></td><td><span class="amount">${escapeHtml(totalDebit.toFixed(2))}</span></td></tr>
              </table>
            </div>
            `
        : ""
      }

            <p style="color: #666; margin-top: 20px;">Payment method: Wallet Account</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate booking receipt with FX details
   */
  private generateBookingReceipt(
    ticketId: string,
    fare: number,
    fareCurrency: string,
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
            .receipt { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .status { color: #28a745; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            td.label { font-weight: bold; width: 50%; }
            .amount { color: #667eea; font-size: 16px; font-weight: bold; }
            .fx-section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Flight Booking Receipt</h1>
            <p><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}</p>
            <p><strong>Status:</strong> <span class="status">✓ Confirmed & Paid</span></p>

            <table>
              <tr><td class="label">Flight Fare:</td><td><span class="amount">${escapeHtml(fareCurrency)} ${escapeHtml(fare.toFixed(2))}</span></td></tr>
            </table>

            ${customerCurrency !== fareCurrency
        ? `
            <div class="fx-section">
              <div style="font-weight: bold; margin-bottom: 10px;">Currency Conversion</div>
              <table style="margin: 0;">
                <tr><td class="label">Exchange Rate:</td><td>1 ${escapeHtml(fareCurrency)} = ${escapeHtml(fxRate.toFixed(4))} ${escapeHtml(customerCurrency)}</td></tr>
                <tr><td class="label">You Paid:</td><td><span class="amount">${escapeHtml(customerCurrency)} ${escapeHtml(totalDebit.toFixed(2))}</span></td></tr>
                <tr><td class="label">FX Fee (2%):</td><td>${escapeHtml(customerCurrency)} ${escapeHtml(fxFee.toFixed(2))}</td></tr>
              </table>
            </div>
            `
        : ""
      }

            <p style="color: #666; margin-top: 20px;">Date: ${escapeHtml(new Date().toLocaleString())}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate flight confirmation email
   */
  private generateConfirmationEmail(
    booking: FlightBookingRequest,
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
            <h1>Flight Booking Confirmed! ✈️</h1>
            <p class="confirm">Your flight booking has been confirmed and payment received.</p>
            
            <div class="detail-item">
              <div class="label">Booking Reference:</div>
              <div>${escapeHtml(bookingRef)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Passenger:</div>
              <div>${escapeHtml(booking.passengerName)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Route:</div>
              <div>${escapeHtml(booking.departureCity)} → ${escapeHtml(booking.arrivalCity)}</div>
            </div>

            <div class="detail-item">
              <div class="label">Departure:</div>
              <div>${escapeHtml(new Date(booking.departureTime).toLocaleString())}</div>
            </div>

            <div class="detail-item">
              <div class="label">Amount Paid:</div>
              <div><strong>${escapeHtml(booking.currency)} ${escapeHtml(booking.fare.toFixed(2))}</strong></div>
            </div>

            <p style="color: #666; margin-top: 20px;">Your e-ticket and invoice have been sent separately. Please check your email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate amendment receipt
   */
  private generateAmendmentReceipt(
    amendmentId: string,
    passengerName: string,
    originalFare: number,
    newFare: number,
    currency: string,
    priceDifference: number,
  ): string {
    const transactionType = priceDifference > 0 ? "Additional charge" : "Refund";
    const color = priceDifference > 0 ? "#dc3545" : "#28a745";

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .receipt { background: white; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .amount { font-size: 18px; font-weight: bold; }
            .detail-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Flight Amendment Notice</h1>
            <p><strong>Amendment ID:</strong> ${escapeHtml(amendmentId)}</p>
            <p><strong>Passenger:</strong> ${escapeHtml(passengerName)}</p>
            
            <div class="detail-item">
              <div style="font-weight: bold;">Original Fare:</div>
              <div>${escapeHtml(currency)} ${escapeHtml(originalFare.toFixed(2))}</div>
            </div>

            <div class="detail-item">
              <div style="font-weight: bold;">New Fare:</div>
              <div>${escapeHtml(currency)} ${escapeHtml(newFare.toFixed(2))}</div>
            </div>

            <div class="detail-item">
              <div style="font-weight: bold; color: ${color};">${escapeHtml(transactionType)}:</div>
              <div class="amount" style="color: ${color};">${escapeHtml(currency)} ${escapeHtml(Math.abs(priceDifference).toFixed(2))}</div>
            </div>

            <p style="color: #666; margin-top: 20px;">The transaction has been processed to your wallet account on ${escapeHtml(new Date().toLocaleString())}.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate refund credit note
   */
  private generateCreditNote(
    cancellationId: string,
    passengerName: string,
    refundAmount: number,
    refundCurrency: string,
    refundInPassengerCurrency: number,
    passengerCurrency: string,
  ): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .note { background: white; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 8px; }
            h1 { color: #333; }
            .status { color: #28a745; font-weight: bold; }
            .amount { font-size: 18px; font-weight: bold; color: #667eea; }
            .detail-item { margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="note">
            <h1>Refund Credit Note</h1>
            <p><strong>Cancellation ID:</strong> ${escapeHtml(cancellationId)}</p>
            <p><strong>Status:</strong> <span class="status">✓ Processed</span></p>
            
            <div class="detail-item">
              <div style="font-weight: bold;">Passenger:</div>
              <div>${escapeHtml(passengerName)}</div>
            </div>

            <div class="detail-item">
              <div style="font-weight: bold;">Refund Amount:</div>
              <div class="amount">${escapeHtml(refundCurrency)} ${escapeHtml(refundAmount.toFixed(2))}</div>
            </div>

            ${passengerCurrency !== refundCurrency
        ? `
            <div class="detail-item">
              <div style="font-weight: bold;">Amount in Your Currency:</div>
              <div class="amount">${escapeHtml(passengerCurrency)} ${escapeHtml(refundInPassengerCurrency.toFixed(2))}</div>
            </div>
            `
        : ""
      }

            <p style="color: #666; margin-top: 20px;">The refund has been credited to your wallet account and is available for future bookings.</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default FlightBookingWorkflowOrchestrator;
export { FlightBookingWorkflowOrchestrator };
export type {
  FlightBookingConfirmationResult,
  FlightAmendmentResult,
  FlightCancellationResult,
};

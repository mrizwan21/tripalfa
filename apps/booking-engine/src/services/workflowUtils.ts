import axios from 'axios';

export function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

export class WalletService {
  private walletApiUrl: string;
  private authToken: string | null;

  constructor(walletApiUrl: string = 'http://localhost:3001/api', authToken: string | null = null) {
    this.walletApiUrl = walletApiUrl;
    this.authToken = authToken;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private getRequestConfig(): RequestConfig {
    const config: RequestConfig = { timeout: 5000 };
    if (this.authToken) {
      config.headers = { Authorization: `Bearer ${this.authToken}` };
    }
    return config;
  }

  async getConversionRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;
    try {
      const response = await axios.get(
        `${this.walletApiUrl}/fx/rate/${fromCurrency}/${toCurrency}`,
        this.getRequestConfig()
      );
      return response.data.success ? response.data.rate || 1.0 : 1.0;
    } catch {
      return 1.0;
    }
  }

  async convertWithFx(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ converted: number; rate: number; fee: number; total: number }> {
    if (fromCurrency === toCurrency) {
      return { converted: amount, rate: 1.0, fee: 0, total: amount };
    }
    try {
      const response = await axios.post(
        `${this.walletApiUrl}/fx/convert-with-fee`,
        { amount, fromCurrency, toCurrency, applyFee: true },
        this.getRequestConfig()
      );
      if (!response.data.success) {
        return { converted: amount, rate: 1.0, fee: 0, total: amount };
      }
      const { breakdown } = response.data;
      return {
        converted: breakdown.convertedAmount,
        rate: breakdown.fxRate,
        fee: breakdown.fxFee,
        total: breakdown.totalDebit,
      };
    } catch {
      return { converted: amount, rate: 1.0, fee: 0, total: amount };
    }
  }

  async debitWallet(
    userId: string,
    amount: number,
    currency: string,
    transactionId: string,
    description: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.walletApiUrl}/wallet/debit`,
        { userId, amount, currency, transactionId, description },
        this.getRequestConfig()
      );
      return response.data.success || true;
    } catch {
      return false;
    }
  }

  async creditWallet(
    userId: string,
    amount: number,
    currency: string,
    transactionId: string,
    description: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.walletApiUrl}/wallet/credit`,
        { userId, amount, currency, transactionId, description },
        this.getRequestConfig()
      );
      return response.data.success || true;
    } catch {
      return false;
    }
  }

  async sendEmail(email: string, subject: string, html: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.walletApiUrl}/notifications/email`,
        { recipientEmail: email, subject, html },
        this.getRequestConfig()
      );
      return true;
    } catch {
      return false;
    }
  }
}

export function generateBookingReceipt(
  invoiceId: string,
  amount: number,
  currency: string,
  customerCurrency: string,
  fxRate: number,
  fxFee: number,
  totalDebit: number,
  type: 'hotel' | 'flight'
): string {
  const typeLabel = type === 'hotel' ? 'Hotel Booking' : 'Flight Booking';
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .receipt { background: white; max-width: 800px; margin: 0 auto; padding: 30px; border-radius: 8px; }
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
            <h1>${typeLabel} Receipt</h1>
            <div style="color: #666; font-size: 12px; margin-top: 5px;">Invoice ID: ${escapeHtml(invoiceId)} | Date: ${escapeHtml(new Date().toISOString())}</div>
          </div>
          <div class="section">
            <div class="section-title">Booking Details</div>
            <table>
              <tr><td class="label">Status:</td><td><span class="status">✓ Confirmed & Paid</span></td></tr>
              <tr><td class="label">Amount:</td><td><span class="amount">${escapeHtml(currency)} ${escapeHtml(amount.toFixed(2))}</span></td></tr>
            </table>
          </div>
          ${
            customerCurrency !== currency
              ? `
          <div class="fx-section">
            <div class="section-title">Currency Conversion</div>
            <table>
              <tr><td class="label">Exchange Rate:</td><td>1 ${escapeHtml(currency)} = ${escapeHtml(fxRate.toFixed(4))} ${escapeHtml(customerCurrency)}</td></tr>
              <tr><td class="label">You Paid:</td><td><span class="amount">${escapeHtml(customerCurrency)} ${escapeHtml(totalDebit.toFixed(2))}</span></td></tr>
              <tr><td class="label">FX Fee (2%):</td><td>${escapeHtml(customerCurrency)} ${escapeHtml(fxFee.toFixed(2))}</td></tr>
            </table>
          </div>`
              : ''
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

export function generateRefundReceipt(refundId: string, amount: number, currency: string): string {
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

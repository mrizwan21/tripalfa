import { Booking, BookingDocument } from '../types/enhancedBooking.js';
import { v4 as uuidv4 } from 'uuid';

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice';
  template: string;
  variables: string[];
  isActive: boolean;
}

interface DocumentGenerationRequest {
  booking: Booking;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice';
  amount?: number;
  reason?: string;
  ticketDetails?: any;
}

export class DocumentGenerationService {
  private templates: DocumentTemplate[] = [];

  constructor() {
    this.initializeTemplates();
  }

  // Generate invoice
  async generateInvoice(booking: Booking): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('invoice', {
      booking,
      currentDate: new Date(),
      invoiceNumber: this.generateInvoiceNumber(booking.bookingRef)
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'invoice',
      fileName: `Invoice_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate receipt
  async generateReceipt(booking: Booking): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('receipt', {
      booking,
      currentDate: new Date(),
      receiptNumber: this.generateReceiptNumber(booking.bookingRef)
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'receipt',
      fileName: `Receipt_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate credit note
  async generateCreditNote(booking: Booking, amount: number, reason: string): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('credit_note', {
      booking,
      currentDate: new Date(),
      creditNoteNumber: this.generateCreditNoteNumber(booking.bookingRef),
      amount,
      reason
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'credit_note',
      fileName: `Credit_Note_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate e-ticket
  async generateETicket(booking: Booking): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('e_ticket', {
      booking,
      currentDate: new Date(),
      ticketNumber: this.generateTicketNumber(booking.confirmationNumber || booking.bookingRef)
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'e_ticket',
      fileName: `E-Ticket_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate hotel voucher
  async generateHotelVoucher(booking: Booking): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('hotel_voucher', {
      booking,
      currentDate: new Date(),
      voucherNumber: this.generateVoucherNumber(booking.bookingRef)
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'hotel_voucher',
      fileName: `Hotel_Voucher_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate amendment invoice
  async generateAmendmentInvoice(booking: Booking, amount: number): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('amendment_invoice', {
      booking,
      currentDate: new Date(),
      invoiceNumber: this.generateInvoiceNumber(booking.bookingRef),
      amount,
      amendmentId: booking.amendments[booking.amendments.length - 1]?.id
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'amendment_invoice',
      fileName: `Amendment_Invoice_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate ticket/voucher for hold booking
  async generateTicketVoucher(booking: Booking, ticketDetails: any): Promise<BookingDocument> {
    if (booking.type === 'flight') {
      return await this.generateETicket(booking);
    } else if (booking.type === 'hotel') {
      return await this.generateHotelVoucher(booking);
    }
    throw new Error('Ticket/voucher generation not supported for this booking type');
  }

  // Send document to customer
  async sendDocument(documentId: string, email: string): Promise<boolean> {
    // Implementation would send email with document attachment
    return true;
  }

  // Download document
  async downloadDocument(documentId: string): Promise<Buffer> {
    // Implementation would retrieve document from storage
    return Buffer.from('Document content');
  }

  // Get document by ID
  async getDocument(documentId: string): Promise<BookingDocument> {
    // Implementation would fetch from database
    throw new Error('Not implemented');
  }

  // Get all documents for booking
  async getBookingDocuments(bookingId: string): Promise<BookingDocument[]> {
    // Implementation would fetch from database
    return [];
  }

  // Private methods
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'invoice',
        name: 'Booking Invoice',
        type: 'invoice',
        template: this.getInvoiceTemplate(),
        variables: ['booking', 'currentDate', 'invoiceNumber'],
        isActive: true
      },
      {
        id: 'receipt',
        name: 'Payment Receipt',
        type: 'receipt',
        template: this.getReceiptTemplate(),
        variables: ['booking', 'currentDate', 'receiptNumber'],
        isActive: true
      },
      {
        id: 'credit_note',
        name: 'Credit Note',
        type: 'credit_note',
        template: this.getCreditNoteTemplate(),
        variables: ['booking', 'currentDate', 'creditNoteNumber', 'amount', 'reason'],
        isActive: true
      },
      {
        id: 'e_ticket',
        name: 'E-Ticket',
        type: 'e_ticket',
        template: this.getETicketTemplate(),
        variables: ['booking', 'currentDate', 'ticketNumber'],
        isActive: true
      },
      {
        id: 'hotel_voucher',
        name: 'Hotel Voucher',
        type: 'hotel_voucher',
        template: this.getHotelVoucherTemplate(),
        variables: ['booking', 'currentDate', 'voucherNumber'],
        isActive: true
      },
      {
        id: 'amendment_invoice',
        name: 'Amendment Invoice',
        type: 'amendment_invoice',
        template: this.getAmendmentInvoiceTemplate(),
        variables: ['booking', 'currentDate', 'invoiceNumber', 'amount', 'amendmentId'],
        isActive: true
      }
    ];
  }

  private renderTemplate(templateId: string, data: any): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let content = template.template;
    
    // Replace variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, this.escapeHtml(data[key]));
    });

    return content;
  }

  private async saveDocument(request: {
    bookingId: string;
    type: string;
    fileName: string;
    content: string;
    mimeType: string;
  }): Promise<BookingDocument> {
    // Convert HTML to PDF (implementation would use a PDF library)
    const pdfBuffer = await this.convertHtmlToPdf(request.content);
    
    // Save to storage (implementation would save to cloud storage)
    const fileUrl = await this.saveToStorage(pdfBuffer, request.fileName);

    const document: BookingDocument = {
      id: uuidv4(),
      bookingId: request.bookingId,
      type: request.type as any,
      fileName: request.fileName,
      fileUrl,
      mimeType: request.mimeType,
      size: pdfBuffer.length,
      generatedAt: new Date(),
      generatedBy: 'system',
      status: 'generated',
      sentTo: [],
      downloadCount: 0
    };

    // Save to database (implementation would save to database)
    return document;
  }

  private generateInvoiceNumber(bookingRef: string): string {
    return `INV-${bookingRef}-${Date.now()}`;
  }

  private generateReceiptNumber(bookingRef: string): string {
    return `RCT-${bookingRef}-${Date.now()}`;
  }

  private generateCreditNoteNumber(bookingRef: string): string {
    return `CN-${bookingRef}-${Date.now()}`;
  }

  private generateTicketNumber(confirmationNumber: string): string {
    return `TKT-${confirmationNumber}-${Date.now()}`;
  }

  private generateVoucherNumber(bookingRef: string): string {
    return `VOUCH-${bookingRef}-${Date.now()}`;
  }

  private escapeHtml(text: any): string {
    if (typeof text !== 'string') {
      return String(text);
    }
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }

  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    // Implementation would use a PDF library like Puppeteer, jsPDF, or similar
    // For now, return a mock PDF buffer
    return Buffer.from('Mock PDF content');
  }

  private async saveToStorage(buffer: Buffer, fileName: string): Promise<string> {
    // Implementation would save to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // For now, return a mock URL
    return `https://storage.example.com/documents/${fileName}`;
  }

  // Template definitions
  private getInvoiceTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-info { float: left; }
        .invoice-info { float: right; text-align: right; }
        .clear { clear: both; }
        .customer-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h2>{{booking.customerType}} Booking System</h2>
            <p>Invoice Number: {{invoiceNumber}}</p>
            <p>Date: {{currentDate}}</p>
        </div>
        <div class="invoice-info">
            <h1>INVOICE</h1>
            <p>Booking Ref: {{booking.bookingRef}}</p>
            <p>Customer: {{booking.customerId}}</p>
        </div>
        <div class="clear"></div>
    </div>

    <div class="customer-info">
        <h3>Bill To:</h3>
        <p>{{booking.customerId}}</p>
        <p>{{booking.companyId || 'N/A'}}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Service Type</th>
                <th>Amount</th>
                <th>Currency</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{booking.type}} Booking</td>
                <td>{{booking.type}}</td>
                <td>{{booking.pricing.customerPrice}}</td>
                <td>{{booking.pricing.currency}}</td>
            </tr>
        </tbody>
    </table>

    <div class="total">
        Total Amount: {{booking.pricing.customerPrice}} {{booking.pricing.currency}}
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>For questions about this invoice, please contact our support team.</p>
    </div>
</body>
</html>
    `;
  }

  private getReceiptTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .receipt-info { text-align: center; }
        .payment-details { margin-bottom: 30px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="receipt-info">
            <h1>RECEIPT</h1>
            <p>Receipt Number: {{receiptNumber}}</p>
            <p>Date: {{currentDate}}</p>
        </div>
    </div>

    <div class="payment-details">
        <h3>Payment Details</h3>
        <p>Booking Ref: {{booking.bookingRef}}</p>
        <p>Customer: {{booking.customerId}}</p>
        <p>Payment Method: {{booking.payment.method}}</p>
        <p>Amount Paid: {{booking.pricing.customerPrice}} {{booking.pricing.currency}}</p>
        <p>Payment Status: {{booking.payment.status}}</p>
    </div>

    <div class="footer">
        <p>This is an electronic receipt. No signature required.</p>
        <p>For questions about this payment, please contact our support team.</p>
    </div>
</body>
</html>
    `;
  }

  private getCreditNoteTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Credit Note</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .credit-info { text-align: center; background-color: #f8d7da; padding: 20px; }
        .refund-details { margin-bottom: 30px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="credit-info">
            <h1>CREDIT NOTE</h1>
            <p>Credit Note Number: {{creditNoteNumber}}</p>
            <p>Date: {{currentDate}}</p>
        </div>
    </div>

    <div class="refund-details">
        <h3>Refund Details</h3>
        <p>Booking Ref: {{booking.bookingRef}}</p>
        <p>Customer: {{booking.customerId}}</p>
        <p>Refund Amount: {{amount}} {{booking.pricing.currency}}</p>
        <p>Refund Reason: {{reason}}</p>
        <p>Refund Type: {{booking.refunds[booking.refunds.length - 1]?.type || 'full'}}</p>
    </div>

    <div class="footer">
        <p>This credit note represents a refund to your account.</p>
        <p>For questions about this refund, please contact our support team.</p>
    </div>
</body>
</html>
    `;
  }

  private getETicketTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>E-Ticket</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .ticket-header { border: 2px solid #333; padding: 20px; text-align: center; background-color: #f8f9fa; }
        .ticket-details { margin: 30px 0; }
        .passenger-info { margin: 30px 0; }
        .terms { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="ticket-header">
        <h1>E-TICKET</h1>
        <p>Ticket Number: {{ticketNumber}}</p>
        <p>Booking Ref: {{booking.bookingRef}}</p>
        <p>Confirmation Number: {{booking.confirmationNumber}}</p>
    </div>

    <div class="ticket-details">
        <h3>Flight Details</h3>
        <p>Flight Type: {{booking.type}}</p>
        <p>Passengers: {{booking.passengers.length}}</p>
        <p>Total Amount: {{booking.pricing.customerPrice}} {{booking.pricing.currency}}</p>
    </div>

    <div class="passenger-info">
        <h3>Passenger Information</h3>
        {{#booking.passengers}}
        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <p><strong>Name:</strong> {{firstName}} {{lastName}}</p>
            <p><strong>Passport:</strong> {{passportNumber}}</p>
        </div>
        {{/booking.passengers}}
    </div>

    <div class="terms">
        <p><strong>Important:</strong> Please present this e-ticket along with a valid ID at check-in.</p>
        <p>For changes or cancellations, please contact our customer service.</p>
    </div>
</body>
</html>
    `;
  }

  private getHotelVoucherTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Hotel Voucher</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .voucher-header { border: 2px solid #333; padding: 20px; text-align: center; background-color: #f8f9fa; }
        .hotel-details { margin: 30px 0; }
        .booking-info { margin: 30px 0; }
        .terms { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="voucher-header">
        <h1>HOTEL VOUCHER</h1>
        <p>Voucher Number: {{voucherNumber}}</p>
        <p>Booking Ref: {{booking.bookingRef}}</p>
        <p>Confirmation Number: {{booking.confirmationNumber}}</p>
    </div>

    <div class="hotel-details">
        <h3>Hotel Information</h3>
        <p>Hotel Name: {{booking.serviceDetails.hotelName}}</p>
        <p>Check-in Date: {{booking.serviceDetails.checkInDate}}</p>
        <p>Check-out Date: {{booking.serviceDetails.checkOutDate}}</p>
        <p>Room Type: {{booking.serviceDetails.roomType}}</p>
    </div>

    <div class="booking-info">
        <h3>Booking Information</h3>
        <p>Booking Ref: {{booking.bookingRef}}</p>
        <p>Customer: {{booking.customerId}}</p>
        <p>Total Amount: {{booking.pricing.customerPrice}} {{booking.pricing.currency}}</p>
        <p>Number of Rooms: {{booking.serviceDetails.numberOfRooms}}</p>
    </div>

    <div class="terms">
        <p><strong>Important:</strong> Please present this voucher at hotel check-in.</p>
        <p>For changes or cancellations, please contact our customer service.</p>
    </div>
</body>
</html>
    `;
  }

  private getAmendmentInvoiceTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Amendment Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .amendment-info { text-align: center; background-color: #fff3cd; padding: 20px; }
        .changes-details { margin-bottom: 30px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="amendment-info">
            <h1>AMENDMENT INVOICE</h1>
            <p>Invoice Number: {{invoiceNumber}}</p>
            <p>Amendment ID: {{amendmentId}}</p>
            <p>Date: {{currentDate}}</p>
        </div>
    </div>

    <div class="changes-details">
        <h3>Amendment Details</h3>
        <p>Original Booking Ref: {{booking.bookingRef}}</p>
        <p>Change Amount: {{amount}} {{booking.pricing.currency}}</p>
        <p>Change Type: Price Difference</p>
        <p>Reason: Customer Request</p>
    </div>

    <div class="footer">
        <p>This invoice represents additional charges for booking amendments.</p>
        <p>For questions about this amendment, please contact our support team.</p>
    </div>
</body>
</html>
    `;
  }
}
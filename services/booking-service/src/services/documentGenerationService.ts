import { Booking, BookingDocument } from '../types/enhancedBooking';
import { v4 as uuidv4 } from 'uuid';

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice' | 'itinerary';
  template: string;
  variables: string[];
  isActive: boolean;
}

interface DocumentGenerationRequest {
  booking: Booking;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice' | 'itinerary';
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
      currentDate: new Date().toLocaleDateString(),
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
      currentDate: new Date().toLocaleDateString(),
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
      currentDate: new Date().toLocaleDateString(),
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
      currentDate: new Date().toLocaleDateString(),
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
      currentDate: new Date().toLocaleDateString(),
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

  // Generate itinerary
  async generateItinerary(booking: Booking): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('itinerary', {
      booking,
      currentDate: new Date().toLocaleDateString(),
      itineraryRef: booking.bookingRef
    });

    return this.saveDocument({
      bookingId: booking.id,
      type: 'itinerary',
      fileName: `Itinerary_${booking.bookingRef}.pdf`,
      content: htmlContent,
      mimeType: 'application/pdf'
    });
  }

  // Generate amendment invoice
  async generateAmendmentInvoice(booking: Booking, amount: number): Promise<BookingDocument> {
    const htmlContent = this.renderTemplate('amendment_invoice', {
      booking,
      currentDate: new Date().toLocaleDateString(),
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
      },
      {
        id: 'itinerary',
        name: 'Travel Itinerary',
        type: 'itinerary',
        template: this.getItineraryTemplate(),
        variables: ['booking', 'currentDate', 'itineraryRef'],
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
  <style>
    :root {
      --primary: #4f46e5;
      --secondary: #6366f1;
      --accent: #f59e0b;
      --text-dark: #1f2937;
      --text-light: #6b7280;
      --bg-gray: #f9fafb;
    }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--text-dark); margin: 0; padding: 0; line-height: 1.5; }
    .page { padding: 40px; }
    .header { background: #1e1b4b; color: white; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
    .logo span { color: var(--accent); }
    .header-info { text-align: right; }
    .title { font-size: 32px; font-weight: 700; margin: 0; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--text-light); border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { text-align: left; background: var(--bg-gray); padding: 12px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-light); }
    td { padding: 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    
    .total-box { margin-left: auto; width: 300px; margin-top: 40px; background: var(--bg-gray); padding: 20px; border-radius: 8px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-row.grand-total { font-weight: 700; font-size: 20px; color: var(--primary); border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; }
    
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: var(--text-light); text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Trip<span>Alfa</span></div>
    <div class="header-info">
      <h1 class="title">INVOICE</h1>
      <p>#{{invoiceNumber}} | {{currentDate}}</p>
    </div>
  </div>
  
  <div class="page">
    <div class="grid">
      <div>
        <div class="section-title">Bill To</div>
        <p><strong>{{booking.customerId}}</strong></p>
        <p>{{booking.customerEmail || 'N/A'}}</p>
      </div>
      <div>
        <div class="section-title">Booking Details</div>
        <p>Reference: <strong>{{booking.bookingRef}}</strong></p>
        <p>Status: <span style="background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">PAID</span></p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Traveler</th>
          <th>Dates</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>{{booking.type === 'flight' ? 'Flight' : 'Hotel'}} Booking</strong><br/>
            <span style="font-size: 12px; color: var(--text-light);">{{booking.serviceDetails.description || 'Global Travel Package'}}</span>
          </td>
          <td>{{booking.passengers[0]?.given_name}} {{booking.passengers[0]?.family_name}}</td>
          <td>{{booking.serviceDetails.checkInDate || booking.serviceDetails.departureDate}}</td>
          <td style="text-align: right; font-weight: 600;">{{booking.pricing.customerPrice}} {{booking.pricing.currency}}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>{{booking.pricing.customerPrice}} {{booking.pricing.currency}}</span>
      </div>
      <div class="total-row">
        <span>Taxes</span>
        <span>Included</span>
      </div>
      <div class="total-row grand-total">
        <span>Total</span>
        <span>{{booking.pricing.customerPrice}} {{booking.pricing.currency}}</span>
      </div>
    </div>

    <div class="footer">
      <p>TripAlfa Limited | 123 Business Way, Travel City</p>
      <p>Thank you for choosing TripAlfa for your travel needs!</p>
    </div>
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
  <style>
    :root {
      --primary: #4f46e5;
      --accent: #f59e0b;
      --text-dark: #1f2937;
      --bg-gray: #f9fafb;
    }
    body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 40px; display: flex; justify-content: center; }
    .receipt-card { background: white; width: 450px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #1e1b4b; color: white; padding: 24px; text-align: center; }
    .logo { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    .logo span { color: var(--accent); }
    .amount { font-size: 36px; font-weight: 700; margin: 16px 0; }
    
    .content { padding: 32px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
    .label { color: #6b7280; }
    .value { font-weight: 600; color: var(--text-dark); }
    
    .divider { border-top: 2px dashed #e5e7eb; margin: 24px 0; position: relative; }
    .divider::before, .divider::after { content: ''; position: absolute; width: 20px; height: 20px; background: #f3f4f6; border-radius: 50%; top: -10px; }
    .divider::before { left: -42px; }
    .divider::after { right: -42px; }
    
    .footer { text-align: center; font-size: 12px; color: #9ca3af; padding: 0 32px 32px; }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="logo">Trip<span>Alfa</span></div>
      <div class="amount">{{booking.pricing.customerPrice}} {{booking.pricing.currency}}</div>
      <p style="margin: 0; opacity: 0.8; font-size: 13px;">Payment Successful</p>
    </div>
    
    <div class="content">
      <div class="row">
        <span class="label">Receipt Number</span>
        <span class="value">{{receiptNumber}}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">{{currentDate}}</span>
      </div>
      <div class="row">
        <span class="label">Booking Ref</span>
        <span class="value">{{booking.bookingRef}}</span>
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span class="label">Payment Method</span>
        <span class="value">{{booking.payment.method}}</span>
      </div>
      <div class="row" style="margin-top: 24px;">
        <span class="label">Paid To</span>
        <span class="value">TripAlfa Limited</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your payment!</p>
      <p>support@tripalfa.com</p>
    </div>
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
  <style>
    :root {
      --primary: #4f46e5;
      --accent: #f59e0b;
      --purple-dark: #1e1b4b;
    }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1f2937; }
    .voucher { border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; max-width: 800px; margin: auto; }
    .header { background: var(--purple-dark); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; }
    .logo span { color: var(--accent); }
    
    .status-badge { background: #ecfdf5; color: #065f46; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 14px; }
    
    .main-info { padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; border-bottom: 1px solid #e5e7eb; }
    .hotel-name { font-size: 28px; font-weight: 700; margin: 0 0 10px; color: var(--purple-dark); }
    .hotel-addr { color: #6b7280; font-size: 14px; }
    
    .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .check-box { background: #f9fafb; padding: 20px; border-radius: 8px; }
    .check-label { font-size: 12px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .check-time { font-size: 18px; font-weight: 700; }
    
    .room-details { padding: 40px; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .section-title::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    
    .guest-list { background: #f3f4f6; padding: 20px; border-radius: 8px; font-weight: 600; }
    
    .footer { background: #f9fafb; padding: 30px; border-top: 1px dotted #d1d5db; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="header">
      <div class="logo">Trip<span>Alfa</span></div>
      <div class="status-badge">CONFIRMED</div>
    </div>
    
    <div class="main-info">
      <div>
        <h1 class="hotel-name">{{booking.serviceDetails.hotelName}}</h1>
        <p class="hotel-addr">{{booking.serviceDetails.address || 'London, United Kingdom'}}</p>
        
        <div class="check-grid">
          <div class="check-box">
            <div class="check-label">Check-in</div>
            <div class="check-time">{{booking.serviceDetails.checkInDate}}</div>
          </div>
          <div class="check-box">
            <div class="check-label">Check-out</div>
            <div class="check-time">{{booking.serviceDetails.checkOutDate}}</div>
          </div>
        </div>
      </div>
      
      <div style="border-left: 1px solid #e5e7eb; padding-left: 30px;">
        <div class="check-label">Voucher No</div>
        <p style="font-weight: 700; font-size: 18px; margin: 0 0 20px;">{{voucherNumber}}</p>
        
        <div class="check-label">Booking Ref</div>
        <p style="font-weight: 700; margin: 0;">{{booking.bookingRef}}</p>
      </div>
    </div>
    
    <div class="room-details">
      <div class="section-title">Accommodation Details</div>
      <p><strong>Room Type:</strong> {{booking.serviceDetails.roomType}}</p>
      <p><strong>Occupancy:</strong> {{booking.serviceDetails.guestsCount || 2}} Adults</p>
      <p><strong>Meals:</strong> {{booking.serviceDetails.boardName || 'Room Only'}}</p>
      
      <div class="section-title" style="margin-top: 30px;">Primary Guest</div>
      <div class="guest-list">
        {{booking.passengers[0]?.title}} {{booking.passengers[0]?.given_name}} {{booking.passengers[0]?.family_name}}
      </div>
    </div>
    
    <div class="footer">
      <div>
        <p><strong>TripAlfa Limited</strong></p>
        <p>Booking confirmation is subject to hotel policies.</p>
        <p>Voucher generated on: {{currentDate}}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>Customer Support</strong></p>
        <p>+44 20 1234 5678</p>
        <p>support@tripalfa.com</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getItineraryTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --primary: #4f46e5;
      --accent: #f59e0b;
      --purple-dark: #1e1b4b;
    }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1f2937; }
    .itinerary { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; max-width: 800px; margin: auto; }
    .header { background: var(--purple-dark); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; }
    .logo span { color: var(--accent); }
    
    .content { padding: 40px; }
    .page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--purple_dark); }
    
    .item-card { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px; }
    .item-header { background: #f9fafb; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-weight: 600; }
    .item-body { padding: 24px; }
    
    .flight-segment { display: flex; gap: 20px; align-items: center; }
    .airport-box { flex: 1; }
    .iata { font-size: 24px; font-weight: 800; margin: 0; }
    .city { font-size: 14px; color: #6b7280; }
    .arrow { color: var(--accent); font-size: 24px; }
    
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="itinerary">
    <div class="header">
      <div class="logo">Trip<span>Alfa</span></div>
      <div style="text-align: right;">
        <p style="margin:0; font-size: 12px; opacity: 0.8;">REFERENCE</p>
        <p style="margin:0; font-weight: 700;">{{booking.bookingRef}}</p>
      </div>
    </div>
    
    <div class="content">
      <h1 class="page-title">Your Trip Itinerary</h1>
      
      <div class="item-card">
        <div class="item-header">
          <span>Booking Details</span>
          <span style="color: var(--primary);">{{booking.type}}</span>
        </div>
        <div class="item-body">
          <h2 style="margin: 0 0 8px;">{{booking.serviceDetails.hotelName || booking.serviceDetails.airline}}</h2>
          <p style="color: #6b7280; margin: 0;">{{booking.serviceDetails.description || 'Travel Package'}}</p>
        </div>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ This booking is currently on HOLD.</p>
        <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">Please complete your payment to confirm your reservation.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>TripAlfa Limited | support@tripalfa.com</p>
    </div>
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
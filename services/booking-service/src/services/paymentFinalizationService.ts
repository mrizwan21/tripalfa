import { v4 as uuidv4 } from 'uuid';
import holdOrdersService from './holdOrdersService';
import paymentService from './paymentService';
import { DocumentGenerationService } from './documentGenerationService';
import { NotificationService } from './notificationService';
import { CacheService } from '../cache/redis';

interface PaymentDetails {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  // Add other payment method details
}

interface FinalizePaymentResult {
  bookingId: string;
  paymentId: string;
  documents: any[];
  notifications: any[];
}

class PaymentFinalizationService {
  private documentService: DocumentGenerationService;
  private notificationService: NotificationService;

  constructor() {
    this.documentService = new DocumentGenerationService();
    this.notificationService = new NotificationService(new CacheService());
  }
  /**
   * Finalize payment for a hold order
   */
  async finalizePayment(holdOrderId: string, paymentMethod: string, paymentDetails: PaymentDetails): Promise<FinalizePaymentResult> {
    // Validate hold order exists and is eligible for payment
    const holdOrder = await this.validateHoldOrder(holdOrderId);

    // Process payment
    const paymentResult = await this.processPayment(holdOrder.totalAmount, paymentMethod, paymentDetails);

    // Update booking status from hold to confirmed
    const bookingId = await this.updateBookingStatus(holdOrderId, 'confirmed');

    // Create booking object from hold order
    const booking = {
      id: bookingId,
      bookingRef: holdOrder.bookingRef || `BK${Date.now()}`,
      customerId: holdOrder.customerId,
      customerName: holdOrder.customerName,
      type: holdOrder.type,
      status: 'confirmed',
      totalAmount: holdOrder.totalAmount,
      currency: holdOrder.currency,
      createdAt: holdOrder.createdAt,
      updatedAt: new Date(),
      // Add other booking fields as needed
    };

    // Generate documents (invoice, e-ticket, itinerary)
    const documents = await this.generateDocuments(booking);

    // Send notifications
    await this.sendNotifications(booking, paymentResult);

    return {
      bookingId,
      paymentId: paymentResult.id,
      documents,
      notifications: [] // Notifications are sent asynchronously
    };
  }

  private async validateHoldOrder(holdOrderId: string) {
    // First try to get from real service
    try {
      const holdOrder = await holdOrdersService.getHoldOrder(holdOrderId);
      if (holdOrder) {
        return holdOrder;
      }
    } catch (error) {
      // Continue to check for mock hold orders
    }

    // Check for mock hold orders (for testing)
    const mockHoldOrders = (global as any).mockHoldOrders;
    if (mockHoldOrders && mockHoldOrders.has(holdOrderId)) {
      return mockHoldOrders.get(holdOrderId);
    }

    throw new Error('Hold order not found');
  }

  private async processPayment(amount: number, paymentMethod: string, paymentDetails: PaymentDetails) {
    // Use existing payment service
    return await paymentService.processPayment(
      'hold-order-' + Date.now(), // orderId
      amount,
      'USD', // currency
      paymentMethod as 'balance' | 'card'
    );
  }

  private async updateBookingStatus(holdOrderId: string, status: string): Promise<string> {
    // Convert hold order to confirmed booking
    const bookingId = uuidv4();
    // Implementation would update database
    return bookingId;
  }

  private async generateDocuments(booking: any) {
    const documents = [];

    // Generate invoice
    const invoice = await this.documentService.generateInvoice(booking);
    documents.push(invoice);

    // Generate e-ticket or hotel voucher based on booking type
    if (booking.type === 'flight') {
      const eTicket = await this.documentService.generateETicket(booking);
      documents.push(eTicket);
    } else if (booking.type === 'hotel') {
      const hotelVoucher = await this.documentService.generateHotelVoucher(booking);
      documents.push(hotelVoucher);
    }

    return documents;
  }

  private async sendNotifications(booking: any, paymentResult: any) {
    // Send payment confirmation notification
    await this.notificationService.sendNotification({
      type: 'payment_received',
      title: 'Payment Confirmed',
      message: `Your payment of ${paymentResult.amount} ${paymentResult.currency} for booking ${booking.bookingRef} has been confirmed.`,
      userId: booking.customerId,
      userName: booking.customerName,
      bookingId: booking.id,
      bookingReference: booking.bookingRef,
      priority: 'high',
      channels: ['email', 'sms', 'in_app']
    });

    // Send booking confirmation notification
    await this.notificationService.sendNotification({
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your ${booking.type} booking ${booking.bookingRef} has been confirmed. Your documents are ready.`,
      userId: booking.customerId,
      userName: booking.customerName,
      bookingId: booking.id,
      bookingReference: booking.bookingRef,
      priority: 'high',
      channels: ['email', 'sms', 'in_app']
    });
  }
}

const paymentFinalizationService = new PaymentFinalizationService();
export default paymentFinalizationService;
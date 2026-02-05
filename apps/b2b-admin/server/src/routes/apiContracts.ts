// API Contracts for Booking Management

// Booking API Contracts
export interface Booking {
  id: number;
  userId: string;
  flightRouteId?: number;
  hotelId?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  userId: string;
  flightRouteId?: number;
  hotelId?: number;
  totalAmount: number;
  currency: string;
}

export interface UpdateBookingStatusRequest {
  bookingId: number;
  status: 'confirmed' | 'cancelled';
}

// Invoice API Contracts
export interface Invoice {
  id: number;
  bookingId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: number;
  currency: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  bookingId: number;
  totalAmount: number;
  currency: string;
  dueDate?: string;
}

// Payment API Contracts
export interface Payment {
  id: number;
  invoiceId: number;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  invoiceId: number;
  paymentMethod: string;
  amount: number;
  currency: string;
}

// Queue API Contracts
export interface Queue {
  id: number;
  bookingId: number;
  queueType: 'refund' | 'cancellation';
  status: 'pending' | 'processed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateQueueRequest {
  bookingId: number;
  queueType: 'refund' | 'cancellation';
}
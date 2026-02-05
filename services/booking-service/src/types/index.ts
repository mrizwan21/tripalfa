// Common types for booking service

export interface BookingData {
  userId: string;
  flightRouteId?: number;
  hotelId?: number;
  totalAmount: number;
  currency: string;
  bookingId: string;
  partnerId: string;
  productId: string;
  status: string;
  type?: string;
  reference?: string;
  pricing?: {
    sellingAmount: number;
    markupAmount: number;
    commissionAmount: number;
  };
  paymentInfo?: {
    method: string;
    status: string;
    transactionId?: string;
  };
  bookingOptions?: {
    travelInsurance?: boolean;
    specialRequests?: string;
  };
  assignedAgentId?: string;
  workflowStatus?: string;
}

export interface BookingResponse {
  id: number;
  userId: string;
  flightRouteId?: number;
  hotelId?: number;
  totalAmount: number;
  currency: string;
  bookingId: string;
  partnerId: string;
  productId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  companyId: string;
  type?: string;
  reference?: string;
  pricing?: {
    sellingAmount: number;
    markupAmount: number;
    commissionAmount: number;
  };
  paymentInfo?: {
    method: string;
    status: string;
    transactionId?: string;
  };
  bookingOptions?: {
    travelInsurance?: boolean;
    specialRequests?: string;
  };
  assignedAgentId?: string;
  workflowStatus?: string;
}

export interface SearchParams {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  bookingId?: string;
  partnerId?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalAmount: number;
  currency: string;
}

export interface UserBookingStats {
  userId: string;
  totalBookings: number;
  totalSpent: number;
  currency: string;
  lastBookingDate: Date | null;
  bookingHistory: BookingResponse[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Express types with proper typing
import { Request } from 'express';

export interface TypedRequest<T = any, P = any, Q = any> extends Request {
  body: T;
  params: P & {
    id?: string;
    userId?: string;
    bookingId?: string;
    inventoryId?: string;
    ruleId?: string;
  };
  query: Q & {
    status?: string;
    type?: string;
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
  };
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

export interface TypedResponse<T> extends Express.Response {
  json: (data: T) => this;
}
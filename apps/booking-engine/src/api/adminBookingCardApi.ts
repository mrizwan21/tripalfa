/**
 * Admin Booking Card API Service
 * Integrates with the backend AdminBookingCardController
 */

import { api } from '../lib/api';

// Types
export interface AdminBookingCard {
  id: string;
  bookingId?: string;
  userId?: string;
  product: 'hotel' | 'flight';
  status: string;
  reference?: string;
  total: { amount: number; currency: string };
  createdAt: string;
  paymentStatus?: string;
  details?: any;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  couponRedemptions?: any[];
  commissionSettlements?: any[];
  pricingAuditLogs?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    bookings: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface BookingStatistics {
  success: boolean;
  data: {
    totalBookings: number;
    statusDistribution: { status: string; _count: number }[];
    typeDistribution: { serviceType: string; _count: number }[];
    totalRevenue: number;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface BookingQueueParams {
  queueType?: 'pending' | 'processing' | 'completed';
  page?: number;
  limit?: number;
}

/**
 * Get all booking cards with pagination
 */
export async function getAdminBookingCards(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminBookingCard>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  
  const response = await api.get<PaginatedResponse<AdminBookingCard>>(
    `/admin-bookings/cards?${queryParams.toString()}`
  );
  return response;
}

/**
 * Get a specific booking card by ID
 */
export async function getAdminBookingCard(id: string): Promise<SingleResponse<AdminBookingCard>> {
  const response = await api.get<SingleResponse<AdminBookingCard>>(
    `/admin-bookings/cards/${id}`
  );
  return response;
}

/**
 * Create a new booking card
 */
export async function createAdminBookingCard(data: Partial<AdminBookingCard>): Promise<SingleResponse<AdminBookingCard>> {
  const response = await api.post<SingleResponse<AdminBookingCard>>(
    '/admin-bookings/cards',
    data
  );
  return response;
}

/**
 * Update a booking card
 */
export async function updateAdminBookingCard(
  id: string,
  data: Partial<AdminBookingCard>
): Promise<SingleResponse<AdminBookingCard>> {
  const response = await api.put<SingleResponse<AdminBookingCard>>(
    `/admin-bookings/cards/${id}`,
    data
  );
  return response;
}

/**
 * Delete a booking card
 */
export async function deleteAdminBookingCard(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/admin-bookings/cards/${id}`
  );
  return response;
}

/**
 * Get booking queues (pending, processing, completed)
 */
export async function getBookingQueues(params?: BookingQueueParams): Promise<PaginatedResponse<AdminBookingCard>> {
  const queryParams = new URLSearchParams();
  if (params?.queueType) queryParams.set('queueType', params.queueType);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  
  const response = await api.get<PaginatedResponse<AdminBookingCard>>(
    `/admin-bookings/queues?${queryParams.toString()}`
  );
  return response;
}

/**
 * Get booking statistics
 */
export async function getBookingStatistics(dateRange?: string): Promise<BookingStatistics> {
  const queryParams = dateRange ? `?dateRange=${dateRange}` : '';
  const response = await api.get<BookingStatistics>(
    `/admin-bookings/statistics${queryParams}`
  );
  return response;
}

/**
 * Get agent assignments
 */
export async function getAgentAssignments(
  agentId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<AdminBookingCard>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  
  const response = await api.get<PaginatedResponse<AdminBookingCard>>(
    `/admin-bookings/agents/${agentId}/assignments?${queryParams.toString()}`
  );
  return response;
}

/**
 * Get system health
 */
export async function getSystemHealth(): Promise<{
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    services: {
      database: { status: string; responseTime: number };
      redis: { status: string; responseTime: number };
      cache: { status: string; hitRate: number };
    };
    metrics: {
      memoryUsage: NodeJS.MemoryUsage;
      uptime: number;
      nodeVersion: string;
    };
  };
}> {
  const response = await api.get('/admin-bookings/health');
  return response;
}

// Export all functions as a named export object
export const adminBookingCardApi = {
  getBookingCards: getAdminBookingCards,
  getBookingCard: getAdminBookingCard,
  createBookingCard: createAdminBookingCard,
  updateBookingCard: updateAdminBookingCard,
  deleteBookingCard: deleteAdminBookingCard,
  getQueues: getBookingQueues,
  getStatistics: getBookingStatistics,
  getAgentAssignments,
  getSystemHealth,
};

export default adminBookingCardApi;

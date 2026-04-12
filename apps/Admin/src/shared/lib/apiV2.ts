/**
 * Booking V2 API Client
 *
 * API client for the new V2 booking endpoints with workflow state machine.
 * Use this client when feature flags enable V2 bookings.
 */

import api from "./api";

// Types
export interface BookingV2Filters {
  page?: number;
  limit?: number;
  status?: string;
  workflowState?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: string;
  userId?: string;
  product?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateBookingV2Payload {
  userId?: string;
  totalAmount?: number;
  currency?: string;
  type?: string;
  [key: string]: any;
}

export interface PricingOverride {
  baseAmount?: number;
  markupAmount?: number;
  taxAmount?: number;
  feesAmount?: number;
  note: string;
}

export interface QueueActionPayload {
  action:
    | "submit"
    | "price"
    | "invoice"
    | "confirm_payment"
    | "book_supplier"
    | "confirm"
    | "complete"
    | "cancel";
  reason?: string;
}

export interface WorkflowStateUpdate {
  workflowState: string;
  reason?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Functions

/**
 * List bookings with V2 workflow support
 */
export async function listBookingsV2(filters: BookingV2Filters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  if (filters.status) params.append("status", filters.status);
  if (filters.workflowState)
    params.append("workflowState", filters.workflowState);
  if (filters.search) params.append("search", filters.search);
  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);
  if (filters.companyId) params.append("companyId", filters.companyId);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  const response = await api.get(`/v2/admin/bookings?${params.toString()}`);
  return response.data;
}

/**
 * Get a single booking by ID
 */
export async function getBookingV2(id: string) {
  const response = await api.get(`/v2/admin/bookings/${id}`);
  return response.data;
}

/**
 * Create a new booking (starts in DRAFT state)
 */
export async function createBookingV2(payload: CreateBookingV2Payload) {
  const response = await api.post("/v2/admin/bookings", payload);
  return response.data;
}

/**
 * Update booking workflow state
 */
export async function updateWorkflowState(
  id: string,
  update: WorkflowStateUpdate,
) {
  const response = await api.put(`/v2/admin/bookings/${id}/status`, update);
  return response.data;
}

/**
 * Calculate pricing for a booking
 */
export async function calculatePricing(id: string, override?: PricingOverride) {
  const response = await api.post(`/v2/admin/bookings/${id}/pricing`, {
    override,
  });
  return response.data;
}

/**
 * Generate invoice for a booking
 */
export async function generateInvoice(id: string, dueDate?: string) {
  const response = await api.post(`/v2/admin/bookings/${id}/invoice`, {
    dueDate,
  });
  return response.data;
}

/**
 * Process wallet payment for a booking
 */
export async function processWalletPayment(
  id: string,
  paymentMethod: string = "wallet",
) {
  const response = await api.post(`/v2/admin/bookings/${id}/pay-wallet`, {
    paymentMethod,
  });
  return response.data;
}

/**
 * Perform a queue action on a booking
 */
export async function performQueueAction(
  id: string,
  action: QueueActionPayload,
) {
  const response = await api.post(
    `/v2/admin/bookings/${id}/queue-action`,
    action,
  );
  return response.data;
}

/**
 * List bookings in queue (pending workflow states)
 */
export async function listBookingQueues(filters: BookingV2Filters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  if (filters.status) params.append("status", filters.status);
  if (filters.product) params.append("product", filters.product);
  if (filters.search) params.append("search", filters.search);

  const response = await api.get(
    `/v2/admin/bookings/queues?${params.toString()}`,
  );
  return response.data;
}

// Export all functions as a single API object
const bookingV2Api = {
  listBookingsV2,
  getBookingV2,
  createBookingV2,
  updateWorkflowState,
  calculatePricing,
  generateInvoice,
  processWalletPayment,
  performQueueAction,
  listBookingQueues,
};

export default bookingV2Api;

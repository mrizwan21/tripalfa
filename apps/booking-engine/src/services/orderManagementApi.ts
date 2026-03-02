/**
 * Order Management API Service - Booking Cancellation & Status
 *
 * Handles all order-level operations:
 * - Cancellation requests and confirmation
 * - Cancellation status tracking
 *
 * Routes through centralized API Manager for consistency
 */

import type { api as ApiClientInstance } from "../lib/api";

// Lazy import to avoid circular dependency
type ApiClient = typeof ApiClientInstance;
let api: ApiClient | undefined;
function getApi() {
  if (!api) api = require("../lib/api").api as ApiClient;
  return api;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CancellationQuote {
  id: string;
  orderId: string;
  refundAmount: number;
  refundCurrency: string;
  cancellationFee: number;
  status: "pending" | "confirmed" | "failed";
  reason?: string;
  createdAt: string;
}

export interface CancellationStatus {
  orderId: string;
  status: "cancellable" | "cancelled" | "non-cancellable";
  refundAmount?: number;
  refundCurrency?: string;
  cancellationMethod?: string;
  reason?: string;
  timestamp: string;
}

// ============================================================================
// ORDER CANCELLATION ENDPOINTS
// ============================================================================

/**
 * Cancel a flight order
 *
 * Workflow:
 * 1. Creates cancellation quote (shows refund amount)
 * 2. Confirms cancellation (processes refund)
 *
 * @param duffelOrderId - Duffel order ID to cancel
 * @param reason - Cancellation reason
 * @returns Cancellation confirmation with refund details
 */
export async function cancelOrder(
  duffelOrderId: string,
  reason: string = "Customer requested cancellation",
): Promise<any> {
  try {
    console.log("[OrderManagement] Cancelling order:", duffelOrderId);

    const result = await api.post<any>("/api/admin/orders/cancel", {
      duffelOrderId,
      reason,
    });

    console.log("[OrderManagement] Order cancelled successfully:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderManagement] Cancel order error:", error);
    throw error;
  }
}

/**
 * Get cancellation status for an order
 *
 * Shows current cancellation state and refund information
 *
 * @param duffelOrderId - Duffel order ID
 * @returns Current cancellation status
 */
export async function getCancellationStatus(
  duffelOrderId: string,
): Promise<CancellationStatus> {
  try {
    console.log(
      "[OrderManagement] Fetching cancellation status:",
      duffelOrderId,
    );

    const result = await api.get<any>(
      `/api/admin/orders/cancellation-status?duffelOrderId=${duffelOrderId}`,
    );

    console.log("[OrderManagement] Cancellation status retrieved:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderManagement] Get cancellation status error:", error);
    throw error;
  }
}

/**
 * Check if an order is cancellable
 *
 * @param duffelOrderId - Duffel order ID
 * @returns Boolean indicating if order can be cancelled
 */
export async function isOrderCancellable(
  duffelOrderId: string,
): Promise<boolean> {
  try {
    const status = await getCancellationStatus(duffelOrderId);
    return status.status === "cancellable";
  } catch (error) {
    console.error("[OrderManagement] Check cancellable error:", error);
    return false;
  }
}

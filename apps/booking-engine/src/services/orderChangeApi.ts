/**
 * Order Change Management API Service
 *
 * Handles all order modification operations:
 * - Eligibility checking for changes
 * - Creating change requests
 * - Retrieving available alternatives
 * - Managing pending changes
 * - Confirming or rejecting changes
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

export interface ChangeEligibility {
  orderId: string;
  isEligible: boolean;
  eligiblePassengers?: string[];
  allowedChangeTypes?: ("flight" | "date" | "time")[];
  restrictions?: string[];
  fee?: number;
  feeCurrency?: string;
  reason?: string;
}

export interface OrderChangeRequest {
  id: string;
  orderId: string;
  status: "pending" | "offered" | "confirmed" | "rejected";
  changeType: "flight" | "date" | "time";
  affectedPassengers: string[];
  originalSlices: Array<{
    departureAirport: string;
    arrivalAirport: string;
    departureTime: string;
  }>;
  createdAt: string;
}

export interface OrderChangeOffer {
  id: string;
  changeRequestId: string;
  newFlight: {
    offerId: string;
    departureTime: string;
    arrivalTime: string;
    airline: string;
    aircraftType: string;
    stops: number;
  };
  priceDifference: number;
  currency: string;
  refundAmount: number;
  expiresAt: string;
}

export interface PendingOrderChange {
  id: string;
  orderId: string;
  changeRequestId: string;
  offer: OrderChangeOffer;
  status: "pending_confirmation" | "confirmed" | "rejected";
  createdAt: string;
}

// ============================================================================
// CHANGE ELIGIBILITY CHECK
// ============================================================================

/**
 * Check if an order is eligible for changes
 *
 * Verifies:
 * - Airline change policies
 * - Time windows (change must be made within allowed period)
 * - Selected passengers (may not all be eligible)
 * - Type of changes allowed
 *
 * @param orderId - Duffel order ID
 * @param changeType - Type of change requested
 * @param passengers - Passenger IDs to change (optional)
 * @returns Eligibility details with restrictions
 */
export async function checkOrderChangeEligibility(
  orderId: string,
  changeType: "flight" | "date" | "time" = "flight",
  passengers?: string[],
): Promise<ChangeEligibility> {
  try {
    console.log("[OrderChange] Checking eligibility for:", {
      orderId,
      changeType,
    });

    const result = await api.post<any>("/api/admin/orders/change/eligibility", {
      orderId,
      changeType,
      passengers: passengers || [],
    });

    console.log("[OrderChange] Eligibility check complete:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderChange] Eligibility check error:", error);
    throw error;
  }
}

// ============================================================================
// CREATE ORDER CHANGE REQUEST
// ============================================================================

/**
 * Create a change request for an order
 *
 * Initiates the change process for:
 * - Single or multiple passengers
 * - Specific flight segments
 * - Specific change type (flight, date, time)
 *
 * @param orderId - Duffel order ID
 * @param changeType - Type of change
 * @param affectedPassengers - Passenger IDs to change
 * @param sliceIndex - Index of flight slice to change (optional)
 * @returns Change request with ID for tracking
 */
export async function createOrderChangeRequest(
  orderId: string,
  changeType: "flight" | "date" | "time",
  affectedPassengers: string[],
  sliceIndex: number = 0,
): Promise<OrderChangeRequest> {
  try {
    console.log("[OrderChange] Creating change request:", {
      orderId,
      changeType,
      passengers: affectedPassengers,
    });

    const result = await api.post<any>("/api/admin/orders/change/request", {
      orderId,
      changeType,
      affectedPassengers,
      sliceIndex,
    });

    console.log("[OrderChange] Change request created:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderChange] Create request error:", error);
    throw error;
  }
}

// ============================================================================
// GET ORDER CHANGE OFFERS
// ============================================================================

/**
 * Retrieve available change alternatives for a request
 *
 * Returns list of:
 * - Available flights matching criteria
 * - Price differences (may include rebates or fees)
 * - Expiration times for each offer
 *
 * @param changeRequestId - Change request ID (from createOrderChangeRequest)
 * @returns Available alternatives with pricing
 */
export async function getOrderChangeOffers(
  changeRequestId: string,
): Promise<OrderChangeOffer[]> {
  try {
    console.log(
      "[OrderChange] Fetching offers for change request:",
      changeRequestId,
    );

    const result = await api.get<any>(
      `/api/admin/orders/change/offers?changeRequestId=${changeRequestId}`,
    );

    const offers = Array.isArray(result.data) ? result.data : result;

    console.log("[OrderChange] Offers retrieved:", offers.length);
    return offers;
  } catch (error) {
    console.error("[OrderChange] Get offers error:", error);
    throw error;
  }
}

// ============================================================================
// CREATE PENDING ORDER CHANGE
// ============================================================================

/**
 * Create a pending order change with a selected offer
 *
 * This step:
 * - Holds the offer for a temporary period
 * - Blocks other change requests on the order
 * - Prepares for final confirmation
 *
 * @param changeRequestId - Change request ID
 * @param selectedOfferId - Selected offer ID
 * @returns Pending change with confirmation token
 */
export async function createPendingOrderChange(
  changeRequestId: string,
  selectedOfferId: string,
): Promise<PendingOrderChange> {
  try {
    console.log("[OrderChange] Creating pending change:", {
      changeRequestId,
      selectedOfferId,
    });

    const result = await api.post<any>("/api/admin/orders/change/pending", {
      changeRequestId,
      selectedOfferId,
    });

    console.log("[OrderChange] Pending change created:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderChange] Create pending change error:", error);
    throw error;
  }
}

// ============================================================================
// CONFIRM ORDER CHANGE
// ============================================================================

/**
 * Confirm and finalize a pending order change
 *
 * This action:
 * - Commits the new flight assignment
 * - Processes any price differences
 * - Generates new order confirmation
 * - Sends updated itinerary to customer
 *
 * @param pendingChangeId - Pending change ID
 * @param paymentMethod - How to handle price difference (optional)
 * @returns Confirmed change with new order details
 */
export async function confirmOrderChange(
  pendingChangeId: string,
  paymentMethod?: "credit_card" | "airline_credit" | "refund",
): Promise<{
  id: string;
  status: "confirmed";
  newOrderId: string;
  priceAdjustment: number;
  currency: string;
  confirmationTime: string;
}> {
  try {
    console.log("[OrderChange] Confirming order change:", pendingChangeId);

    const result = await api.post<any>("/api/admin/orders/change/confirm", {
      pendingChangeId,
      paymentMethod: paymentMethod || "credit_card",
    });

    console.log("[OrderChange] Order change confirmed:", result);
    return result.data || result;
  } catch (error) {
    console.error("[OrderChange] Confirm change error:", error);
    throw error;
  }
}

/**
 * Reject a pending order change
 *
 * @param pendingChangeId - Pending change ID
 * @returns Rejection confirmation
 */
export async function rejectOrderChange(
  pendingChangeId: string,
  reason?: string,
): Promise<{ id: string; status: "rejected" }> {
  try {
    console.log("[OrderChange] Rejecting order change:", pendingChangeId);

    const result = await api.post<any>("/api/admin/orders/change/reject", {
      pendingChangeId,
      reason,
    });

    console.log("[OrderChange] Order change rejected");
    return result.data || result;
  } catch (error) {
    console.error("[OrderChange] Reject change error:", error);
    throw error;
  }
}

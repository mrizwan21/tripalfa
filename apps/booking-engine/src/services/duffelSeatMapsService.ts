/**
 * Duffel Seat Maps Service
 *
 * Handles seat map retrieval and processing for both booking and post-booking flows.
 * Implements Duffel API v2 specification.
 *
 * @see https://duffel.com/docs/api/v2/seat-maps/get-seat-maps
 */

import type { api as ApiClientInstance } from "../lib/apiClient";

// Lazy import to avoid circular dependency
type ApiClient = typeof ApiClientInstance;
let api: ApiClient | undefined;
function getApi() {
  if (!api) api = require("../lib/api").api as ApiClient;
  return api;
}

import type {
  DuffelSeatMap,
  DuffelGetSeatMapsResponse,
  DuffelSeatElement,
  DuffelCabinRowSectionElement,
  ProcessedSeatMap,
  FlattenedSeat,
  SelectedSeatForBooking,
  SeatSelectionPayload,
  DuffelCabinClass,
} from "../types/duffel-seat-maps";

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

export interface SeatMapServiceResponse {
  success: boolean;
  data?: {
    seatMaps: ProcessedSeatMap[];
    rawSeatMaps: DuffelSeatMap[];
    offerId?: string;
    orderId?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface SeatSelectionResponse {
  success: boolean;
  data?: {
    selectedSeats: SelectedSeatForBooking[];
    totalCost: number;
    currency: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// SEAT MAPS SERVICE CLASS
// ============================================================================

/**
 * Service for fetching and processing Duffel seat maps
 */
class DuffelSeatMapsService {
  /**
   * Get seat maps for an offer (booking flow)
   *
   * @param offerId - The offer ID to get seat maps for
   * @returns Processed seat maps ready for UI rendering
   */
  async getSeatMapsForOffer(offerId: string): Promise<SeatMapServiceResponse> {
    try {
      console.log("[DuffelSeatMaps] Fetching seat maps for offer:", offerId);

      // Validate offer ID
      if (
        !offerId ||
        typeof offerId !== "string" ||
        offerId.trim().length === 0
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_OFFER_ID",
            message: "Invalid offer ID format",
            details: {
              field: "offerId",
              hint: "Offer ID must be a non-empty string",
            },
          },
        };
      }

      // Call Duffel API through backend proxy
      const response = await getApi().get<DuffelGetSeatMapsResponse>(
        `/api/flights/seat-maps?offer_id=${encodeURIComponent(offerId)}`,
      );

      // Handle different response formats
      const seatMaps = this.extractSeatMaps(response);

      if (!seatMaps || seatMaps.length === 0) {
        console.log(
          "[DuffelSeatMaps] No seat maps available for offer:",
          offerId,
        );
        return {
          success: true,
          data: {
            seatMaps: [],
            rawSeatMaps: [],
            offerId,
          },
        };
      }

      // Process seat maps for UI rendering
      const processedSeatMaps = seatMaps.map((sm) => this.processSeatMap(sm));

      console.log(
        "[DuffelSeatMaps] Processed",
        processedSeatMaps.length,
        "seat maps",
      );

      return {
        success: true,
        data: {
          seatMaps: processedSeatMaps,
          rawSeatMaps: seatMaps,
          offerId,
        },
      };
    } catch (error: unknown) {
      console.error("[DuffelSeatMaps] Error fetching seat maps:", error);
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch seat maps",
        },
      };
    }
  }

  /**
   * Get seat maps for an order (post-booking flow)
   *
   * @param orderId - The order ID to get seat maps for
   * @returns Processed seat maps with current seat assignments
   */
  async getSeatMapsForOrder(orderId: string): Promise<SeatMapServiceResponse> {
    try {
      console.log("[DuffelSeatMaps] Fetching seat maps for order:", orderId);

      // Validate order ID
      if (
        !orderId ||
        typeof orderId !== "string" ||
        orderId.trim().length === 0
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_ORDER_ID",
            message: "Invalid order ID format",
            details: {
              field: "orderId",
              hint: "Order ID must be a non-empty string",
            },
          },
        };
      }

      // Call Duffel API through backend proxy
      const response = await getApi().get<DuffelGetSeatMapsResponse>(
        `/api/flights/seat-maps?order_id=${encodeURIComponent(orderId)}`,
      );

      // Handle different response formats
      const seatMaps = this.extractSeatMaps(response);

      if (!seatMaps || seatMaps.length === 0) {
        return {
          success: true,
          data: {
            seatMaps: [],
            rawSeatMaps: [],
            orderId,
          },
        };
      }

      // Process seat maps for UI rendering
      const processedSeatMaps = seatMaps.map((sm) => this.processSeatMap(sm));

      return {
        success: true,
        data: {
          seatMaps: processedSeatMaps,
          rawSeatMaps: seatMaps,
          orderId,
        },
      };
    } catch (error: unknown) {
      console.error(
        "[DuffelSeatMaps] Error fetching seat maps for order:",
        error,
      );
      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch seat maps",
        },
      };
    }
  }

  /**
   * Select seats for an order
   *
   * @param payload - Seat selection payload with offer ID and selected seats
   * @returns Confirmation of seat selection
   */
  async selectSeats(
    payload: SeatSelectionPayload,
  ): Promise<SeatSelectionResponse> {
    try {
      console.log("[DuffelSeatMaps] Selecting seats:", payload);

      const response = await getApi().post(
        "/api/flights/orders/select-seats",
        payload,
      );

      // Calculate total cost
      const totalCost = payload.seats.reduce(
        (sum, seat) => sum + seat.price,
        0,
      );
      const currency = payload.seats[0]?.currency || "USD";

      return {
        success: true,
        data: {
          selectedSeats: payload.seats,
          totalCost,
          currency,
        },
      };
    } catch (error: unknown) {
      console.error("[DuffelSeatMaps] Error selecting seats:", error);
      return {
        success: false,
        error: {
          code: "SELECTION_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to select seats",
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract seat maps from various response formats
   */
  private extractSeatMaps(response: unknown): DuffelSeatMap[] {
    if (!response) return [];

    // Handle { data: DuffelSeatMap[] } format
    if (typeof response === "object" && response !== null) {
      const resp = response as Record<string, unknown>;
      if (Array.isArray(resp.data)) {
        return resp.data as DuffelSeatMap[];
      }
      // Handle direct array format
      if (Array.isArray(resp)) {
        return resp as DuffelSeatMap[];
      }
      // Handle nested data.data format
      if (resp.data && typeof resp.data === "object") {
        const innerData = resp.data as Record<string, unknown>;
        if (Array.isArray(innerData.data)) {
          return innerData.data as DuffelSeatMap[];
        }
        if (Array.isArray(innerData.seat_maps)) {
          return innerData.seat_maps as DuffelSeatMap[];
        }
      }
      // Handle seat_maps directly
      if (Array.isArray(resp.seat_maps)) {
        return resp.seat_maps as DuffelSeatMap[];
      }
    }

    return [];
  }

  /**
   * Process a raw Duffel seat map into a UI-friendly format
   */
  private processSeatMap(seatMap: DuffelSeatMap): ProcessedSeatMap {
    const seats: FlattenedSeat[] = [];
    let totalRows = 0;

    // Process each cabin
    for (const cabin of seatMap.cabins) {
      const cabinRows = cabin.rows.length;
      totalRows += cabinRows;

      // Process each row
      for (let rowIndex = 0; rowIndex < cabin.rows.length; rowIndex++) {
        const row = cabin.rows[rowIndex];

        // Process each section (left, middle, right)
        for (
          let sectionIndex = 0;
          sectionIndex < row.sections.length;
          sectionIndex++
        ) {
          const section = row.sections[sectionIndex];

          // Process each element in the section
          for (
            let elementIndex = 0;
            elementIndex < section.elements.length;
            elementIndex++
          ) {
            const element = section.elements[elementIndex];

            // Only process seat elements
            if (element.type === "seat") {
              const seat = this.processSeatElement(
                element as DuffelSeatElement,
                rowIndex,
                sectionIndex,
                elementIndex,
                cabin.wings,
              );
              seats.push(seat);
            }
          }
        }
      }
    }

    // Get primary cabin info (first cabin)
    const primaryCabin = seatMap.cabins[0];

    return {
      raw: seatMap,
      segmentId: seatMap.segment_id,
      sliceId: seatMap.slice_id,
      seats,
      cabinClass: primaryCabin?.cabin_class ?? null,
      aisles: primaryCabin?.aisles ?? 1,
      deck: primaryCabin?.deck ?? 0,
      totalRows,
      wings: primaryCabin?.wings ?? null,
    };
  }

  /**
   * Process a single seat element into a flattened seat
   */
  private processSeatElement(
    element: DuffelSeatElement,
    rowIndex: number,
    sectionIndex: number,
    elementIndex: number,
    wings?: { first_row_index: number; last_row_index: number } | null,
  ): FlattenedSeat {
    const available =
      element.available_services && element.available_services.length > 0;
    const firstService = element.available_services?.[0];

    // Parse row number and column letter from designator
    const designator = element.designator;
    const rowNumber = parseInt(designator.match(/\d+/)?.[0] || "0", 10);
    const columnLetter = designator.match(/[A-Z]+/)?.[0] || "";

    // Check if seat is over wing
    const isOverWing = wings
      ? rowIndex >= wings.first_row_index && rowIndex <= wings.last_row_index
      : false;

    return {
      designator,
      available,
      price: firstService ? parseFloat(firstService.total_amount) : null,
      currency: firstService?.total_currency ?? null,
      serviceId: firstService?.id ?? null,
      passengerId: firstService?.passenger_id ?? null,
      name: element.name,
      disclosures: element.disclosures,
      isExitRow: element.name?.toLowerCase().includes("exit") ?? false,
      isOverWing,
      rowNumber,
      columnLetter,
      sectionIndex,
      elementIndex,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const duffelSeatMapsService = new DuffelSeatMapsService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an element is a seat element
 */
export function isSeatElement(
  element: DuffelCabinRowSectionElement,
): element is DuffelSeatElement {
  return element.type === "seat";
}

/**
 * Get all available seats from a processed seat map
 */
export function getAvailableSeats(seatMap: ProcessedSeatMap): FlattenedSeat[] {
  return seatMap.seats.filter((seat) => seat.available);
}

/**
 * Get seats by row number
 */
function getSeatsByRow(
  seatMap: ProcessedSeatMap,
  rowNumber: number,
): FlattenedSeat[] {
  return seatMap.seats.filter((seat) => seat.rowNumber === rowNumber);
}

/**
 * Get seats by section index
 */
function getSeatsBySection(
  seatMap: ProcessedSeatMap,
  sectionIndex: number,
): FlattenedSeat[] {
  return seatMap.seats.filter((seat) => seat.sectionIndex === sectionIndex);
}

/**
 * Calculate total cost for selected seats
 */
export function calculateTotalSeatCost(seats: FlattenedSeat[]): {
  total: number;
  currency: string | null;
} {
  const total = seats.reduce((sum, seat) => sum + (seat.price ?? 0), 0);
  const currency = seats[0]?.currency ?? null;
  return { total, currency };
}

/**
 * Group seats by row for rendering
 */
export function groupSeatsByRow(
  seatMap: ProcessedSeatMap,
): Map<number, FlattenedSeat[]> {
  const grouped = new Map<number, FlattenedSeat[]>();

  for (const seat of seatMap.seats) {
    const existing = grouped.get(seat.rowNumber) ?? [];
    existing.push(seat);
    grouped.set(seat.rowNumber, existing);
  }

  // Sort seats within each row by section and element index
  for (const [, seats] of grouped) {
    seats.sort((a, b) => {
      if (a.sectionIndex !== b.sectionIndex) {
        return a.sectionIndex - b.sectionIndex;
      }
      return a.elementIndex - b.elementIndex;
    });
  }

  return grouped;
}

/**
 * Get the seat pattern for a cabin (e.g., "3-3" or "3-4-3")
 */
export function getSeatPattern(seatMap: ProcessedSeatMap): string {
  const { aisles } = seatMap;

  // Get a sample row to determine pattern
  const groupedByRow = groupSeatsByRow(seatMap);
  const firstRow = groupedByRow.values().next().value;

  if (!firstRow) return aisles === 1 ? "3-3" : "3-4-3";

  // Count seats per section
  const sectionCounts: number[] = [];
  let currentSection = firstRow[0]?.sectionIndex ?? 0;
  let count = 0;

  for (const seat of firstRow) {
    if (seat.sectionIndex !== currentSection) {
      sectionCounts.push(count);
      currentSection = seat.sectionIndex;
      count = 1;
    } else {
      count++;
    }
  }
  sectionCounts.push(count);

  return sectionCounts.join("-");
}

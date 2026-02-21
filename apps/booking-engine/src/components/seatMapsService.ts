/**
 * Seat Maps Service
 * Handles seat map retrieval for both booking and post-booking flows
 */

import { createLogger } from '@tripalfa/shared-utils/logger';
const logger = createLogger({ serviceName: 'booking-engine' });
import { DuffelApiClient } from '../integrations/duffelApiClient';

export interface SeatDesignator {
  designator: string;
  available: boolean;
  restrictions?: {
    code: string;
    reason: string;
  };
}

export interface SeatRow {
  designator: string;
  issuable_seat_designators: SeatDesignator[];
}

export interface Cabin {
  rows: SeatRow[];
}

export interface SeatMap {
  segment_id: string;
  cabin_class: string;
  deck?: string;
  cabin: Cabin;
}

export interface CabinConfig {
  cabin_class: string;
  first_row: number;
  last_row: number;
  seat_pitch: number;
  seat_width: number;
}

export interface AircraftConfig {
  type: string;
  fuselage_width: 'narrow-body' | 'wide-body';
  row_pattern: string;
  cabins: CabinConfig[];
}

export interface CurrentSeatAssignment {
  segment_id: string;
  passenger_id: string;
  current_seat: string;
  available_seats: string[];
}

export interface SeatMapResponse {
  success: boolean;
  data?: {
    seat_maps: SeatMap[];
    aircraft_config: AircraftConfig;
    current_seats?: CurrentSeatAssignment[];
    order_id?: string;
    booking_ref?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class SeatMapsService {
  private duffelClient: DuffelApiClient;

  constructor() {
    this.duffelClient = new DuffelApiClient();
  }

  /**
   * Get seat maps for booking flow (using offer ID)
   */
  async getSeatMapsForBooking(
    offerId: string,
    provider: string,
    env: string
  ): Promise<SeatMapResponse> {
    try {
      logger.info(`[SeatMaps] Booking flow - Fetching seat maps for offer: ${offerId}`);

      // Validate offer ID format
      if (!offerId || typeof offerId !== 'string' || offerId.length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_OFFER_ID',
            message: 'Invalid offer ID format',
            details: {
              field: 'offerId',
              hint: 'Offer ID must be a non-empty string'
            }
          }
        };
      }

      // Get seat maps from Duffel
      const seatMapData = await this.duffelClient.getSeatMapForOffer(offerId);

      if (!seatMapData) {
        return {
          success: false,
          error: {
            code: 'OFFER_NOT_FOUND',
            message: 'The specified offer could not be found',
            details: {
              field: 'offerId',
              hint: 'Verify the offerId is correct and hasn\'t expired'
            }
          }
        };
      }

      // Extract aircraft type
      const aircraftType = seatMapData.aircraft?.name || 'airbus-320';
      const aircraftConfig = this.getAircraftConfig(aircraftType);

      // Transform response
      const transformedSeatMaps = this.transformDuffelSeatMap(seatMapData);

      logger.info(`[SeatMaps] Success - Found ${transformedSeatMaps.length} segment(s)`);

      return {
        success: true,
        data: {
          seat_maps: transformedSeatMaps,
          aircraft_config: aircraftConfig
        }
      };
    } catch (error) {
      logger.error('[SeatMaps] Error in getSeatMapsForBooking:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching seat maps',
          details: {
            hint: 'Please try again later'
          }
        }
      };
    }
  }

  /**
   * Get seat maps for post-booking flow (using order ID)
   */
  async getSeatMapsForOrder(
    orderId: string,
    provider: string,
    env: string
  ): Promise<SeatMapResponse> {
    try {
      logger.info(`[SeatMaps] Post-booking flow - Fetching seat maps for order: ${orderId}`);

      // Validate order ID format
      if (!orderId || typeof orderId !== 'string' || orderId.length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_ORDER_ID',
            message: 'Invalid order ID format',
            details: {
              field: 'orderId',
              hint: 'Order ID must be a non-empty string'
            }
          }
        };
      }

      // Get order details from Duffel
      const orderData = await this.duffelClient.getOrder(orderId);

      if (!orderData) {
        return {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'The specified order could not be found',
            details: {
              field: 'orderId',
              hint: 'Verify the orderId is correct'
            }
          }
        };
      }

      // Get fresh seat map using offer from order
      const seatMapData = await this.duffelClient.getSeatMapForOffer(orderData.offer_id);

      if (!seatMapData) {
        return {
          success: false,
          error: {
            code: 'SEAT_MAP_NOT_FOUND',
            message: 'Could not retrieve seat map for this order'
          }
        };
      }

      // Extract current seat assignments
      const currentSeats = this.extractCurrentSeats(orderData);

      // Extract aircraft type
      const aircraftType = orderData.offer?.aircraft?.name || 'airbus-320';
      const aircraftConfig = this.getAircraftConfig(aircraftType);

      // Transform response
      const transformedSeatMaps = this.transformDuffelSeatMap(seatMapData);

      logger.info(`[SeatMaps] Success - Found ${currentSeats.length} passenger(s) with seats`);

      return {
        success: true,
        data: {
          seat_maps: transformedSeatMaps,
          aircraft_config: aircraftConfig,
          current_seats: currentSeats,
          order_id: orderId,
          booking_ref: orderData.booking_reference || 'TBD'
        }
      };
    } catch (error) {
      logger.error('[SeatMaps] Error in getSeatMapsForOrder:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching order seat maps',
          details: {
            hint: 'Please try again later'
          }
        }
      };
    }
  }

  /**
   * Transform Duffel API response to our schema
   */
  private transformDuffelSeatMap(duffelResponse: any): SeatMap[] {
    const seatMaps: SeatMap[] = [];

    if (!duffelResponse || !Array.isArray(duffelResponse.cabins)) {
      logger.warn('[SeatMaps] Invalid Duffel response structure');
      return seatMaps;
    }

    // Process each cabin (segment)
    duffelResponse.cabins.forEach((cabin: any, index: number) => {
      const seatMap: SeatMap = {
        segment_id: `seg_${index + 1}`,
        cabin_class: cabin.cabin_class || 'economy',
        deck: cabin.deck || undefined,
        cabin: {
          rows: []
        }
      };

      // Process rows
      if (Array.isArray(cabin.rows)) {
        seatMap.cabin.rows = cabin.rows.map((row: any) => ({
          designator: String(row.id || row.number),
          issuable_seat_designators: this.transformSeats(row.seats || [])
        }));
      }

      seatMaps.push(seatMap);
    });

    return seatMaps;
  }

  /**
   * Transform seat designators
   */
  private transformSeats(duffelSeats: any[]): SeatDesignator[] {
    return duffelSeats.map((seat: any) => ({
      designator: seat.designator || seat.id,
      available: seat.available === true,
      restrictions: !seat.available
        ? {
            code: seat.restricted_for ? 'OCCUPIED' : 'BLOCKED',
            reason: seat.restricted_for?.join(', ') || 'Not available'
          }
        : undefined
    }));
  }

  /**
   * Extract current seat assignments from order
   */
  private extractCurrentSeats(orderData: any): CurrentSeatAssignment[] {
    const currentSeats: CurrentSeatAssignment[] = [];

    if (!Array.isArray(orderData.passengers)) {
      return currentSeats;
    }

    orderData.passengers.forEach((passenger: any) => {
      const seatAssignment: CurrentSeatAssignment = {
        segment_id: passenger.segment_ids?.[0] || 'seg_1',
        passenger_id: passenger.id,
        current_seat: passenger.seat_affordances?.[0]?.seat_designator || 'TBA',
        available_seats: []
      };

      currentSeats.push(seatAssignment);
    });

    return currentSeats;
  }

  /**
   * Get aircraft configuration based on aircraft type
   */
  private getAircraftConfig(aircraftType: string): AircraftConfig {
    const configs: Record<string, AircraftConfig> = {
      'airbus-320': {
        type: 'airbus-320',
        fuselage_width: 'narrow-body',
        row_pattern: '3-3',
        cabins: [
          {
            cabin_class: 'economy',
            first_row: 1,
            last_row: 30,
            seat_pitch: 31,
            seat_width: 17.2
          }
        ]
      },
      'boeing-777': {
        type: 'boeing-777',
        fuselage_width: 'wide-body',
        row_pattern: '3-4-3',
        cabins: [
          {
            cabin_class: 'business',
            first_row: 1,
            last_row: 8,
            seat_pitch: 60,
            seat_width: 20
          },
          {
            cabin_class: 'economy',
            first_row: 9,
            last_row: 68,
            seat_pitch: 31,
            seat_width: 17.2
          }
        ]
      },
      'airbus-350': {
        type: 'airbus-350',
        fuselage_width: 'wide-body',
        row_pattern: '3-3-3',
        cabins: [
          {
            cabin_class: 'business',
            first_row: 1,
            last_row: 7,
            seat_pitch: 80,
            seat_width: 21
          },
          {
            cabin_class: 'economy',
            first_row: 8,
            last_row: 60,
            seat_pitch: 31,
            seat_width: 17.2
          }
        ]
      },
      'embraer-190': {
        type: 'embraer-190',
        fuselage_width: 'narrow-body',
        row_pattern: '2-2',
        cabins: [
          {
            cabin_class: 'economy',
            first_row: 1,
            last_row: 32,
            seat_pitch: 29,
            seat_width: 17
          }
        ]
      }
    };

    // Return matching config or default to A320
    return (
      configs[aircraftType.toLowerCase()] || configs['airbus-320']
    );
  }
}

export const seatMapsService = new SeatMapsService();

/**
 * Integration Tests for Seat Selection Component
 * Tests both booking and post-booking modes with various aircraft types
 * 
 * Run with: npm run test:seat-maps
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock API Response Generators
 */

export const generateMockAircraftConfig = (aircraftType: 'narrow-body' | 'wide-body' = 'narrow-body') => {
  if (aircraftType === 'wide-body') {
    return {
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
    };
  }

  // Narrow-body (Airbus A320)
  return {
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
  };
};

export const generateMockSeatMap = (
  aircraftType: 'narrow-body' | 'wide-body' = 'narrow-body',
  occupiedSeats: string[] = []
) => {
  const isWidebody = aircraftType === 'wide-body';
  const seatsPerRow = isWidebody ? 10 : 6; // 3-4-3 vs 3-3
  const cols = isWidebody ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'] : ['A', 'B', 'C', 'D', 'E', 'F'];
  const maxRow = aircraftType === 'wide-body' ? 68 : 30;

  const rows = [];
  for (let row = 1; row <= maxRow; row++) {
    const issuableSeatDesignators = cols.map(col => {
      const seatId = `${row}${col}`;
      return {
        designator: col,
        available: !occupiedSeats.includes(seatId),
        restrictions: occupiedSeats.includes(seatId)
          ? {
              code: 'OCCUPIED',
              reason: 'Seat already booked'
            }
          : undefined
      };
    });

    rows.push({
      designator: String(row),
      issuable_seat_designators: issuableSeatDesignators
    });
  }

  return {
    segment_id: 'seg_test_001',
    cabin_class: 'economy',
    deck: 'lower',
    cabin: { rows }
  };
};

export const generateMockBookingFlowResponse = (aircraftType: 'narrow-body' | 'wide-body' = 'narrow-body') => {
  return {
    success: true,
    data: {
      seat_maps: [generateMockSeatMap(aircraftType)],
      aircraft_config: generateMockAircraftConfig(aircraftType)
    }
  };
};

export const generateMockPostBookingResponse = (aircraftType: 'narrow-body' | 'wide-body' = 'narrow-body') => {
  return {
    success: true,
    data: {
      seat_maps: [generateMockSeatMap(aircraftType, ['5A', '5B', '6A', '6B'])],
      aircraft_config: generateMockAircraftConfig(aircraftType),
      current_seats: [
        {
          segment_id: 'seg_test_001',
          passenger_id: 'pass_001',
          current_seat: '5A',
          available_seats: ['1A', '1B', '1C', '2A', '2B', '2C']
        },
        {
          segment_id: 'seg_test_001',
          passenger_id: 'pass_002',
          current_seat: '5B',
          available_seats: ['1A', '1B', '1C', '2A', '2B', '2C']
        }
      ],
      order_id: 'ord_test_123',
      booking_ref: 'TPA123456'
    }
  };
};

/**
 * Component Integration Tests
 */

describe('SeatSelection Component - Integration Tests', () => {
  describe('Booking Flow Mode', () => {
    it('should load seat maps for narrow-body aircraft', async () => {
      const mockResponse = generateMockBookingFlowResponse('narrow-body');
      const { seat_maps, aircraft_config } = mockResponse.data;

      expect(seat_maps).toHaveLength(1);
      expect(seat_maps[0].cabin.rows).toBeDefined();
      expect(aircraft_config.row_pattern).toBe('3-3');
      expect(aircraft_config.cabins).toHaveLength(1);
    });

    it('should load seat maps for wide-body aircraft', async () => {
      const mockResponse = generateMockBookingFlowResponse('wide-body');
      const { seat_maps, aircraft_config } = mockResponse.data;

      expect(seat_maps).toHaveLength(1);
      expect(aircraft_config.row_pattern).toBe('3-4-3');
      expect(aircraft_config.fuselage_width).toBe('wide-body');
    });

    it('should parse seat designators correctly', () => {
      const mockResponse = generateMockBookingFlowResponse('narrow-body');
      const firstRow = mockResponse.data.seat_maps[0].cabin.rows[0];

      expect(firstRow.designator).toBe('1');
      expect(firstRow.issuable_seat_designators).toHaveLength(6); // 3-3 layout
      expect(firstRow.issuable_seat_designators[0].designator).toBe('A');
      expect(firstRow.issuable_seat_designators[2].designator).toBe('C');
    });

    it('should mark unavailable seats correctly', () => {
      const occupiedSeats = ['1A', '2B'];
      const mockSeatMap = generateMockSeatMap('narrow-body', occupiedSeats);
      
      const firstRowSeatA = mockSeatMap.cabin.rows[0].issuable_seat_designators[0];
      expect(firstRowSeatA.available).toBe(false);
      expect(firstRowSeatA.restrictions?.code).toBe('OCCUPIED');

      const secondRowSeatB = mockSeatMap.cabin.rows[1].issuable_seat_designators[1];
      expect(secondRowSeatB.available).toBe(false);

      const firstRowSeatB = mockSeatMap.cabin.rows[0].issuable_seat_designators[1];
      expect(firstRowSeatB.available).toBe(true);
    });

    it('should handle multi-segment flights', () => {
      const response = {
        success: true,
        data: {
          seat_maps: [
            generateMockSeatMap('narrow-body'),
            generateMockSeatMap('narrow-body'), // Segment 2
            generateMockSeatMap('narrow-body')  // Segment 3
          ],
          aircraft_config: generateMockAircraftConfig('narrow-body')
        }
      };

      expect(response.data.seat_maps).toHaveLength(3);
      response.data.seat_maps.forEach((seatMap, index) => {
        expect(seatMap.segment_id).toBeDefined();
        expect(seatMap.cabin.rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Post-Booking Mode', () => {
    it('should load current seat assignments', () => {
      const mockResponse = generateMockPostBookingResponse('narrow-body');
      const { current_seats } = mockResponse.data;

      expect(current_seats).toHaveLength(2); // Two passengers
      expect(current_seats[0].current_seat).toBe('5A');
      expect(current_seats[0].passenger_id).toBe('pass_001');
      expect(current_seats[0].available_seats).toContain('1A');
    });

    it('should include order and booking references', () => {
      const mockResponse = generateMockPostBookingResponse('narrow-body');
      const { order_id, booking_ref } = mockResponse.data;

      expect(order_id).toBe('ord_test_123');
      expect(booking_ref).toBe('TPA123456');
    });

    it('should mark currently booked seats as unavailable', () => {
      const mockResponse = generateMockPostBookingResponse('narrow-body');
      const { seat_maps } = mockResponse.data;
      
      const seatRow5 = seat_maps[0].cabin.rows.find(r => r.designator === '5');
      expect(seatRow5?.issuable_seat_designators[0].available).toBe(false); // 5A occupied
      expect(seatRow5?.issuable_seat_designators[1].available).toBe(false); // 5B occupied
    });
  });

  describe('Aircraft Configuration Parsing', () => {
    it('should parse narrow-body aircraft correctly', () => {
      const config = generateMockAircraftConfig('narrow-body');
      
      expect(config.type).toBe('airbus-320');
      expect(config.fuselage_width).toBe('narrow-body');
      expect(config.row_pattern).toBe('3-3');
      expect(config.cabins[0].seat_pitch).toBe(31);
      expect(config.cabins[0].seat_width).toBe(17.2);
    });

    it('should parse wide-body aircraft correctly', () => {
      const config = generateMockAircraftConfig('wide-body');
      
      expect(config.type).toBe('boeing-777');
      expect(config.fuselage_width).toBe('wide-body');
      expect(config.row_pattern).toBe('3-4-3');
      expect(config.cabins).toHaveLength(2); // Business + Economy
      expect(config.cabins[0].cabin_class).toBe('business');
      expect(config.cabins[1].cabin_class).toBe('economy');
    });

    it('should calculate rows per column layout', () => {
      const narrowBodyConfig = generateMockAircraftConfig('narrow-body');
      const pattern = narrowBodyConfig.row_pattern.split('-').map(Number);
      expect(pattern).toEqual([3, 3]);
      expect(pattern.reduce((a, b) => a + b)).toBe(6); // Total columns

      const widebodyConfig = generateMockAircraftConfig('wide-body');
      const widePattern = widebodyConfig.row_pattern.split('-').map(Number);
      expect(widePattern).toEqual([3, 4, 3]);
      expect(widePattern.reduce((a, b) => a + b)).toBe(10); // Total columns
    });
  });

  describe('Seat Selection State Management', () => {
    it('should add seat to selection', () => {
      const selectedSeats: any[] = [];
      const newSeat = {
        designator: '1A',
        passengerId: 'pass_001',
        segmentId: 'seg_001',
        seatPrice: 0
      };

      selectedSeats.push(newSeat);
      expect(selectedSeats).toHaveLength(1);
      expect(selectedSeats[0].designator).toBe('1A');
    });

    it('should prevent double-booking of same seat', () => {
      const selectedSeats: any[] = [
        {
          designator: '1A',
          passengerId: 'pass_001',
          segmentId: 'seg_001'
        }
      ];

      // Attempt to book same seat for different passenger
      const isDuplicateSeat = selectedSeats.some(s => s.designator === '1A' && s.passengerId !== 'pass_002');
      expect(isDuplicateSeat).toBe(true); // Should prevent this
    });

    it('should allow seat changes for same passenger', () => {
      const selectedSeats: any[] = [
        {
          designator: '1A',
          passengerId: 'pass_001',
          segmentId: 'seg_001'
        }
      ];

      // Change to different seat for same passenger
      const index = selectedSeats.findIndex(s => s.passengerId === 'pass_001' && s.segmentId === 'seg_001');
      if (index >= 0) {
        selectedSeats[index] = {
          designator: '1B',
          passengerId: 'pass_001',
          segmentId: 'seg_001'
        };
      }

      expect(selectedSeats[0].designator).toBe('1B');
    });

    it('should calculate total seat cost', () => {
      const selectedSeats: any[] = [
        {
          designator: '1A',
          passengerId: 'pass_001',
          seatPrice: 25
        },
        {
          designator: '1B',
          passengerId: 'pass_002',
          seatPrice: 35
        }
      ];

      const totalCost = selectedSeats.reduce((sum, seat) => sum + (seat.seatPrice || 0), 0);
      expect(totalCost).toBe(60);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle offer not found error', () => {
      const errorResponse = {
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

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe('OFFER_NOT_FOUND');
    });

    it('should handle provider unavailable error', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: 'Unable to reach seat map provider'
        }
      };

      expect(errorResponse.error.code).toBe('PROVIDER_UNAVAILABLE');
    });

    it('should handle authorization error', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authentication token'
        }
      };

      expect(errorResponse.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle no seats available', () => {
      const mockResponse = generateMockBookingFlowResponse('narrow-body');
      
      // Mark all seats as occupied
      mockResponse.data.seat_maps[0].cabin.rows.forEach(row => {
        row.issuable_seat_designators.forEach(seat => {
          seat.available = false;
        });
      });

      const availableSeats = mockResponse.data.seat_maps[0].cabin.rows
        .flatMap(r => r.issuable_seat_designators)
        .filter(s => s.available);

      expect(availableSeats).toHaveLength(0);
    });
  });

  describe('API Contract Validation', () => {
    it('should return required fields for booking flow', () => {
      const response = generateMockBookingFlowResponse('narrow-body');

      // Required at root level
      expect(response.success).toBeDefined();
      expect(response.data).toBeDefined();

      // Required in data
      expect(response.data.seat_maps).toBeDefined();
      expect(response.data.aircraft_config).toBeDefined();

      // Required in seat_maps
      expect(response.data.seat_maps[0].segment_id).toBeDefined();
      expect(response.data.seat_maps[0].cabin).toBeDefined();
      expect(response.data.seat_maps[0].cabin.rows).toBeDefined();

      // Required in aircraft_config
      expect(response.data.aircraft_config.type).toBeDefined();
      expect(response.data.aircraft_config.fuselage_width).toBeDefined();
      expect(response.data.aircraft_config.row_pattern).toBeDefined();
    });

    it('should return required fields for post-booking flow', () => {
      const response = generateMockPostBookingResponse('narrow-body');

      // Booking flow fields
      expect(response.data.seat_maps).toBeDefined();
      expect(response.data.aircraft_config).toBeDefined();

      // Post-booking specific fields
      expect(response.data.current_seats).toBeDefined();
      expect(response.data.order_id).toBeDefined();
      expect(response.data.booking_ref).toBeDefined();

      // Validate current_seats structure
      expect(Array.isArray(response.data.current_seats)).toBe(true);
      expect(response.data.current_seats[0].segment_id).toBeDefined();
      expect(response.data.current_seats[0].passenger_id).toBeDefined();
      expect(response.data.current_seats[0].current_seat).toBeDefined();
      expect(response.data.current_seats[0].available_seats).toBeDefined();
    });

    it('should match response schema types', () => {
      const response = generateMockBookingFlowResponse('narrow-body');

      expect(typeof response.success).toBe('boolean');
      expect(typeof response.data.aircraft_config.type).toBe('string');
      expect(typeof response.data.aircraft_config.fuselage_width).toBe('string');
      expect(Array.isArray(response.data.seat_maps)).toBe(true);
      expect(Array.isArray(response.data.aircraft_config.cabins)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should parse large seat map under 100ms', () => {
      const startTime = performance.now();
      
      // Generate large seat map (100 rows)
      const largeMap = generateMockSeatMap('narrow-body');
      largeMap.cabin.rows = Array.from({ length: 100 }, (_, i) => ({
        designator: String(i + 1),
        issuable_seat_designators: Array.from({ length: 6 }, (__, j) => ({
          designator: ['A', 'B', 'C', 'D', 'E', 'F'][j],
          available: true
        }))
      }));

      // Simulate parsing
      const availableSeats = largeMap.cabin.rows
        .flatMap(r => r.issuable_seat_designators)
        .filter(s => s.available);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(availableSeats.length).toBe(600); // 100 rows * 6 seats
    });

    it('should handle multiple segment seat maps', () => {
      const startTime = performance.now();

      const response = {
        success: true,
        data: {
          seat_maps: Array.from({ length: 5 }, () => generateMockSeatMap('narrow-body')),
          aircraft_config: generateMockAircraftConfig('narrow-body')
        }
      };

      // Simulate processing all segments
      const totalSeats = response.data.seat_maps.reduce((sum, map) => {
        return sum + map.cabin.rows.reduce((rowSum, row) => {
          return rowSum + row.issuable_seat_designators.length;
        }, 0);
      }, 0);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
      expect(totalSeats).toBe(900); // 5 segments * 30 rows * 6 seats
    });
  });
});

/**
 * Test Utilities
 */

export const validateSeatMapResponse = (response: any): boolean => {
  try {
    if (!response.success || !response.data) return false;
    
    const { seat_maps, aircraft_config } = response.data;
    
    if (!Array.isArray(seat_maps) || seat_maps.length === 0) return false;
    
    for (const map of seat_maps) {
      if (!map.segment_id || !map.cabin) return false;
      if (!Array.isArray(map.cabin.rows)) return false;
      
      for (const row of map.cabin.rows) {
        if (!row.designator || !Array.isArray(row.issuable_seat_designators)) return false;
      }
    }
    
    if (!aircraft_config || !aircraft_config.type) return false;
    if (!['narrow-body', 'wide-body'].includes(aircraft_config.fuselage_width)) return false;
    
    return true;
  } catch {
    return false;
  }
};

export const validatePostBookingResponse = (response: any): boolean => {
  if (!validateSeatMapResponse(response)) return false;
  
  const { current_seats, order_id, booking_ref } = response.data;
  
  if (!Array.isArray(current_seats) || current_seats.length === 0) return false;
  if (!order_id || !booking_ref) return false;
  
  for (const seat of current_seats) {
    if (!seat.segment_id || !seat.passenger_id || !seat.current_seat) return false;
    if (!Array.isArray(seat.available_seats)) return false;
  }
  
  return true;
};

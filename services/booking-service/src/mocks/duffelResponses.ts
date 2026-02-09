/**
 * Mock Duffel API Responses
 * For local development and testing without actual API calls
 */

export const mockDuffelSeatMapResponse = {
  data: {
    id: 'seatmap_00007ZiY9N4mTK0K',
    aircraft: {
      name: 'airbus-320',
      iata_code: 'A20'
    },
    cabin_class: 'economy',
    rows: [
      {
        designator: '1',
        issuable_seat_designators: [
          { designator: '1A', available: true },
          { designator: '1B', available: true },
          { designator: '1C', available: false, restrictions: { code: 'WHEELCHAIR_ZONE', reason: 'Wheelchair accessibility zone' } },
          { designator: '1D', available: true },
          { designator: '1E', available: true },
          { designator: '1F', available: true }
        ]
      },
      {
        designator: '2',
        issuable_seat_designators: [
          { designator: '2A', available: true },
          { designator: '2B', available: false },
          { designator: '2C', available: true },
          { designator: '2D', available: true },
          { designator: '2E', available: true },
          { designator: '2F', available: true }
        ]
      },
      {
        designator: '3',
        issuable_seat_designators: [
          { designator: '3A', available: true },
          { designator: '3B', available: true },
          { designator: '3C', available: true },
          { designator: '3D', available: true },
          { designator: '3E', available: true },
          { designator: '3F', available: false, restrictions: { code: 'EMERGENCY_EXIT', reason: 'Emergency exit row' } }
        ]
      },
      {
        designator: '4',
        issuable_seat_designators: [
          { designator: '4A', available: false, restrictions: { code: 'BLOCKED', reason: 'Maintenance' } },
          { designator: '4B', available: true },
          { designator: '4C', available: true },
          { designator: '4D', available: true },
          { designator: '4E', available: true },
          { designator: '4F', available: true }
        ]
      }
    ]
  }
};

export const mockDuffelOrderResponse = {
  data: {
    id: 'ord_00007XiY9N4mTK0K',
    passengers: [
      {
        id: 'pas_00007ZiY9N4mTK0K',
        first_name: 'John',
        last_name: 'Doe',
        seat_selections: [
          {
            id: 'sesel_00007ZiY9N4mTK0K',
            segment: {
              id: 'seg_00007ZiY9N4mTK0K'
            },
            seat: {
              designator: '2A'
            }
          }
        ]
      },
      {
        id: 'pas_00007XiY9N4mTK0L',
        first_name: 'Jane',
        last_name: 'Doe',
        seat_selections: [
          {
            id: 'sesel_00007XiY9N4mTK0L',
            segment: {
              id: 'seg_00007ZiY9N4mTK0K'
            },
            seat: {
              designator: '2B'
            }
          }
        ]
      }
    ],
    segments: [
      {
        id: 'seg_00007ZiY9N4mTK0K',
        operating_carrier: {
          iata_code: 'BA'
        },
        aircraft: {
          name: 'airbus-320',
          iata_code: 'A20'
        },
        origin_airport: {
          iata_code: 'LHR'
        },
        destination_airport: {
          iata_code: 'CDG'
        }
      }
    ]
  }
};

export const mockSeatMapResponse = {
  success: true,
  data: {
    seat_maps: [
      {
        segment_id: 'seg_00007ZiY9N4mTK0K',
        cabin_class: 'economy',
        cabin: {
          rows: [
            {
              designator: '1',
              issuable_seat_designators: [
                { designator: '1A', available: true },
                { designator: '1B', available: true },
                { designator: '1C', available: false, restrictions: { code: 'WHEELCHAIR_ZONE', reason: 'Wheelchair accessibility zone' } },
                { designator: '1D', available: true },
                { designator: '1E', available: true },
                { designator: '1F', available: true }
              ]
            },
            {
              designator: '2',
              issuable_seat_designators: [
                { designator: '2A', available: true },
                { designator: '2B', available: false },
                { designator: '2C', available: true },
                { designator: '2D', available: true },
                { designator: '2E', available: true },
                { designator: '2F', available: true }
              ]
            },
            {
              designator: '3',
              issuable_seat_designators: [
                { designator: '3A', available: true },
                { designator: '3B', available: true },
                { designator: '3C', available: true },
                { designator: '3D', available: true },
                { designator: '3E', available: true },
                { designator: '3F', available: false, restrictions: { code: 'EMERGENCY_EXIT', reason: 'Emergency exit row' } }
              ]
            },
            {
              designator: '4',
              issuable_seat_designators: [
                { designator: '4A', available: false, restrictions: { code: 'BLOCKED', reason: 'Maintenance' } },
                { designator: '4B', available: true },
                { designator: '4C', available: true },
                { designator: '4D', available: true },
                { designator: '4E', available: true },
                { designator: '4F', available: true }
              ]
            }
          ]
        }
      }
    ],
    aircraft_config: {
      type: 'airbus-320',
      fuselage_width: 'narrow-body',
      row_pattern: 'A B C | D E F',
      cabins: [
        {
          cabin_class: 'economy',
          first_row: 1,
          last_row: 30,
          seat_pitch: 31,
          seat_width: 17.2
        }
      ]
    }
  }
};

export const mockCurrentSeatsResponse = {
  success: true,
  data: {
    seat_maps: [
      {
        segment_id: 'seg_00007ZiY9N4mTK0K',
        cabin_class: 'economy',
        cabin: {
          rows: [
            {
              designator: '1',
              issuable_seat_designators: [
                { designator: '1A', available: true },
                { designator: '1B', available: true },
                { designator: '1C', available: false },
                { designator: '1D', available: true },
                { designator: '1E', available: true },
                { designator: '1F', available: true }
              ]
            },
            {
              designator: '2',
              issuable_seat_designators: [
                { designator: '2A', available: false }, // Current seat
                { designator: '2B', available: false }, // Current seat
                { designator: '2C', available: true },
                { designator: '2D', available: true },
                { designator: '2E', available: true },
                { designator: '2F', available: true }
              ]
            }
          ]
        }
      }
    ],
    aircraft_config: {
      type: 'airbus-320',
      fuselage_width: 'narrow-body',
      row_pattern: 'A B C | D E F',
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
    current_seats: [
      {
        segment_id: 'seg_00007ZiY9N4mTK0K',
        passenger_id: 'pas_00007ZiY9N4mTK0K',
        current_seat: '2A',
        available_seats: ['1A', '1B', '1D', '1E', '1F', '2C', '2D', '2E', '2F', '3A', '3B', '3C', '3D', '3E']
      },
      {
        segment_id: 'seg_00007ZiY9N4mTK0K',
        passenger_id: 'pas_00007XiY9N4mTK0L',
        current_seat: '2B',
        available_seats: ['1A', '1B', '1D', '1E', '1F', '2C', '2D', '2E', '2F', '3A', '3B', '3C', '3D', '3E']
      }
    ],
    order_id: 'ord_00007XiY9N4mTK0K',
    booking_ref: 'BA123456'
  }
};

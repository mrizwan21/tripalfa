import { describe, bench } from 'vitest';

/**
 * Booking Orchestration Performance Benchmarks
 * Critical path: Flight search → Availability check → Booking → Confirmation
 */

describe('Booking Service Performance', () => {
  const simulateFlightSearch = async (criteria: { from: string; to: string; date: string }) => {
    // Simulate querying multiple suppliers (Duffel, LiteAPI, etc.)
    await new Promise((res) => setTimeout(res, Math.random() * 300 + 100));

    return {
      flightId: `flight_${Date.now()}`,
      from: criteria.from,
      to: criteria.to,
      date: criteria.date,
      availableFlights: Math.floor(Math.random() * 10) + 5,
      searchTime: Date.now(),
    };
  };

  const simulateAvailabilityCheck = async (flightId: string) => {
    // Check real-time availability from supplier
    await new Promise((res) => setTimeout(res, Math.random() * 150 + 50));

    return {
      flightId,
      available: Math.random() > 0.1, // 90% availability
      seatsRemaining: Math.floor(Math.random() * 50) + 10,
      lastUpdated: new Date(),
    };
  };

  const simulateBookingCreation = async (flightId: string, passengers: number) => {
    // Create booking record
    await new Promise((res) => setTimeout(res, Math.random() * 100 + 30));

    return {
      bookingId: `bk_${Date.now()}`,
      flightId,
      passengers,
      status: 'pending',
      createdAt: new Date(),
    };
  };

  const simulateBookingConfirmation = async (bookingId: string) => {
    // Confirm with supplier and update payment
    await new Promise((res) => setTimeout(res, Math.random() * 200 + 100));

    return {
      bookingId,
      confirmationCode: `CONF${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: 'confirmed',
      confirmedAt: new Date(),
    };
  };

  bench('Flight Search (single supplier)', async () => {
    await simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' });
  });

  bench('Availability Check', async () => {
    const search = await simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' });
    await simulateAvailabilityCheck(search.flightId);
  });

  bench('Booking Creation', async () => {
    const search = await simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' });
    await simulateBookingCreation(search.flightId, 2);
  });

  bench('Complete Booking Workflow', async () => {
    const search = await simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' });
    const availability = await simulateAvailabilityCheck(search.flightId);

    if (!availability.available) throw new Error('Flight not available');

    const booking = await simulateBookingCreation(search.flightId, 2);
    await simulateBookingConfirmation(booking.bookingId);
  });

  bench('Parallel Multi-Supplier Search (3 suppliers)', async () => {
    const searches = Array.from({ length: 3 }, () =>
      simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' }),
    );
    await Promise.all(searches);
  });

  bench('Concurrent Bookings (5x)', async () => {
    const bookings = Array.from({ length: 5 }, async () => {
      const search = await simulateFlightSearch({ from: 'JFK', to: 'LAX', date: '2024-12-25' });
      return simulateBookingCreation(search.flightId, 1);
    });
    await Promise.all(bookings);
  });
});

describe('Hotel Booking Service Performance', () => {
  const simulateHotelSearch = async (criteria: { city: string; checkIn: string; nights: number }) => {
    // Simulate hotel inventory search
    await new Promise((res) => setTimeout(res, Math.random() * 250 + 50));

    return {
      searchId: `hotel_search_${Date.now()}`,
      city: criteria.city,
      checkIn: criteria.checkIn,
      nights: criteria.nights,
      results: Math.floor(Math.random() * 50) + 20,
    };
  };

  const simulateHotelHold = async (hotelId: string, nights: number) => {
    // Hold room inventory (typically 10-15 minutes)
    await new Promise((res) => setTimeout(res, Math.random() * 80 + 20));

    return {
      holdId: `hold_${Date.now()}`,
      hotelId,
      nights,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  };

  const simulateHotelBookingConfirm = async (holdId: string) => {
    // Convert hold to confirmed booking
    await new Promise((res) => setTimeout(res, Math.random() * 150 + 50));

    return {
      bookingId: `hbk_${Date.now()}`,
      holdId,
      status: 'confirmed',
      confirmationNumber: `H${Math.random().toString(36).substring(7).toUpperCase()}`,
    };
  };

  bench('Hotel Search', async () => {
    await simulateHotelSearch({ city: 'Paris', checkIn: '2024-12-25', nights: 3 });
  });

  bench('Hotel Hold', async () => {
    const search = await simulateHotelSearch({ city: 'Paris', checkIn: '2024-12-25', nights: 3 });
    // Assume first result
    await simulateHotelHold(`hotel_${search.searchId}`, search.nights);
  });

  bench('Complete Hotel Booking', async () => {
    const search = await simulateHotelSearch({ city: 'Paris', checkIn: '2024-12-25', nights: 3 });
    const hold = await simulateHotelHold(`hotel_${search.searchId}`, search.nights);
    await simulateHotelBookingConfirm(hold.holdId);
  });

  bench('Concurrent Hotel Bookings (3x)', async () => {
    const bookings = Array.from({ length: 3 }, async () => {
      const search = await simulateHotelSearch({ city: 'Paris', checkIn: '2024-12-25', nights: 3 });
      const hold = await simulateHotelHold(`hotel_${search.searchId}`, search.nights);
      return simulateHotelBookingConfirm(hold.holdId);
    });
    await Promise.all(bookings);
  });
});

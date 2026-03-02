/**
 * Innstant Travel Live API Integration
 * Search and Booking APIs for real-time hotel and flight data
 */

// API Keys and Endpoints
const INNSTANT_SEARCH_API_KEY =
  "$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS";
const INNSTANT_SEARCH_BASE_URL = "https://connect.mishor5.innstant-servers.com";

const INNSTANT_BOOKING_API_KEY =
  "$2y$10$wlIPpzB4fJvnaLVokrbAo.jjD4KhZlZVeCc/xf7hcilENIzFDXUhO";
const INNSTANT_BOOKING_BASE_URL = "https://book.mishor5.innstant-servers.com";

// Search API Functions

/**
 * Search for hotels using Innstant Travel Search API
 */
export async function searchHotels(params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  limit?: number;
}) {
  try {
    const response = await fetch(`${INNSTANT_SEARCH_BASE_URL}/hotels/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Aether-application-key": INNSTANT_SEARCH_API_KEY,
      },
      body: JSON.stringify({
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children || 0,
        rooms: params.rooms || 1,
        currency: params.currency || "USD",
        limit: params.limit || 20,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Search failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hotel search error:", error);
    throw error;
  }
}

/**
 * Get hotel details by hotel ID
 */
export async function getHotelDetails(hotelId: string) {
  try {
    const response = await fetch(
      `${INNSTANT_SEARCH_BASE_URL}/hotels/${hotelId}`,
      {
        method: "GET",
        headers: {
          "Aether-application-key": INNSTANT_SEARCH_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Hotel details failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hotel details error:", error);
    throw error;
  }
}

/**
 * Get available rooms for a specific hotel
 */
export async function getHotelRooms(
  hotelId: string,
  params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    rooms?: number;
  },
) {
  try {
    const response = await fetch(
      `${INNSTANT_SEARCH_BASE_URL}/hotels/${hotelId}/rooms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Aether-application-key": INNSTANT_SEARCH_API_KEY,
        },
        body: JSON.stringify({
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults: params.adults,
          children: params.children || 0,
          rooms: params.rooms || 1,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Hotel rooms failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hotel rooms error:", error);
    throw error;
  }
}

/**
 * Search for flights using Innstant Travel Search API
 */
export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currency?: string;
  directFlights?: boolean;
}) {
  try {
    const response = await fetch(`${INNSTANT_SEARCH_BASE_URL}/flights/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Aether-application-key": INNSTANT_SEARCH_API_KEY,
      },
      body: JSON.stringify({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children || 0,
        infants: params.infants || 0,
        cabin: params.cabin || "ECONOMY",
        currency: params.currency || "USD",
        directFlights: params.directFlights || false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Flight search failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Flight search error:", error);
    throw error;
  }
}

// Booking API Functions

/**
 * Hold a hotel room for booking
 */
export async function holdHotelRoom(params: {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}) {
  try {
    const response = await fetch(`${INNSTANT_BOOKING_BASE_URL}/hotels/hold`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Aether-access-token": INNSTANT_BOOKING_API_KEY,
      },
      body: JSON.stringify({
        hotelId: params.hotelId,
        roomId: params.roomId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children || 0,
        rooms: params.rooms || 1,
        currency: params.currency || "USD",
        guestDetails: params.guestDetails,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Hotel hold failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hotel hold error:", error);
    throw error;
  }
}

/**
 * Confirm a hotel booking
 */
export async function confirmHotelBooking(params: {
  holdId: string;
  paymentDetails: {
    paymentMethod: "credit_card" | "wallet";
    amount: number;
    currency: string;
    cardToken?: string; // For credit card payments
  };
}) {
  try {
    const response = await fetch(
      `${INNSTANT_BOOKING_BASE_URL}/hotels/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Aether-access-token": INNSTANT_BOOKING_API_KEY,
        },
        body: JSON.stringify({
          holdId: params.holdId,
          paymentDetails: params.paymentDetails,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Hotel confirmation failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Hotel confirmation error:", error);
    throw error;
  }
}

/**
 * Hold a flight for booking
 */
export async function holdFlight(params: {
  flightId: string;
  segments: Array<{
    origin: string;
    destination: string;
    departureDate: string;
    carrierCode: string;
    flightNumber: string;
  }>;
  passengers: Array<{
    type: "ADULT" | "CHILD" | "INFANT";
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: "M" | "F";
    passportNumber?: string;
    passportExpiry?: string;
    nationality?: string;
  }>;
  currency?: string;
}) {
  try {
    const response = await fetch(`${INNSTANT_BOOKING_BASE_URL}/flights/hold`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Aether-access-token": INNSTANT_BOOKING_API_KEY,
      },
      body: JSON.stringify({
        flightId: params.flightId,
        segments: params.segments,
        passengers: params.passengers,
        currency: params.currency || "USD",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Flight hold failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Flight hold error:", error);
    throw error;
  }
}

/**
 * Confirm a flight booking
 */
export async function confirmFlightBooking(params: {
  holdId: string;
  paymentDetails: {
    paymentMethod: "credit_card" | "wallet";
    amount: number;
    currency: string;
    cardToken?: string; // For credit card payments
  };
}) {
  try {
    const response = await fetch(
      `${INNSTANT_BOOKING_BASE_URL}/flights/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Aether-access-token": INNSTANT_BOOKING_API_KEY,
        },
        body: JSON.stringify({
          holdId: params.holdId,
          paymentDetails: params.paymentDetails,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Flight confirmation failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Flight confirmation error:", error);
    throw error;
  }
}

/**
 * Get booking details by booking ID
 */
export async function getBookingDetails(bookingId: string) {
  try {
    const response = await fetch(
      `${INNSTANT_BOOKING_BASE_URL}/bookings/${bookingId}`,
      {
        method: "GET",
        headers: {
          "Aether-access-token": INNSTANT_BOOKING_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Booking details failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Booking details error:", error);
    throw error;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    const response = await fetch(
      `${INNSTANT_BOOKING_BASE_URL}/bookings/${bookingId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Aether-access-token": INNSTANT_BOOKING_API_KEY,
        },
        body: JSON.stringify({
          reason: reason || "Customer request",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Booking cancellation failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Booking cancellation error:", error);
    throw error;
  }
}

// Utility Functions

/**
 * Format date for Innstant Travel API (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format currency with symbol
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    INR: "₹",
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Get cabin class display name
 */
export function getCabinDisplayName(cabin: string): string {
  const cabinNames: Record<string, string> = {
    ECONOMY: "Economy",
    PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business",
    FIRST: "First Class",
  };

  return cabinNames[cabin] || cabin;
}

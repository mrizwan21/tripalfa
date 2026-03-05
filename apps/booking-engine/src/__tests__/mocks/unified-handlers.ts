/**
 * Unified MSW (Mock Service Worker) Handlers
 * 
 * This file centralizes all mock API handlers for testing.
 * Instead of scattered handlers across multiple files, all mocks are defined here.
 * 
 * Usage:
 *   Import handlers from this file for integration tests
 *   Import mock utilities for unit tests
 * 
 * Categories:
 *   - Notifications (notifications handlers)
 *   - Flights (flight search, booking)
 *   - Hotels (hotel search, booking)
 *   - Payments (payment processing)
 *   - User (authentication, profile)
 */

import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";

// ============================================================================
// Types
// ============================================================================

export interface NotificationItem {
  id: string;
  type: "SUCCESS" | "INFO" | "WARNING" | "ERROR";
  title: string;
  description: string;
  when: string;
  read: boolean;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "INFO" | "CANCELLED";
  passengerName?: string;
  segment?: string;
  price?: number;
  currency?: string;
  remarks?: string;
}

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
}

export interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
}

// ============================================================================
// Store (in-memory mock database)
// ============================================================================

class MockStore {
  notifications: Map<string, NotificationItem> = new Map();
  bookings: Map<string, unknown> = new Map();
  
  constructor() {
    this.initializeNotifications();
  }
  
  private initializeNotifications() {
    const now = new Date().toISOString();
    const initialNotifications: NotificationItem[] = [
      {
        id: "notif-1",
        type: "SUCCESS",
        title: "Booking Confirmed",
        description: "Your flight booking has been confirmed",
        when: now,
        read: false,
        status: "CONFIRMED",
      },
      {
        id: "notif-2",
        type: "INFO",
        title: "Special Service Request",
        description: "Wheelchair assistance has been added",
        when: now,
        read: true,
        status: "PENDING",
        passengerName: "John Doe",
      },
      {
        id: "notif-3",
        type: "WARNING",
        title: "Schedule Change",
        description: "Your flight time has been changed",
        when: now,
        read: false,
        status: "REJECTED",
        remarks: "Please update your calendar",
      },
    ];
    
    initialNotifications.forEach((n) => this.notifications.set(n.id, n));
  }
  
  reset() {
    this.notifications.clear();
    this.bookings.clear();
    this.initializeNotifications();
  }
}

// Singleton store instance
export const mockStore = new MockStore();

// ============================================================================
// Factory Functions
// ============================================================================

export const createMockNotification = (
  overrides?: Partial<NotificationItem>
): NotificationItem => {
  const types: NotificationItem["type"][] = ["SUCCESS", "INFO", "WARNING", "ERROR"];
  const statuses: NotificationItem["status"][] = [
    "PENDING",
    "CONFIRMED",
    "REJECTED",
    "INFO",
    "CANCELLED",
  ];

  return {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(types),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    when: faker.date.recent().toISOString(),
    read: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(statuses),
    ...(faker.datatype.boolean() && { passengerName: faker.person.fullName() }),
    ...(faker.datatype.boolean() && { segment: faker.location.city() }),
    ...(faker.datatype.boolean() && {
      price: Number(faker.number.float({ min: 10, max: 1000 })).toFixed(2) as unknown as number,
    }),
    ...(faker.datatype.boolean() && { currency: faker.finance.currencyCode() }),
    ...(faker.datatype.boolean() && { remarks: faker.lorem.sentence() }),
    ...overrides,
  };
};

export const createMockFlightSearchResult = (params: FlightSearchParams = {}) => {
  return {
    data: {
      flights: [
        {
          id: faker.string.uuid(),
          origin: params.origin || "LHR",
          destination: params.destination || "JFK",
          departure_time: params.departureDate || "2024-06-15T10:00:00Z",
          arrival_time: "2024-06-15T18:00:00Z",
          price: {
            amount: Number(faker.number.float({ min: 200, max: 1500 })),
            currency: "USD",
          },
          airline: faker.helpers.arrayElement(["AA", "BA", "UA", "DL"]),
          flight_number: `${faker.string.alpha(2)}${faker.number.int({ min: 100, max: 9999 })}`,
          available_seats: faker.number.int({ min: 1, max: 50 }),
        },
      ],
      search_id: faker.string.uuid(),
    },
  };
};

export const createMockHotelSearchResult = (params: HotelSearchParams = {}) => {
  return {
    data: {
      hotels: [
        {
          id: faker.string.uuid(),
          name: `${faker.company.name()} Hotel`,
          city: params.city || "New York",
          rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
          price_per_night: Number(faker.number.float({ min: 50, max: 500 })),
          currency: "USD",
          amenities: faker.helpers.arrayElements(
            ["WiFi", "Pool", "Gym", "Restaurant", "Spa", "Parking"],
            { min: 2, max: 5 }
          ),
        },
      ],
      search_id: faker.string.uuid(),
    },
  };
};

// ============================================================================
// Notification Handlers
// ============================================================================

const notificationHandlers = [
  // GET /api/notifications
  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let notifications = Array.from(mockStore.notifications.values());

    // Apply filters
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }
    if (status) {
      notifications = notifications.filter((n) => n.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      notifications = notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date
    notifications.sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
    );

    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedNotifications = notifications.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginatedNotifications,
      metadata: {
        total: notifications.length,
        page,
        pageSize,
        totalPages: Math.ceil(notifications.length / pageSize),
      },
    });
  }),

  // GET /api/notifications/:id
  http.get("/api/notifications/:id", ({ params }) => {
    const { id } = params;
    const notification = mockStore.notifications.get(id as string);

    if (!notification) {
      return HttpResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return HttpResponse.json(notification);
  }),

  // POST /api/notifications/:id/read
  http.post("/api/notifications/:id/read", ({ params }) => {
    const { id } = params;
    const notification = mockStore.notifications.get(id as string);

    if (!notification) {
      return HttpResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    notification.read = true;
    mockStore.notifications.set(id as string, notification);

    return HttpResponse.json(notification);
  }),

  // POST /api/notifications/mark-read (bulk)
  http.post("/api/notifications/mark-read", async ({ request }) => {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids || [];

    ids.forEach((id) => {
      const notification = mockStore.notifications.get(id);
      if (notification) {
        notification.read = true;
        mockStore.notifications.set(id, notification);
      }
    });

    return HttpResponse.json({ success: true });
  }),

  // GET /api/notifications/unread-count
  http.get("/api/notifications/unread-count", () => {
    const unreadCount = Array.from(mockStore.notifications.values()).filter(
      (n) => !n.read
    ).length;

    return HttpResponse.json({ count: unreadCount });
  }),

  // DELETE /api/notifications/:id
  http.delete("/api/notifications/:id", ({ params }) => {
    const { id } = params;

    if (!mockStore.notifications.has(id as string)) {
      return HttpResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    mockStore.notifications.delete(id as string);

    return HttpResponse.json({ success: true });
  }),
];

// ============================================================================
// Flight Handlers
// ============================================================================

const flightHandlers = [
  // POST /api/flights/search
  http.post("/api/flights/search", async ({ request }) => {
    const body = (await request.json()) as FlightSearchParams;
    return HttpResponse.json(createMockFlightSearchResult(body));
  }),

  // GET /api/flights/:id
  http.get("/api/flights/:id", ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        origin: "LHR",
        destination: "JFK",
        departure_time: "2024-06-15T10:00:00Z",
        arrival_time: "2024-06-15T18:00:00Z",
        price: { amount: 599.99, currency: "USD" },
        available_seats: 23,
      },
    });
  }),
];

// ============================================================================
// Hotel Handlers
// ============================================================================

const hotelHandlers = [
  // POST /api/hotels/search
  http.post("/api/hotels/search", async ({ request }) => {
    const body = (await request.json()) as HotelSearchParams;
    return HttpResponse.json(createMockHotelSearchResult(body));
  }),

  // GET /api/hotels/:id
  http.get("/api/hotels/:id", ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        name: "Grand Hotel",
        city: "New York",
        rating: 4.5,
        price_per_night: 299.99,
        currency: "USD",
        amenities: ["WiFi", "Pool", "Gym"],
      },
    });
  }),
];

// ============================================================================
// Error Simulation Handlers
// ============================================================================

const errorHandlers = [
  http.get("/api/notifications/error/500", () => {
    return HttpResponse.json({ error: "Internal server error" }, { status: 500 });
  }),

  http.get("/api/notifications/error/timeout", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return HttpResponse.json({ data: [] });
  }),

  http.get("/api/notifications/error/network", () => {
    return HttpResponse.error();
  }),
];

// ============================================================================
// Exports
// ============================================================================

// All notification handlers
export const notificationApiHandlers = [...notificationHandlers, ...errorHandlers];

// All flight handlers
export const flightApiHandlers = flightHandlers;

// All hotel handlers
export const hotelApiHandlers = hotelHandlers;

// Combined handlers for full API mocking
export const allHandlers = [
  ...notificationHandlers,
  ...flightHandlers,
  ...hotelHandlers,
  ...errorHandlers,
];

// Helper functions
export const resetMockStore = () => mockStore.reset();
export const addMockNotification = (notification: NotificationItem) => {
  mockStore.notifications.set(notification.id, notification);
};
export const getAllMockNotifications = () => 
  Array.from(mockStore.notifications.values());
export const clearMockNotifications = () => mockStore.notifications.clear();

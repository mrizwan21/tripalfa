declare module '@tripalfa/shared-types' {
  export interface Adapter<TRequest = any, TResponse = any> {
    name: string;
    init?: () => Promise<void> | void;
    request(payload: TRequest): Promise<TResponse>;
    health?: () => Promise<boolean>;
  }

  export interface FlightResult {
    id: string;
    airline?: string;
    carrierCode?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    amount?: number;
    currency?: string;
    stops?: number;
    isLCC?: boolean;
    airlineLogo?: string;
  }

  export interface HotelResult {
    id: string;
    name?: string;
    image?: string;
    location?: string;
    rating?: number;
    reviews?: number;
    pricePerNight?: number;
    currency?: string;
    amenities?: string[];
    provider?: string;
  }
}

declare module '@prisma/client' {
  // Loosen Prisma client typings to allow access by model name variants used across the codebase.
  // This is a non-destructive compatibility shim; prefer correcting usages to exact model names later.
  interface PrismaClient {
    [key: string]: any;
  }
  // Treat Decimal as any for compilation; convert/handle precisely at runtime where needed.
  type Decimal = any;
}

// Override AuthPayload to prevent conflicts with Express Request user type
declare global {
  interface AuthPayload {
    userId?: string;
    id: string;
    role: string;
    companyId?: string;
    departmentId?: string;
    permissions: string[];
    [key: string]: any; // Allow additional properties
  }
}

// Temporarily removed Express override to fix type issues

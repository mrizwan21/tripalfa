export declare enum Intent {
    READ_STATIC = "READ_STATIC",
    QUERY_STATIC = "QUERY_STATIC",
    WRITE = "WRITE",
    READ_REALTIME = "READ_REALTIME",
    QUERY_REALTIME = "QUERY_REALTIME",
    ADAPTER = "ADAPTER"
}
export interface Adapter {
    name: string;
    request(payload: any): Promise<any>;
}
export interface FlightResult {
    id: string;
    airline: string;
    flightNumber: string;
    departure: {
        airport: string;
        time: Date;
    };
    arrival: {
        airport: string;
        time: Date;
    };
    price: number;
    currency: string;
    availableSeats: number;
}
export interface HotelResult {
    id: string;
    name: string;
    location: string;
    rating: number;
    pricePerNight: number;
    currency: string;
    availableRooms: number;
    amenities: string[];
}
export interface RealtimeData {
    id: string;
    vendor: string;
    productId: string;
    payload: any;
    ts: string;
    sequence: number;
}
export interface Metric {
    name: string;
    value: number;
    ts?: string;
    tags?: Record<string, string>;
}
export interface Currency {
    code: string;
    name: string;
    symbol?: string;
    decimal_digits?: number;
    buffer_percentage?: number;
    is_active?: boolean;
}

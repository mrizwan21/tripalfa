import { z } from 'zod';
import { passengerSchema } from '../components/booking/PassengerForm';

export type Passenger = z.infer<typeof passengerSchema>;

export interface FlightSegment {
    id: string;
    from: string;
    to: string;
    carrier: string;
    code: string;
    date: string;
    time: string;
    duration: string;
    originCity?: string;
    destinationCity?: string;
    departureTime?: string;
    arrivalTime?: string;
    flightNumber?: string;
    airline?: string;
    layoverDuration?: string | null;
    departureTerminal?: string;
    arrivalTerminal?: string;
    aircraft?: string;
}

export interface FlightSummary {
    cabin: string;
    route: string;
    price: number;
    taxes: number;
    isLCC: boolean;
    airlineLogo?: string;
    airlineName: string;
    segments: FlightSegment[];
}

export interface HotelSummary {
    name: string;
    location: string;
    price: number;
    taxes: number;
    image: string;
    refundable?: boolean;
}

export interface SSRRequest {
    type: string;
    code: string;
    name: string;
    price: number;
}

export interface Ancillaries {
    seats: number;
    baggage: number;
    meals: number;
    ssr: SSRRequest[];
}

export type PaymentMode = 'wallet' | 'hold';

export interface FormValues {
    passengers: Passenger[];
    billingAddress: {
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };
    discountCoupon?: string;
}

export interface BookingState {
    bookingData: FormValues;
    bookingId: string;
    summary: {
        type: 'flight' | 'hotel';
        hotel: HotelSummary | null;
        flight: FlightSummary | null;
        ancillaries: Ancillaries;
        totals: {
            subtotal: number;
            discount: number;
            final: number;
        };
    };
}

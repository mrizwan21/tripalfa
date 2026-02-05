export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

export type FlightClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type TripType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  travelClass: FlightClass;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  tripType: TripType;
}

export interface HotelSearchParams {
  location: string;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
}

export interface FlightResult {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  stops: number;
}

export interface HotelResult {
  id: string;
  name: string;
  image: string;
  rating: number;
  address: string;
  pricePerNight: number;
  currency: string;
  amenities: string[];
}

export interface Booking {
  id: string;
  reference: string;
  type: 'FLIGHT' | 'HOTEL';
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  date: string;
  totalAmount: number;
  currency: string;
  details: any; // Simplified for now
}

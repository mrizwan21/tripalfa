/**
 * Ancillary Services Types
 * Interfaces for seat selection, baggage, meals, and special services
 */

export interface Passenger {
  id: string;
  type: 'Adult' | 'Child' | 'Infant';
  title?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface FlightSegmentInfo {
  id: string;
  flightNumber: string;
  airline?: string;
  airlineLogo?: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass?: string;
}

// Seat Selection Types
export interface SeatInfo {
  id: string;
  designator: string;
  status: 'available' | 'occupied' | 'unavailable';
  type: 'standard' | 'extra_legroom' | 'exit_row' | 'window' | 'aisle' | 'middle';
  price: number;
  currency: string;
}

export interface SelectedSeat {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  flightNumber: string;
  seatDesignator: string;
  seatType: string;
  price: number;
  currency: string;
}

// Baggage Types
export interface BaggageOption {
  id: string;
  type: 'checked' | 'carry_on';
  weight: number;
  weightUnit: 'kg' | 'lb';
  price: number;
  currency: string;
  description?: string;
}

export interface SelectedBaggage {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  flightNumber: string;
  baggageId: string;
  weight: number;
  weightUnit: string;
  price: number;
  currency: string;
}

// Meal Types
export interface MealOption {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'special';
  price: number;
  currency: string;
  category?: 'standard' | 'special' | 'premium';
  dietary?: string[];
  image?: string;
}

export interface SelectedMeal {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  flightNumber: string;
  mealId: string;
  mealName: string;
  mealType: string;
  description?: string;
  price: number;
  currency: string;
}

// Special Service Types
export interface SpecialServiceOption {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  requiresNotes?: boolean;
}

export interface SelectedSpecialService {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  flightNumber: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  price: number;
  currency: string;
  notes?: string;
}

// Combined Ancillary Selection State
export interface AncillarySelections {
  seats: SelectedSeat[];
  baggage: SelectedBaggage[];
  meals: SelectedMeal[];
  specialServices: SelectedSpecialService[];
}

// Ancillary Service Summary
export interface AncillarySummary {
  seats: number;
  baggage: number;
  meals: number;
  specialServices: number;
  total: number;
  currency: string;
}

// Calculate summary from selections
export function calculateAncillarySummary(selections: AncillarySelections): AncillarySummary {
  const seatsAmount = selections.seats.reduce((sum, s) => sum + s.price, 0);
  const baggageAmount = selections.baggage.reduce((sum, b) => sum + b.price, 0);
  const mealsAmount = selections.meals.reduce((sum, m) => sum + m.price, 0);
  const specialServicesAmount = selections.specialServices.reduce((sum, s) => sum + s.price, 0);

  return {
    seats: seatsAmount,
    baggage: baggageAmount,
    meals: mealsAmount,
    specialServices: specialServicesAmount,
    total: seatsAmount + baggageAmount + mealsAmount + specialServicesAmount,
    currency: 'INR'
  };
}

// Default SSR Options - commonly available across airlines
export const DEFAULT_SSR_OPTIONS: SpecialServiceOption[] = [
  { id: 'WCHR', code: 'WCHR', name: 'Wheelchair - Ramp', description: 'Passenger can walk short distance but needs wheelchair for longer distances', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'WCHC', code: 'WCHC', name: 'Wheelchair - Cabin', description: 'Passenger completely immobile and needs wheelchair to/from aircraft seat', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'WCHS', code: 'WCHS', name: 'Wheelchair - Steps', description: 'Passenger can walk but cannot climb stairs', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'BLND', code: 'BLND', name: 'Blind Passenger', description: 'Assistance for visually impaired passengers', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'DEAF', code: 'DEAF', name: 'Deaf Passenger', description: 'Assistance for hearing impaired passengers', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'BSCT', code: 'BSCT', name: 'Bassinet / Baby Cot', description: 'Infant cot request for babies under 2 years (subject to availability)', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'UMNR', code: 'UMNR', name: 'Unaccompanied Minor', description: 'Special assistance for children traveling alone', price: 0, currency: 'INR', requiresNotes: true },
  { id: 'MAAS', code: 'MAAS', name: 'Meet and Assist', description: 'Airport staff assistance through the airport', price: 0, currency: 'INR', requiresNotes: true },
];

// Default Meal Options for FSC (Full Service Carriers)
export const DEFAULT_FSC_MEALS: MealOption[] = [
  { id: 'AVML', code: 'AVML', name: 'Asian Vegetarian Meal', description: 'Spicy vegetarian meal prepared in Asian style, no meat or eggs', type: 'vegetarian', price: 0, currency: 'INR', category: 'special', dietary: ['vegetarian'] },
  { id: 'VGML', code: 'VGML', name: 'Vegetarian Vegan Meal', description: 'Strict vegetarian meal containing no animal products', type: 'vegan', price: 0, currency: 'INR', category: 'special', dietary: ['vegan'] },
  { id: 'MOML', code: 'MOML', name: 'Muslim Meal', description: 'Prepared according to Islamic dietary laws (Halal)', type: 'special', price: 0, currency: 'INR', category: 'special', dietary: ['halal'] },
  { id: 'KSML', code: 'KSML', name: 'Kosher Meal', description: 'Prepared according to Jewish dietary laws', type: 'special', price: 0, currency: 'INR', category: 'special', dietary: ['kosher'] },
  { id: 'GFML', code: 'GFML', name: 'Gluten-Free Meal', description: 'Meal without wheat, rye, barley, or oats', type: 'special', price: 0, currency: 'INR', category: 'special', dietary: ['gluten-free'] },
  { id: 'DBML', code: 'DBML', name: 'Diabetic Meal', description: 'Low sugar meal suitable for diabetic passengers', type: 'special', price: 0, currency: 'INR', category: 'special', dietary: ['diabetic'] },
  { id: 'HNML', code: 'HNML', name: 'Hindu Meal', description: 'Non-vegetarian meal prepared according to Hindu customs, no beef', type: 'non-vegetarian', price: 0, currency: 'INR', category: 'special', dietary: ['hindu'] },
  { id: 'CHML', code: 'CHML', name: 'Child Meal', description: 'Meal designed for children (2-12 years)', type: 'special', price: 0, currency: 'INR', category: 'special' },
];

// Default Meal Options for LCC (Low Cost Carriers)
export const DEFAULT_LCC_MEALS: MealOption[] = [
  { id: 'lcc1', code: 'HOT1', name: 'Hot Chicken Rice', description: 'Grilled chicken with steamed rice and vegetables', type: 'non-vegetarian', price: 350, currency: 'INR', category: 'standard' },
  { id: 'lcc2', code: 'HOT2', name: 'Vegetable Biryani', description: 'Fragrant rice with mixed vegetables and spices', type: 'vegetarian', price: 300, currency: 'INR', category: 'standard', dietary: ['vegetarian'] },
  { id: 'lcc3', code: 'SNK1', name: 'Sandwich Combo', description: 'Fresh sandwich with chips and a soft drink', type: 'vegetarian', price: 250, currency: 'INR', category: 'standard' },
  { id: 'lcc4', code: 'SNK2', name: 'Pasta & Salad', description: 'Creamy pasta with fresh garden salad', type: 'vegetarian', price: 300, currency: 'INR', category: 'standard', dietary: ['vegetarian'] },
  { id: 'lcc5', code: 'BRK1', name: 'Breakfast Box', description: 'Omelette, hash browns, toast and coffee', type: 'non-vegetarian', price: 280, currency: 'INR', category: 'standard' },
  { id: 'lcc6', code: 'PRM1', name: 'Premium Steak Meal', description: 'Grilled steak with roasted potatoes and wine', type: 'non-vegetarian', price: 750, currency: 'INR', category: 'premium' },
];

// Default Baggage Options
export const DEFAULT_BAGGAGE_OPTIONS: BaggageOption[] = [
  { id: 'bag15', type: 'checked', weight: 15, weightUnit: 'kg', price: 1500, currency: 'INR', description: '15kg Checked Baggage' },
  { id: 'bag20', type: 'checked', weight: 20, weightUnit: 'kg', price: 2000, currency: 'INR', description: '20kg Checked Baggage' },
  { id: 'bag23', type: 'checked', weight: 23, weightUnit: 'kg', price: 2500, currency: 'INR', description: '23kg Checked Baggage' },
  { id: 'bag30', type: 'checked', weight: 30, weightUnit: 'kg', price: 3500, currency: 'INR', description: '30kg Checked Baggage' },
  { id: 'bag40', type: 'checked', weight: 40, weightUnit: 'kg', price: 5000, currency: 'INR', description: '40kg Checked Baggage' },
];

// Generate passenger avatar URL
export function getPassengerAvatar(name: string): string {
  const seed = encodeURIComponent(name);
  return "https://api.dicebear.com/7.x/avataaars/svg?seed=" + seed;
}

// Format passengers from booking data
export function formatPassengersFromBooking(passengers: { adults: number; children: number; infants: number }, details?: any[]): Passenger[] {
  const result: Passenger[] = [];
  let id = 1;

  // If we have passenger details, use them
  if (details && details.length > 0) {
    return details.map((p, idx) => ({
      id: String(idx + 1),
      type: p.type || 'Adult',
      title: p.title,
      firstName: p.firstName || 'Passenger ' + String(idx + 1),
      lastName: p.lastName || '',
      avatar: getPassengerAvatar(p.firstName || 'Passenger' + String(idx + 1))
    }));
  }

  // Otherwise generate placeholder passengers
  for (let i = 0; i < passengers.adults; i++) {
    result.push({
      id: String(id++),
      type: 'Adult',
      firstName: 'Adult ' + String(i + 1),
      lastName: '',
      avatar: getPassengerAvatar('Adult' + String(i + 1))
    });
  }
  for (let i = 0; i < passengers.children; i++) {
    result.push({
      id: String(id++),
      type: 'Child',
      firstName: 'Child ' + String(i + 1),
      lastName: '',
      avatar: getPassengerAvatar('Child' + String(i + 1))
    });
  }
  for (let i = 0; i < passengers.infants; i++) {
    result.push({
      id: String(id++),
      type: 'Infant',
      firstName: 'Infant ' + String(i + 1),
      lastName: '',
      avatar: getPassengerAvatar('Infant' + String(i + 1))
    });
  }

  return result;
}

// Format flight segments from booking data
export function formatFlightSegments(segments: any[]): FlightSegmentInfo[] {
  return (segments || []).map((seg, idx) => ({
    id: seg.id || 'seg-' + String(idx),
    flightNumber: seg.flightNumber || (seg.carrierCode || seg.airline?.slice(0, 2).toUpperCase() || 'XX') + String(Math.floor(Math.random() * 9000) + 1000),
    airline: seg.airline || 'Unknown Airline',
    origin: seg.origin || seg.from || 'XXX',
    originCity: seg.originCity || '',
    destination: seg.destination || seg.to || 'XXX',
    destinationCity: seg.destinationCity || '',
    departureTime: seg.departureTime || seg.depart || new Date().toISOString(),
    arrivalTime: seg.arrivalTime || seg.arrive || new Date().toISOString(),
    cabinClass: seg.cabin || 'Economy'
  }));
}

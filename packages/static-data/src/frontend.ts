type NamedCode = {
  code: string;
  name: string;
  is_popular?: boolean;
};

type NamedId = {
  id: string;
  name: string;
  is_popular?: boolean;
};

type Destination = {
  id: string;
  name: string;
  country: string;
  city: string;
  code: string;
  isPopular?: boolean;
};

export const HOTEL_STATIC_DATA = {
  AMENITIES: {
    all: [
      { code: "WIFI", name: "Wi-Fi", is_popular: true },
      { code: "POOL", name: "Swimming Pool", is_popular: true },
      { code: "GYM", name: "Gym", is_popular: true },
      { code: "PARKING", name: "Parking" },
      { code: "SPA", name: "Spa" },
      { code: "RESTAURANT", name: "Restaurant", is_popular: true },
      { code: "BAR", name: "Bar" },
      { code: "ROOM_SERVICE", name: "Room Service" }
    ] as NamedCode[]
  },
  BOARD_TYPES: {
    all: [
      { code: "RO", name: "Room Only" },
      { code: "BB", name: "Bed & Breakfast", is_popular: true },
      { code: "HB", name: "Half Board", is_popular: true },
      { code: "FB", name: "Full Board" },
      { code: "AI", name: "All Inclusive" }
    ] as NamedCode[]
  },
  TYPES: {
    all: [
      { code: "HOTEL", name: "Hotel", is_popular: true },
      { code: "RESORT", name: "Resort", is_popular: true },
      { code: "APARTMENT", name: "Apartment" },
      { code: "VILLA", name: "Villa" }
    ] as NamedCode[]
  },
  CHAINS: {
    all: [
      { code: "MARRIOTT", name: "Marriott" },
      { code: "HILTON", name: "Hilton" },
      { code: "IHG", name: "IHG" },
      { code: "HYATT", name: "Hyatt" }
    ] as NamedCode[]
  },
  STAR_RATINGS: {
    all: [
      { id: "3", name: "3 Star" },
      { id: "4", name: "4 Star", is_popular: true },
      { id: "5", name: "5 Star", is_popular: true }
    ] as NamedId[]
  },
  ROOM_TYPES: {
    all: [
      { code: "STD", name: "Standard Room", is_popular: true },
      { code: "DLX", name: "Deluxe Room", is_popular: true },
      { code: "STE", name: "Suite" },
      { code: "FAM", name: "Family Room" }
    ] as NamedCode[]
  },
  VIEW_TYPES: {
    all: [
      { code: "CITY", name: "City View" },
      { code: "SEA", name: "Sea View", is_popular: true },
      { code: "POOL", name: "Pool View" },
      { code: "GARDEN", name: "Garden View" }
    ] as NamedCode[]
  },
  PAYMENT_TYPES: {
    all: [
      { code: "PREPAID", name: "Prepaid", is_popular: true },
      { code: "PAY_AT_HOTEL", name: "Pay at Hotel", is_popular: true }
    ] as NamedCode[]
  },
  POPULAR_DESTINATIONS: [
    { id: "DXB", name: "Dubai", country: "UAE", city: "Dubai", code: "DXB", isPopular: true },
    { id: "AUH", name: "Abu Dhabi", country: "UAE", city: "Abu Dhabi", code: "AUH", isPopular: true },
    { id: "DOH", name: "Doha", country: "Qatar", city: "Doha", code: "DOH", isPopular: true },
    { id: "BAH", name: "Bahrain", country: "Bahrain", city: "Manama", code: "BAH", isPopular: true }
  ] as Destination[]
};

export function searchHotelDestinations(query: string): Destination[] {
  const q = query.trim().toLowerCase();
  if (!q) return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.slice(0, 10);
  return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.filter((item) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });
}

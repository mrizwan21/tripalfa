export type NamedCode = {
  code: string;
  name: string;
  is_popular?: boolean;
};

export type NamedId = {
  id: string;
  name: string;
  is_popular?: boolean;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  city: string;
  code: string;
  isPopular?: boolean;
};

// Cache for static data to avoid repeated DB queries
let cachedStaticData: any = null;
let cachedDestinations: Destination[] | null = null;

// Database client (lazy initialized)
let pgClient: any = null;

function getPgClient(): any {
  if (!pgClient) {
    const { Client } = require("pg");
    const dbUrl = process.env.STATIC_RO_DATABASE_URL || process.env.STATIC_DATABASE_URL || "postgresql://static_ro:static_secure_password_123!@localhost:5433/tripalfa_local";
    pgClient = new Client({ connectionString: dbUrl });
    pgClient.connect().catch((err: Error) => console.error("Static data DB connection failed:", err));
  }
  return pgClient;
}

// Fetch hotel static data from Postgres
async function fetchHotelStaticData() {
  if (cachedStaticData) return cachedStaticData;

  const client = getPgClient();
  try {
    const { rows: amenities } = await client.query(`SELECT code, name, is_popular FROM hotel_amenities ORDER BY name`);
    const { rows: boardTypes } = await client.query(`SELECT code, name, is_popular FROM hotel_board_types ORDER BY name`);
    const { rows: types } = await client.query(`SELECT code, name, is_popular FROM hotel_types ORDER BY name`);
    const { rows: chains } = await client.query(`SELECT code, name FROM hotel_chains ORDER BY name`);
    const { rows: starRatings } = await client.query(`SELECT id, name, is_popular FROM hotel_star_ratings ORDER BY id`);
    const { rows: roomTypes } = await client.query(`SELECT code, name, is_popular FROM hotel_room_types ORDER BY name`);
    const { rows: viewTypes } = await client.query(`SELECT code, name, is_popular FROM hotel_view_types ORDER BY name`);
    const { rows: paymentTypes } = await client.query(`SELECT code, name, is_popular FROM hotel_payment_types ORDER BY name`);

    cachedStaticData = {
      AMENITIES: { all: amenities },
      BOARD_TYPES: { all: boardTypes },
      TYPES: { all: types },
      CHAINS: { all: chains },
      STAR_RATINGS: { all: starRatings },
      ROOM_TYPES: { all: roomTypes },
      VIEW_TYPES: { all: viewTypes },
      PAYMENT_TYPES: { all: paymentTypes },
      POPULAR_DESTINATIONS: [] as Destination[]
    };
    return cachedStaticData;
  } catch (err) {
    console.error("Failed to fetch hotel static data from DB:", err);
    return getHardcodedStaticData();
  }
}

// Fetch popular destinations from Postgres
async function fetchPopularDestinations(): Promise<Destination[]> {
  if (cachedDestinations) return cachedDestinations;

  const client = getPgClient();
  try {
    const { rows } = await client.query(`
      SELECT id, name, country, city, code, is_popular 
      FROM hotel_destinations 
      WHERE is_popular = true 
      ORDER BY name
    `);
    cachedDestinations = rows as Destination[];
    return cachedDestinations;
  } catch (err) {
    console.error("Failed to fetch destinations from DB:", err);
    return getHardcodedDestinations();
  }
}

// Hardcoded fallback data
function getHardcodedStaticData() {
  return {
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
      ]
    },
    BOARD_TYPES: {
      all: [
        { code: "RO", name: "Room Only" },
        { code: "BB", name: "Bed & Breakfast", is_popular: true },
        { code: "HB", name: "Half Board", is_popular: true },
        { code: "FB", name: "Full Board" },
        { code: "AI", name: "All Inclusive" }
      ]
    },
    TYPES: {
      all: [
        { code: "HOTEL", name: "Hotel", is_popular: true },
        { code: "RESORT", name: "Resort", is_popular: true },
        { code: "APARTMENT", name: "Apartment" },
        { code: "VILLA", name: "Villa" }
      ]
    },
    CHAINS: {
      all: [
        { code: "MARRIOTT", name: "Marriott" },
        { code: "HILTON", name: "Hilton" },
        { code: "IHG", name: "IHG" },
        { code: "HYATT", name: "Hyatt" }
      ]
    },
    STAR_RATINGS: {
      all: [
        { id: "3", name: "3 Star" },
        { id: "4", name: "4 Star", is_popular: true },
        { id: "5", name: "5 Star", is_popular: true }
      ]
    },
    ROOM_TYPES: {
      all: [
        { code: "STD", name: "Standard Room", is_popular: true },
        { code: "DLX", name: "Deluxe Room", is_popular: true },
        { code: "STE", name: "Suite" },
        { code: "FAM", name: "Family Room" }
      ]
    },
    VIEW_TYPES: {
      all: [
        { code: "CITY", name: "City View" },
        { code: "SEA", name: "Sea View", is_popular: true },
        { code: "POOL", name: "Pool View" },
        { code: "GARDEN", name: "Garden View" }
      ]
    },
    PAYMENT_TYPES: {
      all: [
        { code: "PREPAID", name: "Prepaid", is_popular: true },
        { code: "PAY_AT_HOTEL", name: "Pay at Hotel", is_popular: true }
      ]
    },
    POPULAR_DESTINATIONS: getHardcodedDestinations()
  };
}

function getHardcodedDestinations(): Destination[] {
  return [
    { id: "DXB", name: "Dubai", country: "UAE", city: "Dubai", code: "DXB", isPopular: true },
    { id: "AUH", name: "Abu Dhabi", country: "UAE", city: "Abu Dhabi", code: "AUH", isPopular: true },
    { id: "DOH", name: "Doha", country: "Qatar", city: "Doha", code: "DOH", isPopular: true },
    { id: "BAH", name: "Bahrain", country: "Bahrain", city: "Manama", code: "BAH", isPopular: true }
  ];
}

// Export HOTEL_STATIC_DATA with the same interface
export const HOTEL_STATIC_DATA = {
  get AMENITIES() { return fetchHotelStaticData().then(d => d.AMENITIES) },
  get BOARD_TYPES() { return fetchHotelStaticData().then(d => d.BOARD_TYPES) },
  get TYPES() { return fetchHotelStaticData().then(d => d.TYPES) },
  get CHAINS() { return fetchHotelStaticData().then(d => d.CHAINS) },
  get STAR_RATINGS() { return fetchHotelStaticData().then(d => d.STAR_RATINGS) },
  get ROOM_TYPES() { return fetchHotelStaticData().then(d => d.ROOM_TYPES) },
  get VIEW_TYPES() { return fetchHotelStaticData().then(d => d.VIEW_TYPES) },
  get PAYMENT_TYPES() { return fetchHotelStaticData().then(d => d.PAYMENT_TYPES) },
  get POPULAR_DESTINATIONS() { return fetchPopularDestinations() }
};

// Search destinations
export async function searchHotelDestinations(query: string): Promise<Destination[]> {
  const q = query.trim().toLowerCase();
  const allDestinations = await fetchPopularDestinations();
  if (!q) return allDestinations.slice(0, 10);
  return allDestinations.filter((item: Destination) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });
}

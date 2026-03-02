/**
 * Kiwi Tequila / Nomad API — used EXCLUSIVELY for multi-city flight searches.
 *
 * Credentials
 *   AffilID : technocenseitsolutionstripalfanomad
 *   API Key : I84HckfkK9C__-m346nQvVzC95XqQYhw
 *
 * Architecture (dev)
 *   Frontend → /kiwi/* (Vite proxy) → https://api.tequila.kiwi.com/*
 *
 * Search strategy
 *   Each user-defined leg is searched independently via Kiwi v2/search.
 *   The top results from the first leg are combined with the cheapest
 *   option per subsequent leg to form complete multi-city itineraries.
 *   The combined result matches the exact shape produced by FlightSearch's
 *   Duffel mapper, so the same card components render both.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const KIWI_PROXY = "/kiwi"; // Vite proxies /kiwi → tequila.kiwi.com
const KIWI_KEY = "I84HckfkK9C__-m346nQvVzC95XqQYhw";
const KIWI_AFFIL = "technocenseitsolutionstripalfanomad";

// ─── Public types ─────────────────────────────────────────────────────────────

/** A single leg of a multi-city itinerary */
export interface KiwiLeg {
  origin: string; // IATA airport/city code, e.g. "DXB"
  destination: string; // IATA airport/city code, e.g. "LHR"
  date: string; // ISO date YYYY-MM-DD
}

/** Normalised multi-city flight result — same shape as Duffel results in FlightSearch */
export interface KiwiFlightResult {
  id: string;
  offerId: string;
  tripType: "multi-city";
  source: "kiwi";
  airline: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destCity: string;
  departureTime: string; // "HH:MM"
  arrivalTime: string; // "HH:MM"
  duration: string; // "Xh Ym"
  stops: number;
  amount: number;
  currency: string;
  refundable: boolean;
  includedBags: Array<{
    quantity: number;
    weight?: number;
    unit: string;
    type: string;
  }>;
  /** All legs AFTER the first, for the card's multi-leg display */
  extraSlices: Array<{
    origin: string;
    originCity: string;
    destination: string;
    destCity: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
  }>;
  deepLink?: string;
  rawOffer?: any;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Convert YYYY-MM-DD  →  DD/MM/YYYY (Kiwi date format) */
function toKiwiDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "2025-12-01T14:30:00.000Z"  →  "14:30" */
function timeOf(iso?: string | null): string {
  if (!iso) return "--:--";
  const t = iso.includes("T") ? iso.split("T")[1] : iso;
  return (t ?? "").substring(0, 5) || "--:--";
}

/** Seconds  →  "2h 30m" */
function secsToDuration(secs: number): string {
  if (!secs || isNaN(secs)) return "--";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

/** Build the extraSlice shape from a raw Kiwi offer object */
function offerToExtraSlice(offer: any) {
  const firstRoute = offer.route?.[0] ?? {};
  const lastRoute = offer.route?.[offer.route?.length - 1] ?? {};
  return {
    origin: offer.flyFrom || firstRoute.flyFrom || "--",
    originCity: offer.cityFrom || firstRoute.cityFrom || "",
    destination: offer.flyTo || lastRoute.flyTo || "--",
    destCity: offer.cityTo || lastRoute.cityTo || "",
    departureTime: timeOf(offer.local_departure),
    arrivalTime: timeOf(offer.local_arrival),
    duration: secsToDuration(
      offer.duration?.departure ?? offer.duration?.total ?? 0,
    ),
    stops: Math.max(0, (offer.route?.length ?? 1) - 1),
  };
}

/** Map a raw Kiwi offer → KiwiFlightResult */
function mapOffer(
  offer: any,
  currency: string,
  totalPrice: number,
  extraSlices: KiwiFlightResult["extraSlices"],
): KiwiFlightResult {
  const firstRoute = offer.route?.[0] ?? {};
  const lastRoute = offer.route?.[offer.route?.length - 1] ?? {};

  // Bag info from Kiwi baglimit object
  const bags: KiwiFlightResult["includedBags"] = [];
  const bl = offer.baglimit ?? {};
  if (bl.hand_weight) {
    bags.push({
      quantity: 1,
      weight: bl.hand_weight,
      unit: "kg",
      type: "carry_on",
    });
  }
  if (bl.hold_weight) {
    bags.push({
      quantity: bl.hold_dimensions_sum ?? 1,
      weight: bl.hold_weight,
      unit: "kg",
      type: "checked",
    });
  }

  const uid = `kiwi-${offer.id}-${Date.now()}`;

  return {
    id: uid,
    offerId: uid,
    tripType: "multi-city",
    source: "kiwi",
    airline: firstRoute.airline_name || offer.airlines?.[0] || "Unknown",
    carrierCode: firstRoute.airline || offer.airlines?.[0] || "",
    flightNumber: `${firstRoute.airline ?? ""}${firstRoute.flight_no ?? ""}`,
    origin: offer.flyFrom || firstRoute.flyFrom || "--",
    originCity: offer.cityFrom || firstRoute.cityFrom || "",
    destination: offer.flyTo || lastRoute.flyTo || "--",
    destCity: offer.cityTo || lastRoute.cityTo || "",
    departureTime: timeOf(offer.local_departure),
    arrivalTime: timeOf(offer.local_arrival),
    duration: secsToDuration(offer.duration?.departure ?? 0),
    stops: Math.max(0, (offer.route?.length ?? 1) - 1),
    amount: parseFloat(totalPrice.toFixed(2)),
    currency,
    refundable: false, // Kiwi does not expose per-offer refundability at search level
    includedBags: bags,
    extraSlices,
    deepLink: offer.deep_link ?? undefined,
    rawOffer: offer,
  };
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetch top flights for a single leg from Kiwi v2 search.
 * Returns an empty array on error so multi-city search degrades gracefully.
 */
async function fetchLeg(
  leg: KiwiLeg,
  adults: number,
  currency: string,
): Promise<any[]> {
  try {
    const qs = new URLSearchParams({
      fly_from: leg.origin,
      fly_to: leg.destination,
      date_from: toKiwiDate(leg.date),
      date_to: toKiwiDate(leg.date),
      adults: String(adults),
      curr: currency,
      vehicle_type: "aircraft",
      partner: KIWI_AFFIL,
      limit: "30",
      sort: "price",
      one_for_city: "1",
    });

    const res = await fetch(`${KIWI_PROXY}/v2/search?${qs}`, {
      headers: { apikey: KIWI_KEY },
      signal: AbortSignal.timeout(14_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `[kiwiNomadApi] Leg ${leg.origin}→${leg.destination} HTTP ${res.status}: ${errText}`,
      );
      return [];
    }

    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn(
      `[kiwiNomadApi] Leg ${leg.origin}→${leg.destination} failed:`,
      err,
    );
    return [];
  }
}

// ─── Public search function ───────────────────────────────────────────────────

/**
 * Multi-city flight search via Kiwi Nomad / Tequila API.
 *
 * @param legs     Array of legs (at least 2).
 * @param adults   Number of adult passengers.
 * @param currency ISO currency code (default: USD).
 * @returns        Up to 15 combined multi-city itineraries.
 */
export async function searchKiwiMultiCity(
  legs: KiwiLeg[],
  adults = 1,
  currency = "USD",
): Promise<KiwiFlightResult[]> {
  if (legs.length < 2) {
    throw new Error(
      "[kiwiNomadApi] Multi-city search requires at least 2 legs.",
    );
  }

  console.log(
    `[kiwiNomadApi] Searching ${legs.length} legs via Kiwi Nomad:`,
    legs,
  );

  // Fetch all legs in parallel
  const allOffers = await Promise.all(
    legs.map((leg) => fetchLeg(leg, adults, currency)),
  );

  const [firstLegOffers, ...remainingLegsOffers] = allOffers;

  if (!firstLegOffers || firstLegOffers.length === 0) {
    console.warn("[kiwiNomadApi] First leg returned no results.");
    return [];
  }

  // For legs 2..N, pick the cheapest offer to build combined prices
  const cheapestPerRemainingLeg = remainingLegsOffers.map((offers) =>
    offers.length > 0
      ? [...offers].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0]
      : null,
  );

  const cheapestExtraTotal = cheapestPerRemainingLeg
    .filter(Boolean)
    .reduce((sum, o) => sum + (o!.price ?? 0), 0);

  // Build extraSlices from legs 2..N (using cheapest option per leg as reference display)
  const staticExtraSlices = cheapestPerRemainingLeg
    .filter(Boolean)
    .map((offer) => offerToExtraSlice(offer!));

  // Return up to 15 itineraries varying by first-leg option
  return firstLegOffers
    .slice(0, 15)
    .map((outOffer) =>
      mapOffer(
        outOffer,
        currency,
        (outOffer.price ?? 0) + cheapestExtraTotal,
        staticExtraSlices,
      ),
    );
}

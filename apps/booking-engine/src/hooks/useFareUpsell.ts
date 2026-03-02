/**
 * useFareUpsell — robust fare upsell business logic hook.
 *
 * Derives a set of 3 (or more) meaningful fare tiers from:
 *   1. A Flight object's real `upsells[]` array (populated by Duffel API offer-grouping
 *      in mapDuffelResponse() → each group is the same itinerary at different fare levels)
 *   2. Synthetic tier generation when no upsells exist (LCC / single-fare itineraries)
 *
 * Rules applied per tier:
 *   • Bags      — derived from the Duffel `includedBags` array (type + quantity + weight)
 *   • Flex      — derived from `refundable` flag
 *   • Price     — actual API price; synthetic tiers use configurable uplift factors
 *   • Labelling — cabin-class codes mapped to human names; Best Value / Most Flexible tags
 */

import { useMemo } from "react";

type FlightBag = {
  type?: string;
  quantity?: number;
  weight?: number;
};

type UpsellFlight = {
  id: string;
  fareId?: string;
  amount: number;
  cabin?: string;
  refundable?: boolean;
  includedBags?: FlightBag[];
  upsells?: UpsellFlight[];
};

export type FareBenefit = {
  label: string;
  included: boolean;
  price?: string;
};

export type FareFlexibility = {
  label: string;
  included: boolean;
  type?: "cancel" | "change";
  price?: string;
};

export type FareOption = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  cabin: string;
  benefits: FareBenefit[];
  flexibility: FareFlexibility[];
  keywords?: string[];
  notes?: string[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Synthetic uplift multipliers when no real upsells are available */
const SYNTHETIC_UPLIFT = {
  standard: 1.13, // +13 % → +1 checked bag
  flex: 1.45, // +45 % → fully flexible + seat selection
};

const CABIN_NAME: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
  // Duffel short codes
  y: "Economy",
  w: "Premium Economy",
  c: "Business",
  f: "First",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cabinLabel(raw?: string): string {
  if (!raw) return "Economy";
  const key = raw.toLowerCase().trim();
  return CABIN_NAME[key] ?? raw;
}

function buildBenefits(
  flight: UpsellFlight,
  tier: "light" | "standard" | "flex" | "api",
): FareBenefit[] {
  const bags = flight.includedBags ?? [];

  const carryOn = bags.find((b) => b.type === "carry_on");
  const checked = bags.filter((b) => b.type === "checked" || !b.type); // treat untyped bags as checked

  // ── 1. Personal item — always included
  const benefits: FareBenefit[] = [{ label: "Personal Item", included: true }];

  // ── 2. Carry-on
  if (tier === "api") {
    benefits.push({
      label: carryOn
        ? `Carry-on (${carryOn.quantity ?? 1} × ${carryOn.weight ?? 7} kg)`
        : "Carry-on Bag",
      included: !!carryOn,
      price: !carryOn ? "Fee applies" : undefined,
    });
  } else {
    // For synthetic tiers carry-on is always included (standard LCC practice)
    benefits.push({ label: "Carry-on Bag (7 kg)", included: true });
  }

  // ── 3. Checked bag(s)
  if (tier === "api") {
    if (checked.length === 0) {
      benefits.push({
        label: "1st Checked Bag",
        included: false,
        price: "Fee applies",
      });
    } else {
      checked.slice(0, 2).forEach((bag) => {
        benefits.push({
          label: `${bag.quantity ?? 1} × Checked Bag (${bag.weight ?? 23} kg)`,
          included: true,
        });
      });
    }
  } else if (tier === "light") {
    benefits.push({
      label: "1st Checked Bag",
      included: false,
      price: "Fee applies",
    });
  } else if (tier === "standard") {
    benefits.push({ label: "1 × Checked Bag (23 kg)", included: true });
  } else {
    // flex
    benefits.push({ label: "2 × Checked Bags (23 kg each)", included: true });
  }

  // ── 4. Seat selection
  const hasFreeSeat =
    tier === "flex" ||
    (tier === "api" &&
      (flight.refundable || /business|first/i.test(flight.cabin ?? "")));

  benefits.push({
    label: hasFreeSeat ? "Complimentary Seat Selection" : "Seat Selection",
    included: hasFreeSeat,
    price: !hasFreeSeat ? "Fee applies" : undefined,
  });

  // ── 5. Priority boarding (business / flex only)
  if (tier === "flex" || /business|first/i.test(flight.cabin ?? "")) {
    benefits.push({ label: "Priority Boarding", included: true });
  }

  // ── 6. Lounge access (business / first only)
  if (/business|first/i.test(flight.cabin ?? "")) {
    benefits.push({ label: "Lounge Access", included: true });
  }

  return benefits;
}

function buildFlexibility(
  refundable: boolean,
  tier: "light" | "standard" | "flex" | "api",
): FareFlexibility[] {
  if (tier === "flex" || refundable) {
    return [
      { label: "Fully Refundable", included: true, type: "cancel" },
      { label: "Free Date Change", included: true, price: "Free" },
    ];
  }
  if (tier === "standard") {
    return [
      { label: "Non-refundable", included: false, type: "cancel" },
      {
        label: "Date Change (fee applies)",
        included: false,
        price: "Fee applies",
      },
    ];
  }
  // light / api-non-refundable
  return [
    { label: "Non-refundable", included: false, type: "cancel" },
    { label: "No Date Changes Allowed", included: false, type: "change" },
  ];
}

function flightToFareOption(
  flight: UpsellFlight,
  overrides: Partial<FareOption> = {},
  tier: "light" | "standard" | "flex" | "api" = "api",
): FareOption {
  return {
    id: flight.fareId || flight.id,
    name: cabinLabel(flight.cabin),
    price: flight.amount,
    originalPrice: flight.amount,
    cabin: `${cabinLabel(flight.cabin)} Class`,
    benefits: buildBenefits(flight, tier),
    flexibility: buildFlexibility(!!flight.refundable, tier),
    ...overrides,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns a sorted array of FareOption tiers for the given flight.
 * The selected (currently chosen) fare ID is also returned so the
 * popup can pre-mark the correct column.
 */
export function useFareUpsell(flight: UpsellFlight | null | undefined): {
  fares: FareOption[];
  selectedFareId: string;
} {
  return useMemo(() => {
    if (!flight) return { fares: [], selectedFareId: "" };

    const baseFareId = flight.fareId || flight.id;

    // ── Case 1: Real upsells from Duffel API ─────────────────────────────────
    if (flight.upsells && flight.upsells.length > 0) {
      const allFares: UpsellFlight[] = [flight, ...flight.upsells];
      const sorted = [...allFares].sort((a, b) => a.amount - b.amount);

      // Compute a "best value" index — we pick the tier that has checked bags
      // at the lowest price jump (typically second-cheapest).
      let bestValueIdx = sorted.length > 2 ? 1 : 0;

      const fares = sorted.map((f, idx) => {
        const keywords: string[] = [];
        if (idx === bestValueIdx) keywords.push("Best Value");
        if (f.refundable) keywords.push("Most Flexible");

        return flightToFareOption(
          f,
          {
            id: f.fareId || f.id,
            keywords: keywords.length ? keywords : undefined,
            notes: [
              "* All weights per adult passenger",
              "** Checked bag max 158 cm (L+W+H)",
            ],
          },
          "api",
        );
      });

      return { fares, selectedFareId: baseFareId };
    }

    // ── Case 2: No real upsells — generate 3 synthetic tiers ─────────────────
    const basePrice = flight.amount;

    const lightFare: FareOption = flightToFareOption(
      flight,
      {
        id: `${baseFareId}-light`,
        name: "Economy Light",
        price: basePrice,
        originalPrice: basePrice,
        cabin: "Economy (Light)",
        notes: ["* Carry-on included up to 7 kg"],
      },
      "light",
    );

    const stdPrice = Math.round(basePrice * SYNTHETIC_UPLIFT.standard);
    const standardFare: FareOption = flightToFareOption(
      flight,
      {
        id: `${baseFareId}-std`,
        name: "Economy Plus",
        price: stdPrice,
        originalPrice: stdPrice,
        cabin: "Economy (Plus)",
        keywords: ["Best Value"],
        notes: [
          "* Carry-on included up to 7 kg",
          "** Checked bag included up to 23 kg",
        ],
      },
      "standard",
    );

    const flexPrice = Math.round(basePrice * SYNTHETIC_UPLIFT.flex);
    const flexFare: FareOption = flightToFareOption(
      flight,
      {
        id: `${baseFareId}-flex`,
        name: "Flex",
        price: flexPrice,
        originalPrice: flexPrice,
        cabin: "Economy (Flex)",
        keywords: ["Most Flexible"],
        notes: [
          "* Carry-on included up to 7 kg",
          "** 2 checked bags up to 23 kg each",
        ],
      },
      "flex",
    );

    return {
      fares: [lightFare, standardFare, flexFare],
      selectedFareId: `${baseFareId}-light`,
    };
  }, [flight]);
}

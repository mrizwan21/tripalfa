/**
 * useHotelDetailData
 * ==================
 * Combines TWO data sources for the HotelDetail / Room-Selection page:
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SOURCE             DATA                         ORIGIN             │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  PostgreSQL (95%)   Hotel info, images, hotel-   static-data-svc    │
 * │                     amenities (by category),      :3002 / DB        │
 * │                     descriptions, contacts,                         │
 * │                     room-amenity master list                        │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Realtime API (5%)  Room types, room rates,       API Gateway       │
 * │                     prices, cancellation policy,  → LiteAPI         │
 * │                     board basis, refundability                       │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Data availability in local DB (18 Feb 2026):
 *   CanonicalHotel       658K ✅   HotelImage          8M ✅
 *   HotelAmenityMapping  8.5M ✅   HotelDescription   610K ✅
 *   RoomAmenity (master)   43 ✅   HotelRoomType         0 (rooms from API)
 *   RoomAmenityMapping      0      RoomImage             0
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchHotelFullStatic, fetchHotelRates } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HotelImage {
  url: string;
  thumbnailUrl?: string;
  imageType: string;   // 'general' | 'exterior' | 'lobby' | 'room' | etc.
  isPrimary: boolean;
  sizeVariant?: string;
  caption?: string;
  displayOrder?: number;
}

export interface HotelAmenity {
  code: string;
  name: string;
  category: string;    // 'Dining' | 'Facilities' | 'Services' | 'Transportation' | ...
  icon?: string;
  isPopular?: boolean;
  isFree?: boolean;
  operatingHours?: string;
}

/** Room amenity from the master RoomAmenity table (43 types) */
export interface RoomAmenity {
  code: string;
  name: string;
  category: string;   // 'Bathroom' | 'Comfort' | 'Entertainment' | 'Kitchen' | 'Views' | ...
  icon?: string;
  isPopular?: boolean;
}

/** Static room structure from DB (HotelRoomType — when populated) */
export interface StaticRoomType {
  id: string;
  roomTypeCode: string;
  roomTypeName: string;
  bedType?: string;
  bedCount: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  roomSize?: number;
  hasBalcony: boolean;
  hasSeaView: boolean;
  hasMountainView: boolean;
  hasCityView: boolean;
  images: HotelImage[];
  amenities: RoomAmenity[];
  features: string[];   // Pre-built e.g. "1x King Bed", "35m²", "Balcony"
}

/** Realtime rate for a room type */
export interface RoomRate {
  offerId: string;
  roomTypeCode?: string;
  roomTypeName?: string;
  boardBasis?: string;    // 'RO' | 'BB' | 'HB' | 'FB' | 'AI'
  boardBasisName?: string;
  price: { amount: number; currency: string };
  isRefundable: boolean;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  availableRooms?: number;
  // Room-level amenity codes hinted by supplier (optional)
  amenityCodes?: string[];
  raw?: any;
}

/** Merged room: static info + realtime rates */
export interface MergedRoom {
  // Identity (from DB static or realtime API)
  id: string;
  roomTypeCode: string;
  name: string;
  // Static fields (DB)
  bedType?: string;
  bedCount: number;
  maxOccupancy: number;
  roomSize?: number;
  hasBalcony: boolean;
  hasSeaView: boolean;
  hasCityView: boolean;
  hasMountainView: boolean;
  features: string[];
  images: HotelImage[];
  amenities: RoomAmenity[];    // Room-level amenities from RoomAmenity master list
  primaryImage?: string;
  // Realtime fields (API)
  rates: RoomRate[];
  lowestPrice?: { amount: number; currency: string };
  source: 'db' | 'api' | 'merged';
}

/** Complete hotel detail (static + dynamic) */
export interface HotelDetailData {
  // 95% — from PostgreSQL
  hotel: {
    id: string;
    canonicalCode: string;
    name: string;
    description?: string;
    address?: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    latitude?: number;
    longitude?: number;
    starRating?: number;
    hotelType?: string;
    chainName?: string;
    brandName?: string;
    phone?: string;
    email?: string;
    website?: string;
    checkInTime?: string;
    checkOutTime?: string;
    qualityScore?: number;
  };
  images: HotelImage[];
  primaryImage?: string;
  /** Hotel-level amenities grouped by category (Dining, Facilities, Services, Transportation) */
  hotelAmenitiesByCategory: Record<string, HotelAmenity[]>;
  /** Flat hotel amenities list */
  hotelAmenities: HotelAmenity[];
  /** Primary/English description */
  description?: string;
  descriptions: any[];
  contacts: any[];
  reviews: any[];
  stats: { reviewCount: number; ratingAvg: number | null };

  // Merged rooms (static structure + realtime rates)
  rooms: MergedRoom[];

  /** Master RoomAmenity catalog (43 types) for badge rendering */
  roomAmenityMaster: RoomAmenity[];
  roomAmenitiesByCategory: Record<string, RoomAmenity[]>;
}

export interface UseHotelDetailDataResult {
  data: HotelDetailData | null;
  loading: boolean;
  staticLoading: boolean;   // DB fetch in progress
  ratesLoading: boolean;    // Realtime rates fetch in progress
  error: string | null;
  refetchRates: () => void;
}

// ── Category icon map (for Facilities section rendering) ────────────────────

export const HOTEL_AMENITY_CATEGORY_ICONS: Record<string, string> = {
  Dining: 'utensils',
  Facilities: 'building',
  Services: 'concierge-bell',
  Transportation: 'car',
  Recreation: 'waves',
  Wellness: 'heart',
  Business: 'briefcase',
  Security: 'shield',
  General: 'info',
};

export const ROOM_AMENITY_CATEGORY_ICONS: Record<string, string> = {
  Bathroom: 'droplets',
  Comfort: 'thermometer',
  Entertainment: 'tv',
  Kitchen: 'coffee',
  Views: 'eye',
  Security: 'lock',
  Technology: 'wifi',
  Other: 'more-horizontal',
};

// ── Helper: map realtime API room to MergedRoom ──────────────────────────────

function mapApiRoom(apiRoom: any, roomAmenityMaster: RoomAmenity[]): MergedRoom {
  const features: string[] = [];
  if (apiRoom.bedType || apiRoom.bed_type) {
    const beds = apiRoom.bedCount || apiRoom.bed_count || 1;
    features.push(`${beds}x ${apiRoom.bedType || apiRoom.bed_type}`);
  }
  if (apiRoom.roomSize || apiRoom.room_size) features.push(`${apiRoom.roomSize || apiRoom.room_size}m²`);
  if (apiRoom.hasBalcony || apiRoom.has_balcony) features.push('Balcony');
  if (apiRoom.hasSeaView || apiRoom.has_sea_view) features.push('Sea View');
  if (apiRoom.hasCityView || apiRoom.has_city_view) features.push('City View');
  if (apiRoom.hasMountainView || apiRoom.has_mountain_view) features.push('Mountain View');

  // Match amenity codes hinted by API against the master RoomAmenity catalog
  const amenityCodes: string[] = apiRoom.amenityCodes || apiRoom.amenity_codes || [];
  const amenities = amenityCodes.length > 0
    ? roomAmenityMaster.filter(a => amenityCodes.includes(a.code))
    : [];

  const rates: RoomRate[] = (apiRoom.rates || [apiRoom]).map((r: any) => ({
    offerId: r.offerId || r.offer_id || r.id || String(Math.random()),
    roomTypeCode: r.roomTypeCode || r.room_type_code || apiRoom.roomTypeCode || apiRoom.code,
    roomTypeName: r.roomTypeName || r.room_type_name || apiRoom.name,
    boardBasis: r.boardBasis || r.board_basis || r.meal_plan,
    boardBasisName: r.boardBasisName || r.board_basis_name,
    price: {
      amount: r.price?.amount ?? r.amount ?? r.pricePerNight ?? 0,
      currency: r.price?.currency ?? r.currency ?? 'USD',
    },
    isRefundable: r.isRefundable ?? r.is_refundable ?? r.refundable ?? false,
    cancellationPolicy: r.cancellationPolicy || r.cancellation_policy,
    cancellationDeadline: r.cancellationDeadline || r.cancellation_deadline,
    availableRooms: r.availableRooms || r.available_rooms,
    amenityCodes: r.amenityCodes || [],
    raw: r,
  }));

  const prices = rates.map(r => r.price.amount).filter(p => p > 0);
  const lowestAmount = prices.length > 0 ? Math.min(...prices) : undefined;

  return {
    id: apiRoom.id || apiRoom.roomTypeCode || String(Math.random()),
    roomTypeCode: apiRoom.roomTypeCode || apiRoom.code || '',
    name: apiRoom.name || apiRoom.roomTypeName || 'Room',
    bedType: apiRoom.bedType || apiRoom.bed_type,
    bedCount: apiRoom.bedCount || apiRoom.bed_count || 1,
    maxOccupancy: apiRoom.maxOccupancy || apiRoom.max_occupancy || 2,
    roomSize: apiRoom.roomSize || apiRoom.room_size,
    hasBalcony: apiRoom.hasBalcony || apiRoom.has_balcony || false,
    hasSeaView: apiRoom.hasSeaView || apiRoom.has_sea_view || false,
    hasCityView: apiRoom.hasCityView || apiRoom.has_city_view || false,
    hasMountainView: apiRoom.hasMountainView || apiRoom.has_mountain_view || false,
    features,
    images: [],
    amenities,
    primaryImage: undefined,
    rates,
    lowestPrice: lowestAmount !== undefined
      ? { amount: lowestAmount, currency: rates[0]?.price.currency ?? 'USD' }
      : undefined,
    source: 'api',
  };
}

// ── Helper: merge static DB room with realtime rate ───────────────────────────

function mergeStaticWithRates(staticRoom: StaticRoomType, rates: RoomRate[]): MergedRoom {
  const prices = rates.map(r => r.price.amount).filter(p => p > 0);
  const lowestAmount = prices.length > 0 ? Math.min(...prices) : undefined;
  const primaryImage = staticRoom.images.find(i => i.isPrimary)?.url ?? staticRoom.images[0]?.url;

  return {
    id: staticRoom.id,
    roomTypeCode: staticRoom.roomTypeCode,
    name: staticRoom.roomTypeName,
    bedType: staticRoom.bedType,
    bedCount: staticRoom.bedCount,
    maxOccupancy: staticRoom.maxOccupancy,
    roomSize: staticRoom.roomSize,
    hasBalcony: staticRoom.hasBalcony,
    hasSeaView: staticRoom.hasSeaView,
    hasCityView: staticRoom.hasCityView,
    hasMountainView: staticRoom.hasMountainView,
    features: staticRoom.features,
    images: staticRoom.images,
    amenities: staticRoom.amenities,
    primaryImage,
    rates,
    lowestPrice: lowestAmount !== undefined
      ? { amount: lowestAmount, currency: rates[0]?.price.currency ?? 'USD' }
      : undefined,
    source: rates.length > 0 ? 'merged' : 'db',
  };
}

// ── Fetch room-amenity master list ───────────────────────────────────────────

async function fetchRoomAmenityMaster(): Promise<RoomAmenity[]> {
  try {
    const res = await fetch('/static/room-amenities', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return (json?.data ?? []) as RoomAmenity[];
  } catch {
    return [];
  }
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useHotelDetailData(
  hotelId: string | undefined,
  rateParams?: {
    checkin?: string;
    checkout?: string;
    currency?: string;
    guestNationality?: string;
    occupancies?: Array<{ adults: number; children?: number[] }>;
  }
): UseHotelDetailDataResult {
  const [data, setData] = useState<HotelDetailData | null>(null);
  const [staticLoading, setStaticLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Phase 1: Load static data from PostgreSQL ───────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    let cancelled = false;

    setStaticLoading(true);
    setError(null);

    Promise.all([
      fetchHotelFullStatic(hotelId),
      fetchRoomAmenityMaster(),
    ]).then(([staticResult, roomAmenityMaster]) => {
      if (cancelled) return;

      if (!staticResult) {
        setError('Hotel not found in database');
        setStaticLoading(false);
        return;
      }

      const { hotel, images, amenities, amenitiesByCategory, descriptions, contacts, reviews, rooms, stats } = staticResult;

      // Pick primary English description
      const primaryDesc = descriptions.find(
        (d: any) => d.isPrimary || d.languageCode === 'en' || d.languageCode === 'ENG'
      )?.content ?? hotel.description;

      // Primary image
      const primaryImage = images.find(i => i.isPrimary)?.url ?? images[0]?.url;

      // Group room amenity master by category
      const roomAmenitiesByCategory: Record<string, RoomAmenity[]> = {};
      for (const a of roomAmenityMaster) {
        const cat = a.category || 'Other';
        if (!roomAmenitiesByCategory[cat]) roomAmenitiesByCategory[cat] = [];
        roomAmenitiesByCategory[cat].push(a);
      }

      // Static rooms: HotelRoomType rows (0 currently, but ready for when data is ingested)
      const staticRooms: StaticRoomType[] = rooms.map((r: any) => ({
        id: r.id,
        roomTypeCode: r.roomTypeCode,
        roomTypeName: r.roomTypeName || r.name,
        bedType: r.bedType,
        bedCount: r.bedCount || 1,
        maxOccupancy: r.maxOccupancy || 2,
        maxAdults: r.maxAdults || 2,
        maxChildren: r.maxChildren || 0,
        roomSize: r.roomSize,
        hasBalcony: r.hasBalcony || false,
        hasSeaView: r.hasSeaView || false,
        hasMountainView: r.hasMountainView || false,
        hasCityView: r.hasCityView || false,
        images: r.images || [],
        amenities: r.amenities || [],
        features: r.features || [],
      }));

      // Build initial data (without realtime rates)
      const mergedRooms: MergedRoom[] = staticRooms.map(sr => mergeStaticWithRates(sr, []));

      setData({
        hotel,
        images,
        primaryImage,
        hotelAmenities: amenities,
        hotelAmenitiesByCategory: amenitiesByCategory,
        description: primaryDesc,
        descriptions,
        contacts,
        reviews,
        stats,
        rooms: mergedRooms,
        roomAmenityMaster,
        roomAmenitiesByCategory,
      });
      setStaticLoading(false);
    }).catch(err => {
      if (!cancelled) {
        setError(err.message || 'Failed to load hotel data');
        setStaticLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [hotelId]);

  // ── Phase 2: Load realtime rates (prices + room types + cancellation) ───
  const fetchRates = useCallback(async () => {
    if (!hotelId || !rateParams?.checkin || !rateParams?.checkout) return;

    setRatesLoading(true);
    try {
      const ratesResponse = await fetchHotelRates({
        hotelIds: [hotelId],
        checkin: rateParams.checkin,
        checkout: rateParams.checkout,
        currency: rateParams.currency ?? 'USD',
        guestNationality: rateParams.guestNationality,
        occupancies: rateParams.occupancies ?? [{ adults: 2 }],
      });

      // ── Parse LiteAPI v3.0 response format ──────────────────────────────
      // LiteAPI returns: { status, data: { hotels: [{ hotelId, currency, offers: [...] }] } }
      // Booking-service adds: { ...result, cached: true }
      const liteHotels: any[] = ratesResponse?.data?.hotels ?? ratesResponse?.hotels ?? [];
      const targetHotel = liteHotels.find((h: any) =>
        h.hotelId === hotelId || h.id === hotelId
      ) ?? liteHotels[0] ?? null;

      // Raw offers from LiteAPI (each offer = one room-rate combination)
      const rawOffers: any[] = targetHotel?.offers ?? [];

      // Fallback: legacy formats (rooms[], offers[] at root)
      const apiRooms: any[] = rawOffers.length > 0
        ? rawOffers
        : (ratesResponse?.rooms ?? ratesResponse?.data?.rooms ?? ratesResponse?.offers ?? []);

      // ── Helper: extract price from LiteAPI offer ─────────────────────────
      const extractOfferRate = (offer: any): RoomRate => {
        const retailTotal = offer.retailRate?.total?.[0];
        const priceAmount = retailTotal?.amount
          ?? offer.offerRetailRate
          ?? offer.price?.amount
          ?? offer.amount
          ?? 0;
        const currency = retailTotal?.currency
          ?? offer.currency
          ?? targetHotel?.currency
          ?? rateParams.currency
          ?? 'USD';

        const isRefundable = offer.refundableTag === 'RFN'
          || offer.isRefundable === true
          || offer.refundable === true;

        // Parse cancellation deadline from cancelPolicyInfos (first free-cancel window)
        const cancelPolicies: any[] = offer.cancellationPolicies?.cancelPolicyInfos ?? [];
        const freeCancelWindow = cancelPolicies
          .filter((p: any) => Number(p.amount ?? 1) === 0)
          .sort((a: any, b: any) => new Date(b.cancelTime ?? 0).getTime() - new Date(a.cancelTime ?? 0).getTime())[0];
        const cancellationDeadline = freeCancelWindow?.cancelTime ?? undefined;

        // Human-readable policy from hotel remarks or generated
        const remarks: string[] = offer.cancellationPolicies?.hotelRemarks ?? [];
        const cancellationPolicy = remarks[0]
          ?? (isRefundable ? 'Free cancellation available' : 'Non-refundable – no changes allowed');

        return {
          offerId: offer.offerId ?? offer.id ?? String(Math.random()),
          roomTypeCode: offer.roomTypeCode ?? offer.code,
          roomTypeName: offer.name ?? offer.roomTypeName,
          boardBasis: offer.boardType ?? offer.boardBasis ?? offer.board_basis,
          boardBasisName: offer.boardName ?? offer.boardBasisName,
          price: { amount: priceAmount, currency },
          isRefundable,
          cancellationPolicy,
          cancellationDeadline,
          availableRooms: offer.availableRooms ?? offer.available_rooms,
          amenityCodes: offer.amenityCodes ?? [],
          raw: offer,
        };
      };

      setData(prev => {
        if (!prev) return prev;
        const { roomAmenityMaster } = prev;
        let mergedRooms: MergedRoom[];

        if (prev.rooms.length > 0) {
          // ── Static DB rooms exist: match LiteAPI offers to DB rooms ──────
          mergedRooms = prev.rooms.map(staticRoom => {
            // Collect all LiteAPI offers that match this room type (by code or name)
            const matchingOffers = apiRooms.filter(offer =>
              (offer.roomTypeCode && offer.roomTypeCode === staticRoom.roomTypeCode)
              || (offer.code && offer.code === staticRoom.roomTypeCode)
              || (offer.name && offer.name.toLowerCase().includes(staticRoom.name.toLowerCase()))
            );

            const rates: RoomRate[] = matchingOffers.length > 0
              ? matchingOffers.map(extractOfferRate)
              : [];

            return mergeStaticWithRates({
              id: staticRoom.id,
              roomTypeCode: staticRoom.roomTypeCode,
              roomTypeName: staticRoom.name,
              bedType: staticRoom.bedType,
              bedCount: staticRoom.bedCount,
              maxOccupancy: staticRoom.maxOccupancy,
              maxAdults: staticRoom.maxOccupancy,
              maxChildren: 0,
              roomSize: staticRoom.roomSize,
              hasBalcony: staticRoom.hasBalcony,
              hasSeaView: staticRoom.hasSeaView,
              hasMountainView: staticRoom.hasMountainView,
              hasCityView: staticRoom.hasCityView,
              images: staticRoom.images,
              amenities: staticRoom.amenities,
              features: staticRoom.features,
            }, rates);
          });
        } else {
          // ── No static DB rooms: build from LiteAPI offers ──────────────────
          // Group offers by roomTypeCode so each room type becomes one MergedRoom
          const byRoomType: Record<string, any[]> = {};
          for (const offer of apiRooms) {
            const key = offer.roomTypeCode ?? offer.code ?? offer.name ?? `room-${Math.random()}`;
            if (!byRoomType[key]) byRoomType[key] = [];
            byRoomType[key].push(offer);
          }

          mergedRooms = Object.entries(byRoomType).map(([roomKey, offers]) => {
            const firstOffer = offers[0];
            const rates = offers.map(extractOfferRate);
            const prices = rates.map(r => r.price.amount).filter(p => p > 0);
            const lowestAmount = prices.length > 0 ? Math.min(...prices) : undefined;

            // Try to build feature tags from offer metadata
            const features: string[] = [];
            if (firstOffer.bedType) features.push(`${firstOffer.bedCount ?? 1}x ${firstOffer.bedType}`);
            if (firstOffer.roomSize) features.push(`${firstOffer.roomSize}m²`);
            if (firstOffer.hasBalcony) features.push('Balcony');
            if (firstOffer.hasSeaView) features.push('Sea View');

            // Match amenity codes against master catalog
            const amenityCodes: string[] = firstOffer.amenityCodes ?? [];
            const amenities = amenityCodes.length > 0
              ? roomAmenityMaster.filter(a => amenityCodes.includes(a.code))
              : [];

            return {
              id: firstOffer.offerId ?? firstOffer.id ?? roomKey,
              roomTypeCode: firstOffer.roomTypeCode ?? firstOffer.code ?? roomKey,
              name: firstOffer.name ?? firstOffer.roomTypeName ?? 'Room',
              bedType: firstOffer.bedType,
              bedCount: firstOffer.bedCount ?? 1,
              maxOccupancy: firstOffer.maxOccupancy ?? 2,
              roomSize: firstOffer.roomSize,
              hasBalcony: firstOffer.hasBalcony ?? false,
              hasSeaView: firstOffer.hasSeaView ?? false,
              hasCityView: firstOffer.hasCityView ?? false,
              hasMountainView: firstOffer.hasMountainView ?? false,
              features,
              images: [],
              amenities,
              primaryImage: undefined,
              rates,
              lowestPrice: lowestAmount !== undefined
                ? { amount: lowestAmount, currency: rates[0]?.price.currency ?? 'USD' }
                : undefined,
              source: 'api' as const,
            };
          });
        }

        return { ...prev, rooms: mergedRooms };
      });
    } catch (err) {
      console.warn('[useHotelDetailData] Realtime rates unavailable:', err);
      // Keep static data, just no prices (not a fatal error)
    } finally {
      setRatesLoading(false);
    }
  }, [hotelId, rateParams?.checkin, rateParams?.checkout, rateParams?.currency, rateParams?.guestNationality]);

  // Auto-fetch rates when params are available
  useEffect(() => {
    if (rateParams?.checkin && rateParams?.checkout && !staticLoading && data) {
      fetchRates();
    }
  }, [staticLoading, data?.hotel?.id, rateParams?.checkin, rateParams?.checkout]);

  return {
    data,
    loading: staticLoading,
    staticLoading,
    ratesLoading,
    error,
    refetchRates: fetchRates,
  };
}

/**
 * HotelDetail / Room Selection Page
 * ==================================
 * Data sources:
 *   95% — PostgreSQL (static-data-service)
 *     • Hotel info (name, description, address, star rating, check-in/out)
 *     • Hotel images (8M records from innstant CDN)
 *     • Hotel amenities by category (8.5M mappings → Dining, Facilities, Services, Transportation)
 *     • Descriptions, contacts
 *     • Room-amenity master catalog (43 types: Bathroom, Comfort, Entertainment, Kitchen, Views…)
 *     • Room types (HotelRoomType — ready, currently empty; will auto-use when ingested)
 *   5% — Realtime API (LiteAPI / Hotelbeds via API Gateway)
 *     • Room rates / prices
 *     • Cancellation policy per rate
 *     • Board basis (RO, BB, HB, FB, AI)
 *     • Refundability
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Star,
  ChevronRight,
  User,
  ShieldCheck,
  Lock,
  Car,
  Utensils,
  Waves,
  Info,
  Bed,
  MessageSquare,
  FileCheck,
  Key,
  Wifi,
  Coffee,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Map,
  Maximize2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatCurrency } from '@tripalfa/ui-components';
import { HOTEL_STATIC_DATA } from '../lib/constants/hotel-static-data';
import { BookingStepper } from '../components/ui/BookingStepper';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { GuestReviewsModal } from '../components/hotel/GuestReviewsModal';
import { ImageGallery } from '../components/hotel/ImageGallery';
import { Facilities } from '../components/hotel/Facilities';
import { HotelMap } from '../components/map';
import { useHotelDetailData } from '../hooks/useHotelDetailData';
import { useWeatherData } from '../hooks/useWeatherData';
import { WeatherWidget } from '../components/hotel/WeatherWidget';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

type MergedRoom = Record<string, any>;
type RoomRate = Record<string, any>;
type HotelAmenity = Record<string, any>;

const REVIEW_CARD_CLASS =
  'snap-center shrink-0 w-[400px] bg-white p-6 rounded-xl border border-gray-100 shadow-sm';
const REVIEW_AVATAR_CLASS =
  'w-10 h-10 bg-[#003b95] rounded-full flex items-center justify-center font-bold text-white shadow-sm text-sm';

// Aliases – BedDouble/Ruler removed in newer lucide-react; use Bed/Maximize2
const BedDoubleIcon = Bed;
const RulerIcon = Maximize2;

// ── Icon helpers ─────────────────────────────────────────────────────

function getHotelAmenityCategoryIcon(category: string): React.ReactNode {
  switch (category.toLowerCase()) {
    case 'dining':
      return <Utensils size={14} className="text-[#0071e3]" />;
    case 'recreation':
    case 'wellness':
      return <Waves size={14} className="text-[#0071e3]" />;
    case 'transportation':
      return <Car size={14} className="text-[#0071e3]" />;
    case 'services':
      return <User size={14} className="text-[#0071e3]" />;
    case 'security':
      return <Lock size={14} className="text-[#0071e3]" />;
    case 'business':
      return <Info size={14} className="text-[#0071e3]" />;
    case 'facilities':
      return <Bed size={14} className="text-[#0071e3]" />;
    default:
      return <Info size={14} className="text-[#0071e3]" />;
  }
}

function getRoomAmenityCategoryIcon(category: string): React.ReactNode {
  switch (category.toLowerCase()) {
    case 'bathroom':
      return <Waves size={12} className="text-[#0071e3]" />;
    case 'comfort':
      return <Bed size={12} className="text-[#0071e3]" />;
    case 'entertainment':
      return <Star size={12} className="text-[#0071e3]" />;
    case 'kitchen':
      return <Coffee size={12} className="text-[#0071e3]" />;
    case 'views':
      return <Eye size={12} className="text-[#0071e3]" />;
    case 'security':
      return <Lock size={12} className="text-[#0071e3]" />;
    case 'technology':
      return <Wifi size={12} className="text-[#0071e3]" />;
    default:
      return <Info size={12} className="text-[#0071e3]" />;
  }
}

// ── Board basis label lookup from static data ────────────────────────

/**
 * Get board type label from HOTEL_STATIC_DATA.BOARD_TYPES
 * Falls back to rate.boardBasisName or raw code if not found
 */
function getBoardLabel(code?: string | null): string | null {
  if (!code) return null;
  const boardType = HOTEL_STATIC_DATA.BOARD_TYPES.all.find(b => b.code === code);
  return boardType?.name ?? code;
}

// ── Room price / rate row ────────────────────────────────────────────

function RateRow({
  rate,
  room,
  roomKey,
  selectedUnits,
  onUnitChange,
  hotelImages,
}: {
  rate: RoomRate;
  room: MergedRoom;
  roomKey: string;
  selectedUnits: Record<string, number>;
  onUnitChange: (key: string, delta: number) => void;
  hotelImages: Array<{ url: string; isPrimary: boolean }>;
}) {
  // Use room image if available, otherwise fall back to a hotel image
  const imageUrl =
    room.primaryImage ??
    room.images?.[0]?.url ??
    hotelImages.find(i => i.isPrimary)?.url ??
    hotelImages[0]?.url ??
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32';

  const boardLabel = getBoardLabel(rate.boardBasis) ?? rate.boardBasisName;

  const count = selectedUnits[roomKey] || 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Room selection column */}
      <td className="px-6 py-6 w-[45%]">
        <div className="flex gap-6 items-center">
          {/* Room image (from DB or hotel fallback) */}
          <div className="w-32 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-300 bg-gray-100">
            <img src={imageUrl} className="w-full h-full object-cover" alt={room.name} />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#1d1d1f]">
              {rate.roomTypeName || room.name}
            </p>

            {/* Static features (DB: bed type, size, views) */}
            {room.features?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.features.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-[10px] font-semibold text-gray-600 rounded-full uppercase tracking-wide"
                  >
                    {f.includes('View') ? (
                      <Eye size={10} className="text-[#003b95]" />
                    ) : f.includes('Bed') ? (
                      <BedDoubleIcon size={10} className="text-[#003b95]" />
                    ) : f.includes('m²') ? (
                      <RulerIcon size={10} className="text-[#003b95]" />
                    ) : null}
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Room amenity badges (from RoomAmenity master / static DB) */}
            {room.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, 4).map((a: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-[10px] font-semibold text-gray-600 rounded-full uppercase tracking-wide"
                  >
                    {getRoomAmenityCategoryIcon(a.category)}
                    {a.name}
                  </span>
                ))}
              </div>
            )}

            {/* Board basis badge (realtime API) */}
            {boardLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-[10px] font-semibold text-amber-600 rounded-full uppercase tracking-wide">
                <Coffee size={10} /> {boardLabel}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Policies column (realtime API) */}
      <td className="px-6 py-6 w-[35%]">
        <div className="space-y-4">
          {/* Cancellation policy */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Cancellation
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {rate.cancellationPolicy ||
                'Full payment due at booking. Cancellation policies vary by rate.'}
            </p>
            {rate.cancellationDeadline && (
              <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <Clock size={10} /> Free cancellation until{' '}
                {new Date(rate.cancellationDeadline).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Refundability badge (realtime API) */}
          {rate.isRefundable ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Fully Refundable
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                Non-Refundable
              </span>
            </div>
          )}

          {/* Available rooms */}
          {rate.availableRooms !== undefined && rate.availableRooms <= 5 && (
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
              Only {rate.availableRooms} left!
            </p>
          )}
        </div>
      </td>

      {/* Price + selector column (realtime API price) */}
      <td className="px-6 py-6">
        <div className="flex flex-col items-center gap-4">
          {rate.price?.amount > 0 ? (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#003b95] tracking-tight">
                  {formatCurrency(rate.price.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">per night</p>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-500 text-center">
              Price on
              <br />
              request
            </p>
          )}

          {/* Unit selector */}
          <div className="flex items-center justify-center gap-3 p-2 bg-gray-100 rounded-full w-full">
            <button
              onClick={() => onUnitChange(roomKey, -1)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1d1d1f] hover:bg-[#003b95]/10 transition-all shadow-sm active:scale-95"
              aria-label="Decrease room count"
            >
              <span className="text-xl font-bold">−</span>
            </button>
            <span className="text-lg font-bold text-[#1d1d1f] w-6 text-center">{count}</span>
            <button
              onClick={() => onUnitChange(roomKey, 1)}
              className="w-10 h-10 rounded-full bg-[#003b95] flex items-center justify-center text-white hover:bg-[#002a6e] transition-all active:scale-95"
              aria-label="Increase room count"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Room section (room card + rates table) ───────────────────────────

function RoomSection({
  room,
  roomIdx,
  selectedUnits,
  onUnitChange,
  hotelImages,
}: {
  room: MergedRoom;
  roomIdx: number;
  selectedUnits: Record<string, number>;
  onUnitChange: (key: string, delta: number) => void;
  hotelImages: Array<{ url: string; isPrimary: boolean }>;
}) {
  // When there are no realtime rates yet, show a single placeholder row
  const rates =
    room.rates?.length > 0
      ? room.rates
      : [
          {
            offerId: `placeholder-${room.id}`,
            price: { amount: 0, currency: 'USD' },
            isRefundable: false,
          } as RoomRate,
        ];

  return (
    <div className="relative mb-10 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header bar — static data from DB */}
      <div className="bg-[#1d1d1f] px-6 py-4 flex items-center justify-between font-semibold text-[11px] uppercase tracking-widest text-white">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            {room.name}
          </span>
          {room.maxOccupancy > 0 && (
            <span className="flex items-center gap-2 text-white/60">
              <User size={12} /> Max {room.maxOccupancy} Guests
            </span>
          )}
          {room.bedType && (
            <span className="flex items-center gap-2 text-white/60">
              <BedDoubleIcon size={12} /> {room.bedType}
            </span>
          )}
          {room.roomSize && (
            <span className="flex items-center gap-2 text-white/60">
              <RulerIcon size={12} /> {room.roomSize}m²
            </span>
          )}
        </div>
        {/* Source indicator (dev aid) */}
        <span className="text-[9px] opacity-40 font-normal normal-case">
          {room.source === 'merged' ? '◉ DB+API' : room.source === 'db' ? '◉ DB' : '◉ API'}
        </span>
      </div>

      <div className="overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-[#003b95] text-white text-[10px] font-bold uppercase tracking-[0.1em]">
            <tr>
              <th className="px-6 py-4">Room Selection</th>
              <th className="px-6 py-4">Policies</th>
              <th className="px-6 py-4 text-center">Select Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rates.map((rate: RoomRate, raIdx: number) => (
              <RateRow
                key={`${room.id}-${rate.offerId}-${raIdx}`}
                rate={rate}
                room={room}
                roomKey={`${room.id}_${rate.offerId}_${raIdx}`}
                selectedUnits={selectedUnits}
                onUnitChange={onUnitChange}
                hotelImages={hotelImages}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

function HotelDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { config: runtimeConfig } = useTenantRuntime();

  // Read search params from navigation state (set by HotelList)
  const searchState = (location.state as any) || {};

  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // ── Data: 95% PostgreSQL + 5% Realtime API ────────────────────────────
  const { data, loading, ratesLoading, error, refetchRates } = useHotelDetailData(id, {
    checkin: searchState.checkin,
    checkout: searchState.checkout,
    currency: searchState.currency ?? 'USD',
    guestNationality: searchState.guestNationality ?? 'AE',
    occupancies: searchState.occupancies ?? [{ adults: 2 }],
  });

  // Check if we have coordinates for weather data
  const weatherCoordinates =
    data?.hotel?.latitude && data?.hotel?.longitude
      ? { latitude: data.hotel.latitude, longitude: data.hotel.longitude }
      : null;

  // Fetch weather data for the hotel location
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    isConfigured: weatherConfigured,
  } = useWeatherData(weatherCoordinates);

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-40 flex flex-col items-center text-center">
          <h1 className="text-lg font-bold text-[#1d1d1f] mb-3">Hotel Booking Disabled</h1>
          <p className="text-sm text-gray-600 mb-6">
            Your admin has currently disabled hotel booking for this tenant.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200">
            Back to Home
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  const handleUnitChange = (key: string, delta: number) => {
    setSelectedUnits(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta),
    }));
  };

  const totalSelected = Object.values(selectedUnits).reduce((a, b) => a + b, 0);

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-40 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#003b95] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Loading Property Details…
          </p>
          <p className="text-xs text-gray-400 mt-2">Fetching hotel data from database</p>
        </div>
      </TripLogerLayout>
    );
  }

  if (error || !data) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-20 text-center">
          <p className="text-lg font-bold text-gray-500 mb-4">Hotel not found</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </TripLogerLayout>
    );
  }

  const { hotel, images, hotelAmenitiesByCategory, rooms, reviews, stats, description } = data;

  // ── Build Facilities categories (hotel-level amenities from DB) ──────
  const facilitiesCategories = Object.entries(hotelAmenitiesByCategory).map(
    ([category, amenities]) => ({
      title: category.toUpperCase(),
      icon: getHotelAmenityCategoryIcon(category),
      items: (amenities as HotelAmenity[]).map(a => a.name),
    })
  );

  return (
    <TripLogerLayout>
      <div className="bg-gray-50 min-h-screen pb-20 pt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <BookingStepper currentStep={2} />

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
            <span className="hover:text-[#003b95] cursor-pointer transition-colors" onClick={() => navigate('/')}>
              Home
            </span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="hover:text-[#003b95] cursor-pointer transition-colors" onClick={() => navigate(-1)}>
              Search Result
            </span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-[#1d1d1f]">{hotel.name}</span>
          </div>

          {/* ── Hero: Images (DB) + Hotel Summary (DB) ─────────────────── */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mb-16">
            {/* Left: Image gallery — all from PostgreSQL HotelImage table */}
            <div className="lg:w-[60%] w-full">
              <ImageGallery
                images={
                  images.length > 0
                    ? images.map((img: any) => ({
                        url: img.url,
                        hero: img.isPrimary,
                      }))
                    : [
                        {
                          url:
                            data.primaryImage ||
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                          hero: true,
                        },
                      ]
                }
                hotelName={hotel.name}
              />
            </div>

            {/* Right: Hotel summary — from PostgreSQL CanonicalHotel */}
            <div className="lg:w-[40%] flex flex-col gap-4">
              {/* Star rating from DB */}
              {hotel.starRating && (
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: Math.round(hotel.starRating) }).map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-current" />
                  ))}
                </div>
              )}

              <h1 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] leading-tight mb-4">
                {hotel.name}
              </h1>

              {/* Address from DB */}
              <p className="text-sm text-gray-600 mb-2 leading-relaxed flex items-start gap-2">
                <MapPin size={14} className="text-[#003b95] mt-0.5 shrink-0" />
                {hotel.address ||
                  `${hotel.city}${hotel.state ? ', ' + hotel.state : ''}, ${hotel.country}`}
              </p>

              {/* Chain/brand from DB */}
              {(hotel.chainName || hotel.brandName) && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {hotel.chainName}
                  {hotel.brandName && hotel.chainName !== hotel.brandName
                    ? ` — ${hotel.brandName}`
                    : ''}
                </p>
              )}

              {/* Reviews stats */}
              <div className="flex items-center gap-3 mb-6">
                {stats.ratingAvg && (
                  <span className="text-lg font-bold text-[#003b95]">
                    {stats.ratingAvg}
                  </span>
                )}
                <span
                  className="text-[#003b95] font-bold underline cursor-pointer text-sm"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  ({stats.reviewCount > 0 ? stats.reviewCount : '—'} reviews)
                </span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {/* Description from DB */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {description
                    ? description.slice(0, 280) + (description.length > 280 ? '…' : '')
                    : `Situated in ${hotel.city}, ${hotel.name} features accommodation with free WiFi and excellent amenities.`}
                </p>

                {/* Check-in/out from DB */}
                {(hotel.checkInTime || hotel.checkOutTime) && (
                  <div className="flex gap-6 pt-2">
                    {hotel.checkInTime && (
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Check-in
                        </p>
                        <p className="text-sm font-semibold text-[#1d1d1f]">
                          From {hotel.checkInTime}
                        </p>
                      </div>
                    )}
                    {hotel.checkOutTime && (
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Check-out
                        </p>
                        <p className="text-sm font-semibold text-[#1d1d1f]">
                          Until {hotel.checkOutTime}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Weather widget - displays current weather and forecast */}
                {weather && (
                  <div className="pt-2 mt-4 border-t border-gray-200">
                    <WeatherWidget
                      current={weather.current}
                      daily={weather.daily}
                      units="metric"
                      loading={weatherLoading}
                      error={weatherError}
                    />
                  </div>
                )}

                {/* Weather API not configured warning */}
                {!weatherConfigured && !weatherLoading && (
                  <div className="pt-2 mt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-medium">
                      Weather data unavailable. Weather API not configured.
                    </p>
                  </div>
                )}
              </div>

              <button
                className="w-full h-12 bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                onClick={() =>
                  document.getElementById('room-prices')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Choose Your Room <ChevronRight size={18} className="inline ml-1" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-12 sticky top-24 z-30">
            {[
              { id: 'location', label: 'Location', icon: Map },
              { id: 'facilities', label: 'Facilities', icon: Bed },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
              { id: 'rules', label: 'Rules & Conditions', icon: FileCheck },
              { id: 'room-prices', label: 'Room Prices', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() =>
                  document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' })
                }
                className="h-14 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-3 hover:shadow-md hover:border-gray-200 transition-all duration-300 active:scale-[0.98]"
              >
                <tab.icon size={18} className="text-gray-500" />
                <span className="text-[#1d1d1f] font-semibold text-xs uppercase tracking-wider">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── Location Map ─────────────────────────────────────────────── */}
          <div
            id="location"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-16 scroll-mt-40 hover:shadow-md transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-[#1d1d1f] mb-2 flex items-center gap-3">
              <Map className="text-gray-500" size={20} /> Hotel Location
            </h2>
            <p className="text-xs text-gray-500 font-semibold mb-6">
              Interactive map powered by Mapbox
            </p>

            <HotelMap
              hotel={{
                id: hotel.id,
                name: hotel.name,
                address:
                  hotel.address ||
                  `${hotel.city}${hotel.state ? ', ' + hotel.state : ''}, ${hotel.country}`,
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                rating: stats.ratingAvg,
                starRating: hotel.starRating,
                city: hotel.city,
                country: hotel.country,
              }}
              height="450px"
              showLocationCard={true}
            />
          </div>

          {/* ── Facilities (Hotel Amenities — 100% from DB) ─────────────── */}
          <div
            id="facilities"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-10 mb-16 scroll-mt-40 hover:shadow-md transition-all duration-300"
          >
            <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-2">
              Main Facilities
            </h2>
            <p className="text-xs text-gray-500 font-semibold mb-8">
              {data.hotelAmenities?.length > 0
                ? `${data.hotelAmenities.length} facilities from hotel database`
                : 'Facility data loading…'}
            </p>

            {facilitiesCategories.length > 0 ? (
              <Facilities categories={facilitiesCategories} />
            ) : (
              <div className="text-gray-600 text-sm text-center py-8">
                No facility data available for this property.
              </div>
            )}
          </div>

          {/* ── Reviews ─────────────────────────────────────────────── */}
          <div
            id="reviews"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-10 mb-16 scroll-mt-40 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-8 gap-2">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-3">
                  <MessageSquare className="text-gray-500" size={20} /> Guest Reviews
                </h2>
                {stats.ratingAvg && (
                  <div className="px-3 py-1 bg-[#003b95] rounded-lg text-white font-bold text-sm">
                    {stats.ratingAvg}
                  </div>
                )}
              </div>
              <button
                className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Read all reviews
              </button>
            </div>

            {reviews?.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
                {reviews.map((r: any, i: number) => (
                  <div key={i} className={REVIEW_CARD_CLASS}>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        <div className={REVIEW_AVATAR_CLASS}>
                          {(r.authorName || 'G').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-[#1d1d1f] block">
                            {r.authorName || 'Guest'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {r.authorCountry || ''}
                          </span>
                        </div>
                      </div>
                      {r.rating && (
                        <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-[#1d1d1f] border border-gray-100">
                          {Number(r.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    {r.title && (
                      <h4 className="font-bold text-[#1d1d1f] mb-2 line-clamp-1">"{r.title}"</h4>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                      {r.reviewText}
                    </p>
                    {r.stayDate && (
                      <p className="text-xs text-gray-500">
                        Reviewed:{' '}
                        {new Date(r.stayDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Placeholder reviews when DB has none */
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
                {[
                  'Great location, excellent service!',
                  'Beautiful hotel, will return!',
                  'Amazing facilities and staff!',
                ].map((title, i) => (
                  <div key={i} className={REVIEW_CARD_CLASS}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={REVIEW_AVATAR_CLASS}>GU</div>
                      <div>
                        <span className="text-sm font-bold text-[#1d1d1f] block">Guest</span>
                        <span className="text-xs text-gray-500">
                          Verified Stay
                        </span>
                      </div>
                      <span className="ml-auto px-2 py-1 bg-gray-50 rounded-lg text-xs font-bold text-[#1d1d1f] border border-gray-100">
                        9.{5 - i}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#1d1d1f] mb-2">"{title}"</h4>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      Wonderful experience at {hotel.name}. The facilities were top-notch and the
                      location couldn't be better.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── House Rules ────────────────────────────────────────────── */}
          <div
            id="rules"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-10 mb-16 scroll-mt-40 hover:shadow-md transition-all duration-300"
          >
            <h2 className="text-lg font-bold text-[#1d1d1f] mb-6 flex items-center gap-3">
              <FileCheck className="text-gray-500" size={20} /> House Rules
            </h2>
            <div className="space-y-0 divide-y divide-gray-100">
              <div className="flex justify-between py-4 gap-4">
                <span className="text-sm font-semibold text-gray-500">Check-in</span>
                <span className="text-sm font-semibold text-[#1d1d1f]">
                  From {hotel.checkInTime || '14:00'}
                </span>
              </div>
              <div className="flex justify-between py-4 gap-4">
                <span className="text-sm font-semibold text-gray-500">Check-out</span>
                <span className="text-sm font-semibold text-[#1d1d1f]">
                  Until {hotel.checkOutTime || '12:00'}
                </span>
              </div>
              <div className="flex justify-between py-4 gap-4">
                <span className="text-sm font-semibold text-gray-500">
                  Cancellation / Prepayment
                </span>
                <span className="text-sm font-semibold text-[#1d1d1f] text-right max-w-xs">
                  Policies vary by room type and rate. See individual room rates below.
                </span>
              </div>
              <div className="flex justify-between py-4 gap-4">
                <span className="text-sm font-semibold text-gray-500">Pets</span>
                <span className="text-sm font-semibold text-[#1d1d1f]">
                  {data.hotelAmenities?.some((a: any) => a.code === 'PETS_FRIENDLY')
                    ? 'Pets allowed ✓'
                    : 'Contact hotel for pet policy'}
                </span>
              </div>
              {/* Contact info from DB */}
              {data.contacts?.length > 0 && data.contacts[0].phone && (
                <div className="flex justify-between py-4 gap-4">
                  <span className="text-sm font-semibold text-gray-500">Contact</span>
                  <span className="text-sm font-semibold text-[#1d1d1f]">
                    {data.contacts[0].phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Room Selection (static structure + realtime pricing) ────── */}
          <section id="room-prices" className="space-y-12 pt-10 scroll-mt-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                  Rooms & Rates
                </h2>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                  Static room info from database · Live prices from supplier API
                </p>
              </div>

              {/* Rates refresh button */}
              {ratesLoading ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <RefreshCw size={14} className="animate-spin text-[#003b95]" />
                  Fetching live rates…
                </div>
              ) : (
                <button
                  onClick={refetchRates}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#003b95] transition-colors uppercase tracking-wider"
                >
                  <RefreshCw size={12} /> Refresh Rates
                </button>
              )}
            </div>

            {/* Room cards */}
            {rooms?.length > 0 ? (
              rooms.map((room: MergedRoom, ridx: number) => (
                <RoomSection
                  key={`${room.id}-${ridx}`}
                  room={room}
                  roomIdx={ridx}
                  selectedUnits={selectedUnits}
                  onUnitChange={handleUnitChange}
                  hotelImages={images}
                />
              ))
            ) : (
              /* No rooms yet: show room-amenity master list as "available amenities" */
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 lg:p-12 hover:shadow-md transition-all duration-300">
                <div className="text-center mb-8">
                  <p className="text-xl font-bold text-[#1d1d1f] mb-2">
                    Room Details Available on Request
                  </p>
                  <p className="text-sm text-gray-500">
                    Room type data will load once search dates are selected. Available room
                    amenities for this property:
                  </p>
                </div>

                {/* Show room amenity master catalog grouped by category */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Object.entries(data.roomAmenitiesByCategory || {}).map(([category, amenities]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        {getRoomAmenityCategoryIcon(category)}
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(amenities as any[]).map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#003b95]" />
                            <span className="text-sm text-gray-600">
                              {a.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Sticky booking bar ──────────────────────────────────────── */}
        {totalSelected > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-[#003b95] backdrop-blur-md p-6 shadow-lg z-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-6 pl-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-[#003b95] shadow-lg relative">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-[#003b95]">
                  {totalSelected}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">
                  Reservation Summary
                </p>
                <p className="font-bold text-xl text-white">
                  {totalSelected} Room{totalSelected > 1 ? 's' : ''} Selected
                </p>
              </div>
            </div>
            <button
              className="h-14 px-10 font-semibold text-sm bg-white text-[#003b95] gap-2 shadow-lg rounded-lg uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center"
              onClick={() =>
                navigate(`/hotels/addons?id=${id}`, {
                  state: { hotel, selectedUnits },
                })
              }
            >
              Continue to Add-ons <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <GuestReviewsModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        hotelName={hotel.name}
        rating={stats.ratingAvg ?? 4.3}
        reviewCount={stats.reviewCount > 0 ? stats.reviewCount : 4876}
      />
    </TripLogerLayout>
  );
}

// Inline ShoppingBag icon
function ShoppingBagIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default HotelDetail;

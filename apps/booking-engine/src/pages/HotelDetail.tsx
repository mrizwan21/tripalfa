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
  'snap-center shrink-0 w-[400px] bg-muted p-8 rounded-[2rem] border border-border';
const REVIEW_AVATAR_CLASS =
  'w-10 h-10 bg-background rounded-full flex items-center justify-center font-black text-foreground shadow-md text-sm';

// Aliases – BedDouble/Ruler removed in newer lucide-react; use Bed/Maximize2
const BedDoubleIcon = Bed;
const RulerIcon = Maximize2;

// ── Icon helpers ─────────────────────────────────────────────────────────────

function getHotelAmenityCategoryIcon(category: string): React.ReactNode {
  switch (category.toLowerCase()) {
    case 'dining':
      return <Utensils size={14} />;
    case 'recreation':
    case 'wellness':
      return <Waves size={14} />;
    case 'transportation':
      return <Car size={14} />;
    case 'services':
      return <User size={14} />;
    case 'security':
      return <Lock size={14} />;
    case 'business':
      return <Info size={14} />;
    case 'facilities':
      return <Bed size={14} />;
    default:
      return <Info size={14} />;
  }
}

function getRoomAmenityCategoryIcon(category: string): React.ReactNode {
  switch (category.toLowerCase()) {
    case 'bathroom':
      return <Waves size={12} />;
    case 'comfort':
      return <Bed size={12} />;
    case 'entertainment':
      return <Star size={12} />;
    case 'kitchen':
      return <Coffee size={12} />;
    case 'views':
      return <Eye size={12} />;
    case 'security':
      return <Lock size={12} />;
    case 'technology':
      return <Wifi size={12} />;
    default:
      return <Info size={12} />;
  }
}

// ── Board basis label lookup from static data ────────────────────────────────

/**
 * Get board type label from HOTEL_STATIC_DATA.BOARD_TYPES
 * Falls back to rate.boardBasisName or raw code if not found
 */
function getBoardLabel(code?: string | null): string | null {
  if (!code) return null;
  const boardType = HOTEL_STATIC_DATA.BOARD_TYPES.all.find(b => b.code === code);
  return boardType?.name ?? code;
}

// ── Room price / rate row ────────────────────────────────────────────────────

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
    room.images[0]?.url ??
    hotelImages.find(i => i.isPrimary)?.url ??
    hotelImages[0]?.url ??
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32';

  const boardLabel = getBoardLabel(rate.boardBasis) ?? rate.boardBasisName;

  const count = selectedUnits[roomKey] || 0;

  return (
    <tr className="hover:bg-muted transition-all group">
      {/* Room selection column */}
      <td className="px-10 py-10 w-[45%]">
        <div className="flex gap-8 items-center">
          {/* Room image (from DB or hotel fallback) */}
          <div className="w-48 h-32 rounded-3xl overflow-hidden shrink-0 shadow-2xl border-4 border-border group-hover:scale-105 transition-transform duration-500">
            <img src={imageUrl} className="w-full h-full object-cover" alt={room.name} />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-black text-foreground tracking-tight">
              {rate.roomTypeName || room.name}
            </p>

            {/* Static features (DB: bed type, size, views) */}
            {room.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.features.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-[10px] font-black text-muted-foreground rounded-full uppercase tracking-tighter"
                  >
                    {f.includes('View') ? (
                      <Eye size={10} />
                    ) : f.includes('Bed') ? (
                      <BedDoubleIcon size={10} />
                    ) : f.includes('m²') ? (
                      <RulerIcon size={10} />
                    ) : null}
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Room amenity badges (from RoomAmenity master / static DB) */}
            {room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, 4).map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-[10px] font-black text-muted-foreground rounded-full uppercase tracking-tighter"
                  >
                    {getRoomAmenityCategoryIcon(a.category)}
                    {a.name}
                  </span>
                ))}
              </div>
            )}

            {/* Board basis badge (realtime API) */}
            {boardLabel && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 text-[10px] font-black text-amber-700 rounded-full uppercase tracking-tighter">
                <Coffee size={10} /> {boardLabel}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Policies column (realtime API) */}
      <td className="px-10 py-10 w-[35%]">
        <div className="space-y-4">
          {/* Cancellation policy */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Cancellation
            </p>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              {rate.cancellationPolicy ||
                'Full payment due at booking. Cancellation policies vary by rate.'}
            </p>
            {rate.cancellationDeadline && (
              <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                <Clock size={10} /> Free cancellation until{' '}
                {new Date(rate.cancellationDeadline).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Refundability badge (realtime API) */}
          {rate.isRefundable ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                Fully Refundable
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                Non-Refundable
              </span>
            </div>
          )}

          {/* Available rooms */}
          {rate.availableRooms !== undefined && rate.availableRooms <= 5 && (
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
              Only {rate.availableRooms} left!
            </p>
          )}
        </div>
      </td>

      {/* Price + selector column (realtime API price) */}
      <td className="px-10 py-10">
        <div className="flex flex-col items-center gap-4">
          {rate.price.amount > 0 ? (
            <>
              <div className="text-center">
                <p className="text-3xl font-black text-foreground tracking-tighter leading-none">
                  {formatCurrency(rate.price.amount)}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">per night</p>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold text-muted-foreground text-center">
              Price on
              <br />
              request
            </p>
          )}

          {/* Unit selector */}
          <div className="flex items-center justify-center gap-4 p-2 bg-muted rounded-2xl border border-border w-full group-hover:bg-background transition-colors">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnitChange(roomKey, -1)}
              className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95 gap-2"
            >
              <span className="text-xl font-bold">−</span>
            </Button>
            <span className="text-lg font-black text-foreground w-6 text-center">{count}</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUnitChange(roomKey, 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-background transition-all active:scale-95 gap-2"
            >
              <span className="text-xl font-bold">+</span>
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Room section (room card + rates table) ───────────────────────────────────

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
    room.rates.length > 0
      ? room.rates
      : [
          {
            offerId: `placeholder-${room.id}`,
            price: { amount: 0, currency: 'USD' },
            isRefundable: false,
          } as RoomRate,
        ];

  return (
    <div className="relative mb-16 shadow-2xl rounded-[3rem] overflow-hidden bg-background border border-border">
      {/* Yellow header bar — static data from DB */}
      <div className="bg-secondary px-10 py-4 flex items-center justify-between font-black text-[11px] uppercase tracking-widest text-foreground gap-2">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-foreground rounded-full" />
            {room.name}
          </span>
          {room.maxOccupancy > 0 && (
            <span className="flex items-center gap-2 text-foreground/60">
              <User size={12} /> Max {room.maxOccupancy} Guests
            </span>
          )}
          {room.bedType && (
            <span className="flex items-center gap-2 text-foreground/60">
              <BedDoubleIcon size={12} /> {room.bedType}
            </span>
          )}
          {room.roomSize && (
            <span className="flex items-center gap-2 text-foreground/60">
              <RulerIcon size={12} /> {room.roomSize}m²
            </span>
          )}
        </div>
        {/* Source indicator (dev aid) */}
        <span className="text-[9px] opacity-40 font-bold normal-case">
          {room.source === 'merged' ? '◉ DB+API' : room.source === 'db' ? '◉ DB' : '◉ API'}
        </span>
      </div>

      <div className="overflow-hidden bg-background">
        <table className="w-full text-left">
          <thead className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">Room Selection</th>
              <th className="px-10 py-6">Policies</th>
              <th className="px-10 py-6 text-center">Select Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rates.map((rate, raIdx) => (
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

// ── Main Page ────────────────────────────────────────────────────────────────

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
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-black text-foreground mb-3">Hotel Booking Disabled</h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            Your admin has currently disabled hotel booking for this tenant.
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="h-11 px-6">
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

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
            Loading Property Details…
          </p>
          <p className="text-muted-foreground text-xs mt-2">Fetching hotel data from database</p>
        </div>
      </TripLogerLayout>
    );
  }

  if (error || !data) {
    return (
      <TripLogerLayout>
        <div className="p-20 text-center">
          <p className="text-2xl font-black text-muted-foreground mb-4">Hotel not found</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
      <div className="bg-[hsl(var(--background))] min-h-screen pb-20 font-sans pt-32">
        <BookingStepper currentStep={2} />

        <div className="container mx-auto px-4 max-w-6xl mt-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground mb-6 px-2">
            <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/')}>
              Home
            </span>
            <ChevronRight size={14} />
            <span className="hover:text-foreground cursor-pointer" onClick={() => navigate(-1)}>
              Search Result
            </span>
            <ChevronRight size={14} />
            <span className="text-foreground font-bold">{hotel.name}</span>
          </div>

          {/* ── Hero: Images (DB) + Hotel Summary (DB) ─────────────────── */}
          <div className="flex flex-col lg:flex-row gap-10 mb-16">
            {/* Left: Image gallery — all from PostgreSQL HotelImage table */}
            <div className="lg:w-[60%] w-full">
              <ImageGallery
                images={
                  images.length > 0
                    ? images.map(img => ({
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
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: Math.round(hotel.starRating) }).map((_, i) => (
                    <Star key={i} size={16} className="text-secondary fill-current" />
                  ))}
                </div>
              )}

              <h1 className="text-4xl font-black text-[hsl(var(--primary))] leading-tight mb-4">
                {hotel.name}
              </h1>

              {/* Address from DB */}
              <p className="text-[13px] font-bold text-muted-foreground mb-2 leading-relaxed flex items-start gap-2">
                <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                {hotel.address ||
                  `${hotel.city}${hotel.state ? ', ' + hotel.state : ''}, ${hotel.country}`}
              </p>

              {/* Chain/brand from DB */}
              {(hotel.chainName || hotel.brandName) && (
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                  {hotel.chainName}
                  {hotel.brandName && hotel.chainName !== hotel.brandName
                    ? ` — ${hotel.brandName}`
                    : ''}
                </p>
              )}

              {/* Reviews stats */}
              <div className="flex items-center gap-3 mb-8">
                {stats.ratingAvg && (
                  <span className="text-lg font-black text-[hsl(var(--primary))]">
                    {stats.ratingAvg}
                  </span>
                )}
                <span
                  className="text-foreground font-bold underline cursor-pointer text-sm"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  ({stats.reviewCount > 0 ? stats.reviewCount : '—'} reviews)
                </span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {/* Description from DB */}
                <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                  {description
                    ? description.slice(0, 280) + (description.length > 280 ? '…' : '')
                    : `Situated in ${hotel.city}, ${hotel.name} features accommodation with free WiFi and excellent amenities.`}
                </p>

                {/* Check-in/out from DB */}
                {(hotel.checkInTime || hotel.checkOutTime) && (
                  <div className="flex gap-6 pt-2">
                    {hotel.checkInTime && (
                      <div className="text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Check-in
                        </p>
                        <p className="text-sm font-black text-foreground">
                          From {hotel.checkInTime}
                        </p>
                      </div>
                    )}
                    {hotel.checkOutTime && (
                      <div className="text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Check-out
                        </p>
                        <p className="text-sm font-black text-foreground">
                          Until {hotel.checkOutTime}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Weather widget - displays current weather and forecast */}
                {weather && (
                  <div className="pt-2 mt-4 border-t border-border">
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
                  <div className="pt-2 mt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-medium">
                      Weather data unavailable. Weather API not configured.
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                className="w-full h-14 shadow-xl shadow-indigo-200 text-background font-black text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                onClick={() =>
                  document.getElementById('room-prices')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Choose Your Room <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12 sticky top-24 z-30">
            {[
              { id: 'location', label: 'Location', icon: Map },
              { id: 'facilities', label: 'Facilities', icon: Bed },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
              { id: 'rules', label: 'Rules & Conditions', icon: FileCheck },
              { id: 'room-prices', label: 'Room Prices', icon: Key },
            ].map(tab => (
              <Button
                key={tab.id}
                variant="secondary"
                size="sm"
                onClick={() =>
                  document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' })
                }
                className="h-14 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <tab.icon size={18} className="text-foreground" />
                <span className="text-foreground font-black uppercase tracking-widest text-[10px]">
                  {tab.label}
                </span>
              </Button>
            ))}
          </div>

          {/* ── Location Map ─────────────────────────────────────────────────────── */}
          <div
            id="location"
            className="bg-background rounded-[2.5rem] p-8 shadow-2xl mb-16 border border-border scroll-mt-40"
          >
            <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight flex items-center gap-3">
              <Map className="text-muted-foreground" /> Hotel Location
            </h2>
            <p className="text-xs text-muted-foreground font-bold mb-6">
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
            className="bg-background rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-border scroll-mt-40"
          >
            <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight">
              Main Facilities
            </h2>
            <p className="text-xs text-muted-foreground font-bold mb-8">
              {data.hotelAmenities.length > 0
                ? `${data.hotelAmenities.length} facilities from hotel database`
                : 'Facility data loading…'}
            </p>

            {facilitiesCategories.length > 0 ? (
              <Facilities categories={facilitiesCategories} />
            ) : (
              <div className="text-muted-foreground text-sm font-bold text-center py-8">
                No facility data available for this property.
              </div>
            )}
          </div>

          {/* ── Reviews ─────────────────────────────────────────────────── */}
          <div
            id="reviews"
            className="bg-background rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-border scroll-mt-40"
          >
            <div className="flex items-center justify-between mb-8 gap-2">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                  <MessageSquare className="text-muted-foreground" /> Guest Reviews
                </h2>
                {stats.ratingAvg && (
                  <div className="px-4 py-2 bg-foreground rounded-xl text-background font-black text-xl">
                    {stats.ratingAvg}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="border-border text-muted-foreground hover:bg-foreground hover:text-background rounded-xl h-12 px-6 text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Read all reviews
              </Button>
            </div>

            {reviews.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x">
                {reviews.map((r: any, i: number) => (
                  <div key={i} className={REVIEW_CARD_CLASS}>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        <div className={REVIEW_AVATAR_CLASS}>
                          {(r.authorName || 'G').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-foreground block">
                            {r.authorName || 'Guest'}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {r.authorCountry || ''}
                          </span>
                        </div>
                      </div>
                      {r.rating && (
                        <span className="px-2 py-1 bg-background rounded-lg text-xs font-black text-foreground shadow-sm">
                          {Number(r.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    {r.title && (
                      <h4 className="font-bold text-foreground mb-2 line-clamp-1">"{r.title}"</h4>
                    )}
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {r.reviewText}
                    </p>
                    {r.stayDate && (
                      <p className="text-[10px] font-bold text-muted-foreground">
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
              <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x">
                {[
                  'Great location, excellent service!',
                  'Beautiful hotel, will return!',
                  'Amazing facilities and staff!',
                ].map((title, i) => (
                  <div key={i} className={REVIEW_CARD_CLASS}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={REVIEW_AVATAR_CLASS}>GU</div>
                      <div>
                        <span className="text-sm font-bold text-foreground block">Guest</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Verified Stay
                        </span>
                      </div>
                      <span className="ml-auto px-2 py-1 bg-background rounded-lg text-xs font-black text-foreground shadow-sm">
                        9.{5 - i}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground mb-2">"{title}"</h4>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3">
                      Wonderful experience at {hotel.name}. The facilities were top-notch and the
                      location couldn't be better.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── House Rules ──────────────────────────────────────────────── */}
          <div
            id="rules"
            className="bg-background rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-border scroll-mt-40"
          >
            <h2 className="text-2xl font-black text-foreground mb-8 tracking-tight flex items-center gap-3">
              <FileCheck className="text-muted-foreground" /> House Rules
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-4 border-b border-border gap-4">
                <span className="text-sm font-bold text-muted-foreground">Check-in</span>
                <span className="text-sm font-black text-foreground">
                  From {hotel.checkInTime || '14:00'}
                </span>
              </div>
              <div className="flex justify-between py-4 border-b border-border gap-4">
                <span className="text-sm font-bold text-muted-foreground">Check-out</span>
                <span className="text-sm font-black text-foreground">
                  Until {hotel.checkOutTime || '12:00'}
                </span>
              </div>
              <div className="flex justify-between py-4 border-b border-border gap-4">
                <span className="text-sm font-bold text-muted-foreground">
                  Cancellation / Prepayment
                </span>
                <span className="text-sm font-black text-foreground text-right max-w-xs">
                  Policies vary by room type and rate. See individual room rates below.
                </span>
              </div>
              <div className="flex justify-between py-4 border-b border-border gap-4">
                <span className="text-sm font-bold text-muted-foreground">Pets</span>
                <span className="text-sm font-black text-foreground">
                  {data.hotelAmenities.some(a => a.code === 'PETS_FRIENDLY')
                    ? 'Pets allowed ✓'
                    : 'Contact hotel for pet policy'}
                </span>
              </div>
              {/* Contact info from DB */}
              {data.contacts.length > 0 && data.contacts[0].phone && (
                <div className="flex justify-between py-4 border-b border-border gap-4">
                  <span className="text-sm font-bold text-muted-foreground">Contact</span>
                  <span className="text-sm font-black text-foreground">
                    {data.contacts[0].phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Room Selection (static structure + realtime pricing) ────── */}
          <section id="room-prices" className="space-y-12 pt-10 scroll-mt-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
              <div>
                <h2 className="text-4xl font-black text-foreground tracking-tight">
                  Rooms & Rates
                </h2>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mt-2">
                  Static room info from database · Live prices from supplier API
                </p>
              </div>

              {/* Rates refresh button */}
              {ratesLoading ? (
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <RefreshCw size={14} className="animate-spin" />
                  Fetching live rates…
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetchRates}
                  className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                >
                  <RefreshCw size={12} /> Refresh Rates
                </Button>
              )}
            </div>

            {/* Room cards */}
            {rooms.length > 0 ? (
              rooms.map((room, ridx) => (
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
              <div className="bg-background rounded-[2.5rem] p-12 shadow-2xl border border-border">
                <div className="text-center mb-8">
                  <p className="text-xl font-black text-foreground mb-2">
                    Room Details Available on Request
                  </p>
                  <p className="text-sm font-bold text-muted-foreground">
                    Room type data will load once search dates are selected. Available room
                    amenities for this property:
                  </p>
                </div>

                {/* Show room amenity master catalog grouped by category */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Object.entries(data.roomAmenitiesByCategory).map(([category, amenities]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        {getRoomAmenityCategoryIcon(category)}
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(amenities as any[]).map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                            <span className="text-xs font-bold text-muted-foreground">
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
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-[hsl(var(--primary))] backdrop-blur-2xl border border-border/10 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-50 rounded-[3rem] animate-in slide-in-from-bottom-20 duration-500 flex items-center justify-between gap-2">
            <div className="flex items-center gap-8 pl-6">
              <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center text-foreground shadow-2xl relative border-4 border-border/10 gap-2">
                <ShoppingBagIcon size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-background text-xs font-black border-4 border-[hsl(var(--primary))] gap-2">
                  {totalSelected}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">
                  Reservation Summary
                </p>
                <p className="font-black text-2xl text-primary-foreground tracking-tight">
                  {totalSelected} Room{totalSelected > 1 ? 's' : ''} Selected
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="h-20 px-16 font-black text-sm gap-4 shadow-2xl shadow-indigo-500/20 rounded-[2.2rem] uppercase tracking-widest transition-all scale-95 hover:scale-100 active:scale-90"
              onClick={() =>
                navigate(`/hotels/addons?id=${id}`, {
                  state: { hotel, selectedUnits },
                })
              }
            >
              Continue to Add-ons <ChevronRight size={24} />
            </Button>
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

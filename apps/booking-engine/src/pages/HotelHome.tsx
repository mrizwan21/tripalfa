import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
  Search,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  Star,
  Building2,
  TrendingUp,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { SearchAutocomplete } from '../components/ui/SearchAutocomplete';
import { GuestSelector } from '../components/ui/GuestSelector';
import { DualMonthCalendar } from '../components/ui/DualMonthCalendar';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { usePopularDestinations, usePopularHotels } from '../hooks/useStaticData';
import { useWikivoyageGuide } from '../hooks/useWikivoyage';
import { DestinationContentCard } from '../components/DestinationContentCard';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';

type Suggestion = Record<string, any>;

const PLACEHOLDER_HOTEL_IMAGE = '/images/placeholder-hotel.jpg';

// Type definitions for data from PostgreSQL
interface PopularDestination {
  id: string;
  code: string;
  name: string;
  countryName: string;
  countryCode: string;
  destinationType: string;
  hotelCount: number;
  popularityScore: number;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PopularHotel {
  id: string;
  canonicalCode: string;
  name: string;
  city: string;
  countryCode: string;
  starRating: number | null;
  hotelType: string | null;
  chainName: string | null;
  qualityScore: number | null;
  primaryImage: string | null;
}

function HotelHome() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [location, setLocation] = useState('');
  const [checkinDate, setCheckinDate] = useState<Date | null>(null);
  const [checkoutDate, setCheckoutDate] = useState<Date | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [carouselStart, setCarouselStart] = useState(0);
  const rawMarketing = contentConfig?.marketing?.hotelHome || DEFAULT_CONTENT_CONFIG?.marketing?.hotelHome || {};
  const marketingHotelHome: Record<string, any> = {
    disabledTitle: rawMarketing?.disabledTitle || '',
    disabledSubtitle: rawMarketing?.disabledSubtitle || '',
    backToHomeLabel: rawMarketing?.backToHomeLabel || '',
    badge: rawMarketing?.badge || '',
    heroTitle: rawMarketing?.heroTitle || '',
    heroSubtitle: rawMarketing?.heroSubtitle || '',
    tabs: {
      stays: rawMarketing?.tabs?.stays || 'Stays',
      flights: rawMarketing?.tabs?.flights || 'Flights',
    },
    deals: {
      spotlightTitle: rawMarketing?.deals?.spotlightTitle || '',
      spotlightDescription: rawMarketing?.deals?.spotlightDescription || '',
      ctaLabel: rawMarketing?.deals?.ctaLabel || '',
      imageUrls: rawMarketing?.deals?.imageUrls || [],
    },
    popularDestinations: {
      title: rawMarketing?.popularDestinations?.title || '',
      subtitle: rawMarketing?.popularDestinations?.subtitle || '',
      nameLabel: rawMarketing?.popularDestinations?.nameLabel || '',
    },
    featuredHotels: {
      title: rawMarketing?.featuredHotels?.title || '',
      subtitle: rawMarketing?.featuredHotels?.subtitle || '',
      emptyLabel: rawMarketing?.featuredHotels?.emptyLabel || '',
    },
    featuredGuide: {
      title: rawMarketing?.featuredGuide?.title || '',
      subtitle: rawMarketing?.featuredGuide?.subtitle || '',
      poweredByLabel: rawMarketing?.featuredGuide?.poweredByLabel || '',
    },
    trending: {
      title: rawMarketing?.trending?.title || '',
      tabs: rawMarketing?.trending?.tabs || [],
      columnLabels: {
        primary: rawMarketing?.trending?.columnLabels?.primary || '',
        countLabel: rawMarketing?.trending?.columnLabels?.countLabel || '',
        secondary: rawMarketing?.trending?.columnLabels?.secondary || '',
        tertiary: rawMarketing?.trending?.columnLabels?.tertiary || '',
        quaternary: rawMarketing?.trending?.columnLabels?.quaternary || '',
      },
    },
    benefits: rawMarketing?.benefits || [],
    searchFormLabels: rawMarketing?.searchFormLabels || { from: 'From', to: 'To', departure: 'Departure', return: 'Return', searchCta: 'Search', tripTypeLabel: 'Trip Type', roomsLabel: 'Rooms', guestsLabel: 'Guests' },
    tripTypeLabels: rawMarketing?.tripTypeLabels || { roundTrip: 'Round Trip', oneWay: 'One Way' },
  };
  const hotelBenefits = marketingHotelHome.benefits;
  const searchFormLabels = marketingHotelHome.searchFormLabels;
  const tripTypeLabels = marketingHotelHome.tripTypeLabels;

  React.useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const content = await loadTenantContentConfig();
        if (active) {
          setContentConfig(content);
        }
      } catch {
        if (active) {
          setContentConfig(DEFAULT_CONTENT_CONFIG);
        }
      }
    };

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  // ─── Static Data from PostgreSQL ────────────────────────────────────────────
  const {
    data: popularDestinations = [],
    isLoading: isLoadingDestinations,
    error: destinationsError,
  } = usePopularDestinations(20);

  const {
    data: popularHotels = [],
    isLoading: isLoadingHotels,
    error: hotelsError,
  } = usePopularHotels(8);

  // ─── Wikivoyage Destination Content ────────────────────────────────────────────
  const featuredDestination = popularDestinations[0]?.name || 'Paris';
  const { data: wikivoyageContent, isLoading: isLoadingWiki } =
    useWikivoyageGuide(featuredDestination);

  const handleSearch = () => {
    if (!runtimeConfig.features.hotelBookingEnabled) {
      return;
    }
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (countryCode) params.set('countryCode', countryCode);
    if (checkinDate) params.set('checkin', format(checkinDate, 'yyyy-MM-dd'));
    if (checkoutDate) params.set('checkout', format(checkoutDate, 'yyyy-MM-dd'));
    navigate(`/hotels/list?${params.toString()}`);
  };

  // Helper to render star rating
  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: Math.min(rating, 5) }).map((_, i) => (
          <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    );
  };

  // Helper to get destination image with fallback
  const getDestinationImage = (dest: PopularDestination): string => {
    return dest.imageUrl || PLACEHOLDER_HOTEL_IMAGE;
  };

  // Helper to get hotel image with fallback
  const getHotelImage = (hotel: PopularHotel): string => {
    return hotel.primaryImage || PLACEHOLDER_HOTEL_IMAGE;
  };

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container-apple py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-bold text-[#1d1d1f] mb-3">
            {marketingHotelHome.disabledTitle}
          </h1>
          <p className="text-sm font-bold text-[rgba(0,0,0,0.48)] mb-6">
            {marketingHotelHome.disabledSubtitle}
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="h-11 px-6">
            {marketingHotelHome.backToHomeLabel}
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      {/* Hero Section - Apple Style: Solid black background */}
      <section className="bg-[#000000] relative overflow-visible">
        <div className="container-apple relative z-10 px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="mb-6">
              <span className="inline-block px-6 py-2 bg-[rgba(255,255,255,0.1)] rounded-[980px] text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                {marketingHotelHome.badge}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {marketingHotelHome.heroTitle}
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] font-bold text-sm uppercase tracking-[0.3em] mb-8">
              {marketingHotelHome.heroSubtitle}
            </p>
          </div>

          {/* Search Card - Apple Style */}
          <div
            className="w-full max-w-5xl mx-auto bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-[12px] p-6"
            data-testid="hotel-search-form"
          >
            {/* Tabs */}
            <div className="inline-flex bg-[rgba(255,255,255,0.1)] rounded-[980px] p-1 mb-6 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="px-6 rounded-[980px] bg-white text-[#1d1d1f] hover:bg-[rgba(255,255,255,0.9)]"
              >
                <span className="mr-2">🏨</span> {marketingHotelHome.tabs.stays}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => runtimeConfig.features.flightBookingEnabled && navigate('/flights')}
                disabled={!runtimeConfig.features.flightBookingEnabled}
                className="px-6 rounded-[980px] text-white hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-2">✈️</span> {marketingHotelHome.tabs.flights}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Destination Input */}
              <div className="col-span-12 md:col-span-4 h-14 [&_.h-12]:!h-14">
                <SearchAutocomplete
                  type="hotel"
                  placeholder={
                    searchFormLabels?.destinationPlaceholder ||
                    'City, Property, District or Address'
                  }
                  icon={<MapPin size={18} className="text-[#0071e3]" />}
                  value={location}
                  onChange={setLocation}
                  onSelect={(item: Suggestion) => {
                    setLocation(item.title);
                    setCountryCode(item.countryCode || null);
                  }}
                  dataTestId="hotel-city"
                />
              </div>

              {/* Date Picker */}
              <div className="col-span-12 md:col-span-4 [&_.h-12]:!h-14">
                <DualMonthCalendar
                  departureDate={checkinDate}
                  returnDate={checkoutDate}
                  onDepartureDateChange={setCheckinDate}
                  onReturnDateChange={setCheckoutDate}
                  mode="hotel"
                  departureLabel={searchFormLabels?.checkIn}
                  returnLabel={searchFormLabels?.checkOut}
                />
              </div>

              {/* Guests */}
              <div className="col-span-12 md:col-span-2 h-14 [&_.h-12]:!h-14">
                <GuestSelector />
              </div>

              {/* Search Button */}
              <div className="col-span-12 md:col-span-2">
                <Button
                  onClick={handleSearch}
                  data-testid="hotel-search-submit"
                  variant="primary"
                  size="lg"
                  className="w-full h-14"
                >
                  {searchFormLabels?.searchCtaLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-white border-b border-[rgba(0,0,0,0.1)]">
        <div className="container-apple py-12">
          <div className="flex flex-col md:flex-row justify-around items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-[rgba(0,113,227,0.1)] flex items-center justify-center text-[#0071e3]">
                <Search size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1d1d1f] text-lg">
                  {hotelBenefits[0]?.title}
                </h3>
                <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-1">
                  {hotelBenefits[0]?.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-[rgba(255,149,0,0.1)] flex items-center justify-center text-[#FF9500]">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1d1d1f] text-lg">
                  {hotelBenefits[1]?.title}
                </h3>
                <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-1">
                  {hotelBenefits[1]?.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-[rgba(52,199,89,0.1)] flex items-center justify-center text-[#34C759]">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1d1d1f] text-lg">
                  {hotelBenefits[2]?.title}
                </h3>
                <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-1">
                  {hotelBenefits[2]?.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deals Spotlight */}
      <section className="bg-[#f5f5f7]">
        <div className="container-apple py-16">
          <div className="bg-[#1d1d1f] rounded-[12px] p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                {marketingHotelHome.deals.spotlightTitle}
              </h3>
              <p className="text-[rgba(255,255,255,0.6)] text-sm leading-relaxed mb-6">
                {marketingHotelHome.deals.spotlightDescription}
              </p>
              <Button
                variant="ghost"
                size="md"
                className="bg-white text-[#1d1d1f] px-6 py-2 rounded-[980px] font-bold hover:bg-[rgba(255,255,255,0.9)] transition"
              >
                {marketingHotelHome.deals.ctaLabel}
              </Button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {marketingHotelHome.deals.imageUrls.map((url: string, index: number) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  className="rounded-[8px] w-full h-32 object-cover"
                  alt="Hotel deal"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations Carousel */}
      <section className="bg-white">
        <div className="container-apple py-16 md:py-20">
          <div className="flex items-center justify-between mb-8 gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                {marketingHotelHome.popularDestinations.title}
              </h2>
              <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-2">
                {marketingHotelHome.popularDestinations.subtitle}
                {popularDestinations.length > 0 && (
                  <span className="ml-2 inline-block bg-[rgba(0,113,227,0.1)] text-[#0071e3] px-2 py-0.5 rounded-[980px] text-[8px] font-bold uppercase">
                    {popularDestinations.length} {marketingHotelHome.popularDestinations.nameLabel.toLowerCase()}s
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingDestinations && (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
              <span className="ml-3 text-[rgba(0,0,0,0.48)] font-bold text-sm">
                {searchFormLabels?.loadingDestinationsLabel}
              </span>
            </div>
          )}

          {/* Error State */}
          {destinationsError && !isLoadingDestinations && (
            <div className="bg-[#f5f5f7] border border-[rgba(0,0,0,0.1)] rounded-[8px] p-4 text-center">
              <p className="text-red-600 text-sm font-bold">
                {searchFormLabels?.errorLoadingDestinationsLabel ||
                  'Unable to load destinations. Please try again later.'}
              </p>
            </div>
          )}

          {/* Carousel */}
          {!isLoadingDestinations && !destinationsError && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {popularDestinations.length > 0
                  ? popularDestinations.slice(carouselStart, carouselStart + 4).map(dest => (
                      <div
                        key={dest.id}
                        className="group cursor-pointer"
                        onClick={() => {
                          navigate(
                            `/hotels/list?location=${encodeURIComponent(dest.name)}&countryCode=${dest.countryCode}`
                          );
                        }}
                      >
                        <div className="bg-[#f5f5f7] rounded-[8px] overflow-hidden">
                          <div className="relative h-64 overflow-hidden">
                            <img
                              src={getDestinationImage(dest)}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              alt={dest.name}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-[rgba(29,29,31,0.8)] backdrop-blur-sm p-4 pt-12">
                              <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                              <p className="text-[rgba(255,255,255,0.6)] text-xs font-bold">
                                {dest.countryName}
                              </p>
                              {dest.hotelCount > 0 && (
                                <p className="text-[rgba(255,255,255,0.4)] text-xs mt-1 font-bold">
                                  {dest.hotelCount.toLocaleString()} hotels
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : /* Empty state */
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#f5f5f7] rounded-[8px] aspect-[4/3] animate-pulse"
                      />
                    ))}
              </div>

              {/* Carousel Navigation */}
              {popularDestinations.length > 4 && (
                <div className="flex justify-between items-center mt-8 gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full p-0 border border-[rgba(0,0,0,0.1)] hover:border-[#0071e3]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCarouselStart(Math.max(0, carouselStart - 4))}
                    disabled={carouselStart === 0}
                  >
                    <ChevronLeft size={20} className="text-[#1d1d1f]" />
                  </Button>
                  <span className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-wider">
                    {carouselStart + 1}–{Math.min(carouselStart + 4, popularDestinations.length)} of{' '}
                    {popularDestinations.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full p-0 border border-[rgba(0,0,0,0.1)] hover:border-[#0071e3]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      setCarouselStart(Math.min(popularDestinations.length - 4, carouselStart + 4))
                    }
                    disabled={carouselStart + 4 >= popularDestinations.length}
                  >
                    <ChevronRight size={20} className="text-[#1d1d1f]" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="bg-[#f5f5f7]">
        <div className="container-apple py-16 md:py-20">
          <div className="flex items-center justify-between mb-8 gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                {marketingHotelHome.featuredHotels.title}
              </h2>
              <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-2">
                {marketingHotelHome.featuredHotels.subtitle}
              </p>
            </div>
            <Building2 className="w-6 h-6 text-[#0071e3]" />
          </div>

          {/* Loading State */}
          {isLoadingHotels && (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
              <span className="ml-3 text-[rgba(0,0,0,0.48)] font-bold text-sm">
                {searchFormLabels?.loadingHotelsLabel}
              </span>
            </div>
          )}

          {/* Hotel Cards Grid */}
          {!isLoadingHotels && popularHotels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {popularHotels.map((hotel: PopularHotel) => (
                <div
                  key={hotel.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/hotels/detail/${hotel.id}`)}
                >
                  <div className="bg-white rounded-[8px] overflow-hidden shadow-[0_3px_30px_rgba(0,0,0,0.1)]">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getHotelImage(hotel)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={hotel.name}
                      />
                      {hotel.chainName && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-[4px] text-xs font-bold text-[#1d1d1f]">
                          {hotel.chainName}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-[#1d1d1f] text-sm leading-tight">
                          {hotel.name}
                        </h3>
                        {hotel.starRating && (
                          <div className="flex items-center gap-0.5 ml-2 shrink-0">
                            {Array.from({
                              length: Math.min(hotel.starRating, 5),
                            }).map((_, i) => (
                              <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-wider mb-3">
                        {hotel.city}
                        {hotel.countryCode && `, ${hotel.countryCode}`}
                      </p>
                      {hotel.hotelType && (
                        <span className="inline-block bg-[#f5f5f7] text-[#1d1d1f] text-[8px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider">
                          {hotel.hotelType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingHotels && popularHotels.length === 0 && (
            <div className="bg-white rounded-[8px] p-8 text-center">
              <Building2 className="w-12 h-12 text-[rgba(0,0,0,0.2)] mx-auto mb-3" />
              <p className="text-[rgba(0,0,0,0.48)] text-sm font-bold">
                {marketingHotelHome.featuredHotels.emptyLabel}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Destination Guide */}
      {(wikivoyageContent || isLoadingWiki) && (
        <section className="bg-white">
          <div className="container-apple py-16 md:py-20">
            <div className="flex items-center justify-between mb-8 gap-2">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                  {marketingHotelHome.featuredGuide.title}
                </h2>
                <p className="text-[10px] font-bold text-[rgba(0,0,0,0.48)] uppercase tracking-[0.3em] mt-2">
                  {marketingHotelHome.featuredGuide.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#0071e3] font-bold">
                <BookOpen className="w-4 h-4" />
                <span>{marketingHotelHome.featuredGuide.poweredByLabel}</span>
              </div>
            </div>

            <DestinationContentCard
              destination={featuredDestination}
              content={wikivoyageContent}
              isLoading={isLoadingWiki}
              variant="featured"
              onExplore={() =>
                navigate(`/hotels/list?location=${encodeURIComponent(featuredDestination)}`)
              }
            />
          </div>
        </section>
      )}

      {/* Trending Destinations */}
      <section className="bg-[#f5f5f7]">
        <div className="container-apple py-16 md:py-20">
          <div className="flex items-center gap-8 border-b border-[rgba(0,0,0,0.1)] pb-4 mb-8 overflow-x-auto">
            <h3 className="font-bold text-lg text-[#1d1d1f] whitespace-nowrap flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0071e3]" />
                {marketingHotelHome?.trending?.title}
            </h3>
            {marketingHotelHome.trending.tabs.map((tab: string) => (
              <Button
                variant="ghost"
                size="md"
                key={tab}
                className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${
                  activeTab === tab
                    ? 'border-[#0071e3] text-[#0071e3]'
                    : 'border-transparent text-[rgba(0,0,0,0.48)] hover:text-[#1d1d1f]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1 */}
            <div className="space-y-3">
              <p className="text-[#0071e3] font-bold text-sm bg-[rgba(0,113,227,0.1)] inline-block px-2 py-1 rounded-[4px]">
                {marketingHotelHome.trending.columnLabels.primary}
              </p>
              <ul className="text-[10px] text-[#0071e3] space-y-2 font-bold">
                {popularDestinations
                  .filter(
                    d =>
                      activeTab === 'All' ||
                      d.destinationType
                        ?.toLowerCase()
                        .includes(activeTab.toLowerCase().replace('ies', 'y').replace('s', ''))
                  )
                  .slice(0, 5)
                  .map(d => (
                    <li
                      key={d.id}
                      className="hover:underline cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`
                        )
                      }
                    >
                      {d.name}, {d.countryCode}
                      <span className="ml-1 text-[rgba(0,0,0,0.48)]">
                        ({d.hotelCount?.toLocaleString()}{' '}
                        {marketingHotelHome.trending.columnLabels.countLabel})
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <p className="text-[rgba(0,0,0,0.48)] font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.secondary}
              </p>
              <ul className="text-[10px] text-[#0071e3] space-y-2 font-bold">
                {popularDestinations.slice(5, 10).map(d => (
                  <li
                    key={d.id}
                    className="hover:underline cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`
                      )
                    }
                  >
                    {d.name}, {d.countryCode}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <p className="text-[rgba(0,0,0,0.48)] font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.tertiary}
              </p>
              <ul className="text-[10px] text-[#0071e3] space-y-2 font-bold">
                {popularDestinations.slice(10, 15).map(d => (
                  <li
                    key={d.id}
                    className="hover:underline cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`
                      )
                    }
                  >
                    {d.name}, {d.countryCode}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-3">
              <p className="text-[rgba(0,0,0,0.48)] font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.quaternary}
              </p>
              <ul className="text-[10px] text-[#0071e3] space-y-2 font-bold">
                {popularDestinations.slice(15, 20).map(d => (
                  <li
                    key={d.id}
                    className="hover:underline cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`
                      )
                    }
                  >
                    {d.name}, {d.countryCode}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </TripLogerLayout>
  );
}

export default HotelHome;

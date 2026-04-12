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
  const marketingHotelHome = contentConfig.marketing.hotelHome;
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
  // Popular destinations for carousel and trending section
  const {
    data: popularDestinations = [],
    isLoading: isLoadingDestinations,
    error: destinationsError,
  } = usePopularDestinations(20);

  // Popular hotels for featured section
  const {
    data: popularHotels = [],
    isLoading: isLoadingHotels,
    error: hotelsError,
  } = usePopularHotels(8);

  // ─── Wikivoyage Destination Content ────────────────────────────────────────────
  // Featured destination for Wikivoyage content - pick from top destinations
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
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-black text-foreground mb-3">
            {marketingHotelHome.disabledTitle}
          </h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
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
      {/* Hero Section */}
      <div className="relative h-[650px] flex items-center justify-center overflow-visible gap-2">
        {/* Background with purple gradient overlay */}
        <div className="absolute inset-0 bg-cover bg-center hero-bg-hotel z-0">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]"></div>
          <div className="absolute inset-0 bg-foreground/40"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center gap-4">
          <div className="mb-4">
            <span className="px-6 py-2 bg-[hsl(var(--secondary))] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--secondary-foreground))] shadow-lg shadow-yellow-200/50">
              {marketingHotelHome.badge}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-background mb-4 text-center drop-shadow-2xl tracking-tight">
            {marketingHotelHome.heroTitle}
          </h1>
          <p className="text-background/80 font-bold text-lg uppercase tracking-[0.3em] mb-8">
            {marketingHotelHome.heroSubtitle}
          </p>

          {/* Glassmorphic Search Card */}
          <div
            className="w-full max-w-5xl bg-background/10 backdrop-blur-md border border-border/20 rounded-xl p-6 shadow-2xl"
            data-testid="hotel-search-form"
          >
            {/* Tabs */}
            <div className="inline-flex bg-background/20 rounded-full p-1 mb-6 backdrop-blur-sm gap-4">
              <Button
                variant="outline"
                size="sm"
                className="px-6 rounded-full border-0 bg-background text-[hsl(var(--primary))] shadow-md hover:bg-background"
              >
                <span>🏨</span> {marketingHotelHome.tabs.stays}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => runtimeConfig.features.flightBookingEnabled && navigate('/flights')}
                disabled={!runtimeConfig.features.flightBookingEnabled}
                className="px-6 rounded-full text-background hover:bg-background/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>✈️</span> {marketingHotelHome.tabs.flights}
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
                  icon={<MapPin size={18} className="text-[hsl(var(--secondary))]" />}
                  value={location}
                  onChange={setLocation}
                  onSelect={(item: Suggestion) => {
                    setLocation(item.title);
                    setCountryCode(item.countryCode || null);
                  }}
                  dataTestId="hotel-city"
                />
              </div>

              {/* Date Picker - Dual Month Calendar for Check-in/Check-out */}
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

              {/* Guests Input */}
              <div className="col-span-12 md:col-span-2 h-14 [&_.h-12]:!h-14">
                <GuestSelector />
              </div>

              {/* Search Button */}
              <div className="col-span-12 md:col-span-2">
                <Button
                  onClick={handleSearch}
                  data-testid="hotel-search-submit"
                  variant="secondary"
                  size="lg"
                  className="w-full h-14 text-foreground shadow-lg shadow-yellow-500/20"
                >
                  {searchFormLabels?.searchCtaLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Bar - Consistent across pages */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-around items-center gap-8 mb-16">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Search size={24} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl font-semibold tracking-tight">
                {hotelBenefits[0]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {hotelBenefits[0]?.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-full text-orange-500">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl font-semibold tracking-tight">
                {hotelBenefits[1]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {hotelBenefits[1]?.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full text-green-500">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl font-semibold tracking-tight">
                {hotelBenefits[2]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {hotelBenefits[2]?.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Trending Hotels / Large cards */}
        <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-wider text-center md:text-left text-2xl font-semibold tracking-tight">
          {marketingHotelHome.deals.title}
        </h2>

        <div className="bg-[hsl(var(--secondary))] rounded-xl p-8 mb-16 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-background gap-4">
            <h3 className="text-3xl font-bold mb-4 text-xl font-semibold tracking-tight">
              {marketingHotelHome.deals.spotlightTitle}
            </h3>
            <p className="text-background/80 text-sm leading-relaxed mb-6">
              {marketingHotelHome.deals.spotlightDescription}
            </p>
            <Button
              variant="primary"
              size="md"
              className="bg-background text-[hsl(var(--secondary))] px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition"
            >
              {marketingHotelHome.deals.ctaLabel}
            </Button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {marketingHotelHome.deals.imageUrls.map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                className="rounded-xl w-full h-32 object-cover"
              />
            ))}
          </div>
        </div>

        {/* ─── Popular Destinations Carousel (from PostgreSQL) ──────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wider text-2xl font-semibold tracking-tight">
                {marketingHotelHome.popularDestinations.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {marketingHotelHome.popularDestinations.subtitle}
                {popularDestinations.length > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {popularDestinations.length}{' '}
                    {marketingHotelHome.popularDestinations.nameLabel.toLowerCase()}s{' '}
                    {marketingHotelHome.popularDestinations.dataSourceSuffixLabel}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingDestinations && (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--secondary))]" />
              <span className="ml-3 text-muted-foreground">
                {searchFormLabels?.loadingDestinationsLabel}
              </span>
            </div>
          )}

          {/* Error State */}
          {destinationsError && !isLoadingDestinations && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 text-sm">
                {searchFormLabels?.errorLoadingDestinationsLabel ||
                  'Unable to load destinations. Please try again later.'}
              </p>
            </div>
          )}

          {/* Carousel Window: show 4 at a time */}
          {!isLoadingDestinations && !destinationsError && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {popularDestinations.length > 0
                  ? popularDestinations.slice(carouselStart, carouselStart + 4).map(dest => (
                      <div
                        key={dest.id}
                        className="group rounded-xl overflow-hidden shadow-lg border border-border cursor-pointer"
                        onClick={() => {
                          navigate(
                            `/hotels/list?location=${encodeURIComponent(dest.name)}&countryCode=${dest.countryCode}`
                          );
                        }}
                      >
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={getDestinationImage(dest)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt={dest.name}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-foreground/80 p-4 pt-12">
                            <h3 className="text-background font-bold text-lg">{dest.name}</h3>
                            <p className="text-background/80 text-xs font-medium">
                              {dest.countryName}
                            </p>
                            {dest.hotelCount > 0 && (
                              <p className="text-background/60 text-xs mt-1">
                                {dest.hotelCount.toLocaleString()} hotels
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-card">
                          <Button variant="secondary" size="sm" className="w-full text-foreground">
                            {marketingHotelHome.popularDestinations.viewDetailsLabel}
                          </Button>
                        </div>
                      </div>
                    ))
                  : /* Empty state */
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden aspect-[4/3] bg-muted animate-pulse"
                      />
                    ))}
              </div>

              {/* Carousel Navigation */}
              {popularDestinations.length > 4 && (
                <div className="flex justify-between items-center mt-6 gap-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0 shadow-lg shadow-indigo-200 disabled:cursor-not-allowed"
                    onClick={() => setCarouselStart(Math.max(0, carouselStart - 4))}
                    disabled={carouselStart === 0}
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {carouselStart + 1}–{Math.min(carouselStart + 4, popularDestinations.length)} of{' '}
                    {popularDestinations.length}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0 shadow-lg shadow-indigo-200 disabled:cursor-not-allowed"
                    onClick={() =>
                      setCarouselStart(Math.min(popularDestinations.length - 4, carouselStart + 4))
                    }
                    disabled={carouselStart + 4 >= popularDestinations.length}
                  >
                    <ChevronRight size={20} />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─── Featured Hotels Section (from PostgreSQL) ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase tracking-wider text-2xl font-semibold tracking-tight">
                {marketingHotelHome.featuredHotels.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {marketingHotelHome.featuredHotels.subtitle}
              </p>
            </div>
            <Building2 className="w-6 h-6 text-[hsl(var(--secondary))]" />
          </div>

          {/* Loading State */}
          {isLoadingHotels && (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--secondary))]" />
              <span className="ml-3 text-muted-foreground">
                {searchFormLabels?.loadingHotelsLabel}
              </span>
            </div>
          )}

          {/* Hotel Cards Grid */}
          {!isLoadingHotels && popularHotels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {popularHotels.map(hotel => (
                <div
                  key={hotel.id}
                  className="group rounded-xl overflow-hidden shadow-lg border border-border cursor-pointer bg-card hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/hotels/detail/${hotel.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getHotelImage(hotel)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={hotel.name}
                    />
                    {hotel.chainName && (
                      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-foreground">
                        {hotel.chainName}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight text-xl font-semibold tracking-tight">
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
                    <p className="text-muted-foreground text-xs mb-3">
                      {hotel.city}
                      {hotel.countryCode && `, ${hotel.countryCode}`}
                    </p>
                    {hotel.hotelType && (
                      <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full">
                        {hotel.hotelType}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State for Hotels */}
          {!isLoadingHotels && popularHotels.length === 0 && (
            <div className="bg-muted rounded-xl p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {marketingHotelHome.featuredHotels.emptyLabel}
              </p>
            </div>
          )}
        </section>

        {/* ─── Featured Destination Guide from Wikivoyage ─────────────────────────────────────── */}
        {(wikivoyageContent || isLoadingWiki) && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8 gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase tracking-wider text-2xl font-semibold tracking-tight">
                  {marketingHotelHome.featuredGuide.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {marketingHotelHome.featuredGuide.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-600">
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
          </section>
        )}

        {/* ─── Trending Destinations Section (from PostgreSQL) ─────────────────────────────── */}
        <section className="bg-background rounded-xl p-8 shadow-sm border border-border mb-16">
          <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
            <h3 className="font-bold text-lg whitespace-nowrap flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--secondary))]" />
              {marketingHotelHome.trending.title}
            </h3>
            {marketingHotelHome.trending.tabs.map(tab => (
              <Button
                variant="ghost"
                size="md"
                key={tab}
                className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === tab ? 'border-[hsl(var(--secondary))] text-[hsl(var(--secondary))]' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1: Top by hotel count */}
            <div className="space-y-3">
              <p className="text-[hsl(var(--secondary))] font-bold text-sm bg-[hsl(var(--secondary)/0.12)] inline-block px-2 py-1 rounded">
                {marketingHotelHome.trending.columnLabels.primary}
              </p>
              <ul className="text-xs text-blue-500 space-y-2 font-medium">
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
                      <span className="ml-1 text-muted-foreground">
                        ({d.hotelCount?.toLocaleString()}{' '}
                        {marketingHotelHome.trending.columnLabels.countLabel})
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Column 2: Next batch */}
            <div className="space-y-3">
              <p className="text-muted-foreground font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.secondary}
              </p>
              <ul className="text-xs text-blue-500 space-y-2 font-medium">
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

            {/* Column 3: Next batch */}
            <div className="space-y-3">
              <p className="text-muted-foreground font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.tertiary}
              </p>
              <ul className="text-xs text-blue-500 space-y-2 font-medium">
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

            {/* Column 4: Final batch */}
            <div className="space-y-3">
              <p className="text-muted-foreground font-bold text-sm">
                {marketingHotelHome.trending.columnLabels.quaternary}
              </p>
              <ul className="text-xs text-blue-500 space-y-2 font-medium">
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
        </section>
      </div>
    </TripLogerLayout>
  );
}

export default HotelHome;

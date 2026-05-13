import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';
import { EnhancedSearchWidget } from '../components/search/EnhancedSearchWidget';
import { Button } from '../components/ui/button';
import { usePopularDestinations } from '../hooks/useStaticData';
import { useWikivoyageGuide } from '../hooks/useWikivoyage';
import { DestinationContentCard } from '../components/DestinationContentCard';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';

interface PopularDestination {
  id: string;
  name: string;
  countryName: string;
  countryCode: string;
  hotelCount: number;
  imageUrl?: string | null;
  destinationType?: string;
}

function FlightHome() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [activeTab, setActiveTab] = useState('Middle East');
  const popularQuery = usePopularDestinations(20);
  const popularDestinations = popularQuery?.data ?? [];
  const [carouselStart, setCarouselStart] = useState(0);

  // Featured destination for Wikivoyage content - pick from top destinations
  const featuredDestination = popularDestinations[0]?.name || 'Paris';
  const { data: wikivoyageContent, isLoading: isLoadingWiki } =
    useWikivoyageGuide(featuredDestination);

  const marketingFlightHome = contentConfig.marketing?.flightHome || {} as any;
  const popularFlights = (marketingFlightHome as any).popularFlights || {};
  const popularDestLabels = (popularFlights as any).popularDestinations || { title: '', subtitle: '' };
  const featuredGuide = (marketingFlightHome as any).featuredGuide || {};
  const trending = (marketingFlightHome as any).trending || { title: '', tabs: [], columnLabels: {} };
  const flightBenefits = (marketingFlightHome as any).benefits || [];

  useEffect(() => {
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

  if (!runtimeConfig.features.flightBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            {marketingFlightHome.disabledTitle}
          </h1>
          <p className="text-sm font-bold text-gray-500 mb-6">
            {marketingFlightHome.disabledSubtitle}
          </p>
          <Button variant="primary" onClick={() => navigate('/')} className="h-11 px-6">
            {marketingFlightHome.backToHomeLabel}
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      {/* Hero Section with Clean Search Widget */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-visible gap-2 bg-gray-50">
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center gap-4 pt-16 pb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 text-center">
            {marketingFlightHome.heroTitle || 'Compare flight deals from 100s of sites.'}
            <span className="text-orange-500">.</span>
          </h1>

          {/* Enhanced Search Widget */}
          <EnhancedSearchWidget
            isSearchEnabled={runtimeConfig.features.flightBookingEnabled}
          />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-around items-center gap-6">
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/751/751463.png"
              className="w-10 h-10 object-contain"
              alt="Search"
            />
            <div>
              <h3 className="font-bold text-[#002a6e] text-xl font-semibold tracking-tight">
                {flightBenefits[0]?.title}
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px]">
                {flightBenefits[0]?.subtitle}
              </p>
            </div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block"></div>
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2645/2645607.png"
              className="w-10 h-10 object-contain"
              alt="Fees"
            />
            <div>
              <h3 className="font-bold text-[#002a6e] text-xl font-semibold tracking-tight">
                {flightBenefits[1]?.title}
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px]">
                {flightBenefits[1]?.subtitle}
              </p>
            </div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block"></div>
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2921/2921226.png"
              className="w-10 h-10 object-contain"
              alt="Flexibility"
            />
            <div>
              <h3 className="font-bold text-[#002a6e] text-xl font-semibold tracking-tight">
                {flightBenefits[2]?.title}
              </h3>
              <p className="text-xs text-gray-500 max-w-[200px]">
                {flightBenefits[2]?.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Flights Carousel – data from PostgreSQL */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {popularFlights.title}
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          {popularDestLabels?.subtitle}
          {popularDestinations.length > 0 && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {popularDestinations.length} {(popularDestLabels.nameLabel || 'destination').toLowerCase()}s{' '}
              {popularDestLabels.dataSourceSuffixLabel || 'from database'}
            </span>
          )}
        </p>

        {/* Carousel window: show 5 at a time */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {popularDestinations.length > 0
            ? popularDestinations.slice(carouselStart, carouselStart + 5).map((dest) => (
                <div
                  key={dest.id}
                  className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer shadow-md"
                  onClick={() => navigate(`/hotels?destination=${encodeURIComponent(dest.name)}`)}
                >
                  <img
                    src={dest.imageUrl || '/images/placeholder-destination.jpg'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={dest.name}
                  />
                  <div className="absolute inset-0 bg-[hsl(var(--foreground)/0.2)] group-hover:bg-[hsl(var(--foreground)/0.1)]"></div>
                  <div className="absolute bottom-0 left-0 w-full bg-[hsl(var(--secondary))] py-2 text-center font-bold text-xs uppercase tracking-wider text-[hsl(var(--secondary-foreground))]">
                    {dest.name}
                    {dest.countryCode && (
                      <span className="ml-1 opacity-60">· {dest.countryCode}</span>
                    )}
                    {dest.hotelCount > 0 && (
                      <span className="ml-1 opacity-60">
                        · {dest.hotelCount.toLocaleString()} {popularDestLabels.priceLabel || 'hotels'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            : /* Loading skeleton */
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 animate-pulse"
                />
              ))}
        </div>
        <div className="flex justify-between items-center mt-4 gap-4">
          <Button
            variant="primary"
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-lg shadow-blue-200 disabled:opacity-40"
            onClick={() => setCarouselStart(Math.max(0, carouselStart - 5))}
            disabled={carouselStart === 0}
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-xs text-gray-500">
            {carouselStart + 1}–{Math.min(carouselStart + 5, popularDestinations.length)} of{' '}
            {popularDestinations.length}
          </span>
          <Button
            variant="primary"
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-lg shadow-blue-200 disabled:opacity-40"
            onClick={() =>
              setCarouselStart(Math.min(popularDestinations.length - 5, carouselStart + 5))
            }
            disabled={carouselStart + 5 >= popularDestinations.length}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Featured Destination Guide from Wikivoyage */}
      {(wikivoyageContent || isLoadingWiki) && (
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {featuredGuide.title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {featuredGuide.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-600">
              <BookOpen className="w-4 h-4" />
              <span>{featuredGuide.poweredByLabel}</span>
            </div>
          </div>

          <DestinationContentCard
            destination={featuredDestination}
            content={wikivoyageContent}
            isLoading={isLoadingWiki}
            variant="featured"
            onExplore={() =>
              navigate(`/hotels?destination=${encodeURIComponent(featuredDestination)}`)
            }
          />
        </div>
      )}

      {/* Trending Destinations from PostgreSQL */}
      <div className="container mx-auto px-4 py-12 bg-white rounded-xl mb-20 shadow-sm border border-gray-200">
        <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
          <h3 className="font-bold text-lg whitespace-nowrap">
            {trending.title}
          </h3>
          {trending.tabs.map((tab: string) => (
            <Button
              variant="ghost"
              size="sm"
              key={tab}
              className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === tab ? 'border-[#003b95] text-[#003b95]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Top by hotel count */}
          <div className="space-y-3">
            <p className="text-[#002a6e] font-bold text-sm bg-[#002a6e] inline-block px-2 py-1 rounded">
              {trending.columnLabels.primary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations
                .filter(
                  (d: PopularDestination) =>
                    activeTab === 'All' ||
                    d.destinationType
                      ?.toLowerCase()
                      .includes(activeTab.toLowerCase().replace('ies', 'y').replace('s', ''))
                )
                .slice(0, 5)
                .map((d: PopularDestination) => (
                  <li
                    key={d.id}
                    className="hover:underline cursor-pointer"
                    onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}
                  >
                    {d.name}, {d.countryCode}
                    <span className="ml-1 text-gray-500">
                      ({d.hotelCount?.toLocaleString()}{' '}
                      {trending.columnLabels.countLabel})
                    </span>
                  </li>
                ))}
            </ul>
          </div>
          {/* Column 2: Next batch */}
          <div className="space-y-3">
            <p className="text-gray-500 font-bold text-sm">
              {trending.columnLabels.secondary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(5, 10).map((d: PopularDestination) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
          {/* Column 3: Next batch */}
          <div className="space-y-3">
            <p className="text-gray-500 font-bold text-sm">
              {trending.columnLabels.tertiary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(10, 15).map((d: PopularDestination) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
          {/* Column 4: Final batch */}
          <div className="space-y-3">
            <p className="text-gray-500 font-bold text-sm">
              {trending.columnLabels.quaternary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(15, 20).map((d: PopularDestination) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default FlightHome;

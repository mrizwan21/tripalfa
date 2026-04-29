'use client';

/**
 * Home Page - Premium International OTA Design
 *
 * Upgraded with:
 * - Phosphor animated icons (duotone with hover effects)
 * - Glassmorphism hero section with premium gradients
 * - Enhanced card designs with hover animations
 * - Modern search widget with improved UX
 * - Professional international OTA aesthetics
 */

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlass,
  MapPin,
  CalendarBlank,
  Users,
  ArrowRight,
  ShoppingCart,
  Sparkle,
  AirplaneTilt,
  Airplane as Plane,
  Bed,
  Car,
  SuitcaseSimple,
  GlobeHemisphereWest,
  Compass,
  Star,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { cn, formatCurrency } from '@tripalfa/shared-utils/utils';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { api, fetchAirports } from '../lib/api';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { Label } from '../components/ui/label';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';

interface CartSummaryResponse {
  data: {
    itemCount: number;
  };
}

interface AirportResult {
  type: 'AIRPORT';
  icon: string;
  title: string;
  subtitle: string;
  code: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  stops: number;
}

// Animated icon wrapper component
function BrandIcon({
  icon: Icon,
  size = 24,
  weight = 'duotone' as const,
  className,
}: {
  icon: React.ComponentType<any>;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'fill' | 'duotone';
  className?: string;
}) {
  return (
    <Icon
      size={size}
      weight={weight}
      className={cn('transition-all duration-300 hover:scale-110', className)}
    />
  );
}

function Home() {
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [activeTab, setActiveTab] = React.useState('flights');
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [airports, setAirports] = useState<AirportResult[]>([]);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<any[]>([]);
  const marketingHome = contentConfig.marketing.home;
  const homeFlightSearchLabels = marketingHome.searchFormLabels.flight;
  const homeHotelSearchLabels = marketingHome.searchFormLabels.hotel;

  // Fetch featured flights and popular destinations on component mount
  useEffect(() => {
    fetchFeaturedFlights();
    fetchCartSummary();
    fetchPopularDestinationsData();
  }, []);

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

  const fetchFeaturedFlights = async () => {
    try {
      const response = await api.get('/search/flights/popular');
      if (response && Array.isArray(response)) {
        setFeaturedFlights(response.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch featured flights:', error);
      setFeaturedFlights([]);
    }
  };

  const fetchPopularDestinationsData = async () => {
    try {
      const { fetchPopularDestinations } = await import('../lib/api');
      const destinations = await fetchPopularDestinations(8);
      setPopularDestinations(destinations || []);
    } catch (error) {
      console.error('Failed to fetch popular destinations:', error);
      setPopularDestinations([]);
    }
  };

  const fetchCartSummary = async () => {
    try {
      const response = await (globalThis as any).fetch?.(
        '/api/cart/summary?sessionId=guest-session'
      );
      if (response && response.ok) {
        const { data } = (await response.json()) as CartSummaryResponse;
        setCartCount(data.itemCount);
      }
    } catch (error) {
      (globalThis as any).console?.log('Cart not available');
    }
  };

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).addEventListener) return;
    const handleScroll = () => setIsScrolled((globalThis as any).scrollY > 50);
    (globalThis as any).addEventListener('scroll', handleScroll);
    return () => (globalThis as any).removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      if (activeTab !== 'flights' || !runtimeConfig.features.flightBookingEnabled) {
        setAirports([]);
        return;
      }
      const fetchAirportData = async () => {
        try {
          const results = await fetchAirports(searchQuery);
          setAirports((results || []) as AirportResult[]);
        } catch (error) {
          console.error('[Home] Failed to fetch airports:', error);
          setAirports([]);
        }
      };
      fetchAirportData();
    } else {
      setAirports([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'flights' && !runtimeConfig.features.flightBookingEnabled) {
      setActiveTab(runtimeConfig.features.hotelBookingEnabled ? 'hotels' : 'packages');
    }
    if (activeTab === 'hotels' && !runtimeConfig.features.hotelBookingEnabled) {
      setActiveTab(runtimeConfig.features.flightBookingEnabled ? 'flights' : 'packages');
    }
  }, [
    activeTab,
    runtimeConfig.features.flightBookingEnabled,
    runtimeConfig.features.hotelBookingEnabled,
  ]);

  const tabItems = [
    { id: 'flights', label: marketingHome.tabs.flights, icon: AirplaneTilt },
    { id: 'hotels', label: marketingHome.tabs.hotels, icon: Bed },
    { id: 'packages', label: marketingHome.tabs.packages, icon: SuitcaseSimple },
    { id: 'cars', label: marketingHome.tabs.cars, icon: Car },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background gap-0">
      {/* Floating Cart */}
      <div className="fixed top-4 right-4 z-50">
        <button
          className={cn(
            'relative bg-white/90 backdrop-blur-xl border border-gray-200 rounded-full p-3.5',
            'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group'
          )}
        >
          <BrandIcon
            icon={ShoppingCart}
            size={22}
            className="text-gray-700 group-hover:text-[hsl(var(--primary))]"
          />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 w-full z-40 transition-all duration-500',
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100/50'
            : 'bg-black/30'
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center shadow-lg">
                <BrandIcon icon={Plane} size={20} weight="fill" className="text-white" />
              </div>
              <span
                className={cn(
                  'text-xl font-bold transition-colors',
                  isScrolled ? 'text-gray-900' : 'text-white'
                )}
              >
                {marketingHome.nav.brandName}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#flights"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[hsl(var(--primary))]',
                  isScrolled ? 'text-gray-600' : 'text-white/90'
                )}
              >
                {marketingHome.nav.flights}
              </a>
              <a
                href="#hotels"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[hsl(var(--primary))]',
                  isScrolled ? 'text-gray-600' : 'text-white/90'
                )}
              >
                {marketingHome.nav.hotels}
              </a>
              <a
                href="#packages"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[hsl(var(--primary))]',
                  isScrolled ? 'text-gray-600' : 'text-white/90'
                )}
              >
                {marketingHome.nav.packages}
              </a>
              <a
                href="#cars"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[hsl(var(--primary))]',
                  isScrolled ? 'text-gray-600' : 'text-white/90'
                )}
              >
                {marketingHome.nav.cars}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-xl border border-white/20 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300">
                <BrandIcon icon={Sparkle} size={16} className="text-[hsl(var(--primary))]" />
                {marketingHome.nav.aiSearchLabel}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-near-black">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
          </div>
        </div>

        <div className="container relative z-10 px-4 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Hero Content */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 shadow-lg">
                <BrandIcon
                  icon={Sparkle}
                  size={14}
                  weight="fill"
                  className="text-[hsl(var(--primary))]"
                />
                <span className="text-white/90 text-sm font-medium">
                  {marketingHome.hero.badge}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
                {marketingHome.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                {marketingHome.hero.subtitle}
              </p>
            </div>

            {/* Search Widget */}
            <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/20 border border-white/20 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
                {tabItems.map(({ id, label, icon: Icon }) => {
                  const isDisabled =
                    (id === 'flights' && !runtimeConfig.features.flightBookingEnabled) ||
                    (id === 'hotels' && !runtimeConfig.features.hotelBookingEnabled);
                  return (
                    <button
                      key={id}
                      disabled={isDisabled}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                        isDisabled && 'opacity-40 cursor-not-allowed',
                        activeTab === id
                          ? 'bg-white text-gray-900 shadow-md shadow-gray-200/50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      )}
                      onClick={() => !isDisabled && setActiveTab(id)}
                    >
                      <Icon
                        size={20}
                        weight={activeTab === id ? 'duotone' : 'regular'}
                        className={activeTab === id ? 'text-[hsl(var(--primary))]' : ''}
                      />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Form */}
              <div className="p-6">
                {activeTab === 'flights' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1 relative group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeFlightSearchLabels.from}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={MapPin} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder={homeFlightSearchLabels.originPlaceholder}
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                        {airports.length > 0 && (
                          <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-100 z-20 max-h-60 overflow-y-auto">
                            {airports.map((airport, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => {
                                  setSearchQuery(airport.title);
                                  setAirports([]);
                                }}
                              >
                                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                                  <BrandIcon
                                    icon={Plane}
                                    size={16}
                                    className="text-[hsl(var(--primary))]"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {airport.title}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {airport.subtitle}
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold font-mono">
                                  {airport.code}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeFlightSearchLabels.to}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={MapPin} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder={homeFlightSearchLabels.destinationPlaceholder}
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeFlightSearchLabels.departure}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={CalendarBlank} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeFlightSearchLabels.return}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={CalendarBlank} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <button
                        disabled={!runtimeConfig.features.flightBookingEnabled}
                        className="w-full h-14 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        <BrandIcon
                          icon={MagnifyingGlass}
                          size={20}
                          weight="duotone"
                          className="text-white"
                        />
                        <span className="sr-only">{homeFlightSearchLabels.searchCtaLabel}</span>
                      </button>
                    </div>
                    {!runtimeConfig.features.flightBookingEnabled && (
                      <div className="lg:col-span-5 text-center">
                        <p className="text-xs font-bold text-gray-400">
                          {homeFlightSearchLabels.disabledLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'hotels' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeHotelSearchLabels.destination}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={MapPin} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder={homeHotelSearchLabels.destinationPlaceholder}
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeHotelSearchLabels.checkIn}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={CalendarBlank} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1 group">
                      <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {homeHotelSearchLabels.checkOut}
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
                          <BrandIcon icon={CalendarBlank} size={18} className="text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          className="pl-11 h-14 rounded-xl border-gray-200 bg-gray-50 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <button
                        disabled={!runtimeConfig.features.hotelBookingEnabled}
                        className="w-full h-14 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <BrandIcon
                          icon={MagnifyingGlass}
                          size={20}
                          weight="duotone"
                          className="text-white"
                        />
                        <span className="sr-only">{homeHotelSearchLabels.searchCtaLabel}</span>
                      </button>
                    </div>
                    {!runtimeConfig.features.hotelBookingEnabled && (
                      <div className="lg:col-span-5 text-center">
                        <p className="text-xs font-bold text-gray-400">
                          {homeHotelSearchLabels.disabledLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'packages' && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
                      <BrandIcon
                        icon={SuitcaseSimple}
                        size={32}
                        className="text-[hsl(var(--primary))]"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {marketingHome.packages.title}
                    </h3>
                    <p className="text-gray-500 mb-6">{marketingHome.packages.subtitle}</p>
                    <button className="h-12 px-8 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                      {marketingHome.packages.ctaLabel}
                    </button>
                  </div>
                )}

                {activeTab === 'cars' && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                      <BrandIcon icon={Car} size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {marketingHome.cars.title}
                    </h3>
                    <p className="text-gray-500 mb-6">{marketingHome.cars.subtitle}</p>
                    <button className="h-12 px-8 rounded-xl border-2 border-blue-500 text-blue-500 font-semibold hover:bg-blue-500 hover:text-white hover:-translate-y-0.5 transition-all duration-300">
                      {marketingHome.cars.ctaLabel}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BrandIcon icon={Compass} size={20} className="text-[hsl(var(--primary))]" />
                <span className="text-sm font-semibold text-[hsl(var(--primary))] uppercase tracking-wider">
                  Explore
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {marketingHome.popularDestinations.title}
              </h2>
              <p className="text-gray-500 mt-2">{marketingHome.popularDestinations.subtitle}</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-[hsl(var(--primary))] font-semibold hover:gap-3 transition-all duration-300">
              {marketingHome.popularDestinations.viewAllLabel}
              <BrandIcon icon={ArrowRight} size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(popularDestinations.length > 0
              ? popularDestinations
              : [
                  { city: 'Dubai', price: 450 },
                  { city: 'London', price: 620 },
                  { city: 'Paris', price: 580 },
                  { city: 'New York', price: 750 },
                ]
            ).map((dest: any, idx: number) => {
              const images = [
                'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600',
                'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600',
                'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
                'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80&w=600',
              ];
              return (
                <div
                  key={dest.city || idx}
                  className="group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
                >
                  <img
                    src={dest.image || images[idx % 4]}
                    alt={dest.city}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/70" />
                  <div className="absolute top-4 right-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <BrandIcon icon={ArrowUpRight} size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-xl font-bold text-white mb-1">{dest.city}</h3>
                    <div className="flex items-center gap-1.5">
                      <BrandIcon icon={Star} size={12} weight="fill" className="text-yellow-400" />
                      <p className="text-sm text-white/90">
                        Flights from ${dest.price || Math.floor(Math.random() * 500) + 200}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Flights */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BrandIcon icon={Plane} size={20} className="text-[hsl(var(--primary))]" />
                <span className="text-sm font-semibold text-[hsl(var(--primary))] uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {marketingHome.featuredFlights.title}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredFlights.length > 0 ? (
              featuredFlights.map(flight => (
                <Card
                  key={flight.id}
                  className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-gray-100 bg-white"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-1">
                        <img
                          src={flight.airlineLogo}
                          alt={flight.airline}
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{flight.airline}</h3>
                        <p className="text-sm text-gray-400">{flight.flightNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                        {formatCurrency(flight.price, flight.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {marketingHome.featuredFlights.perPersonLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between relative">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{flight.departureTime}</p>
                      <p className="text-sm text-gray-400">{flight.origin}</p>
                    </div>
                    <div className="flex-1 px-6 text-center">
                      <p className="text-xs text-gray-400 mb-2">{flight.duration}</p>
                      <div className="w-full h-px bg-gray-200 relative">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-gray-50 px-1.5">
                          <BrandIcon
                            icon={Plane}
                            size={14}
                            weight="fill"
                            className="text-[hsl(var(--primary))]"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {flight.stops === 0
                          ? marketingHome.featuredFlights.directLabel
                          : `${flight.stops} ${marketingHome.featuredFlights.stopSuffix}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{flight.arrivalTime}</p>
                      <p className="text-sm text-gray-400">{flight.destination}</p>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-all duration-300">
                    {marketingHome.featuredFlights.viewDetailsLabel}
                  </button>
                </Card>
              ))
            ) : (
              <div className="md:col-span-2 text-center py-12 text-gray-400">
                {marketingHome.featuredFlights.emptyLabel}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-near-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 bg-[hsl(var(--primary))]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <BrandIcon
            icon={GlobeHemisphereWest}
            size={48}
            weight="duotone"
            className="text-white/60 mx-auto mb-6"
          />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Discover Your Next Adventure
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Join millions of travelers who trust TripAlfa for their journeys. Book flights, hotels,
            and more with confidence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-4 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              Start Searching
            </button>
            <button className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

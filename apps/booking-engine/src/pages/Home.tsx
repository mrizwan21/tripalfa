import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@tripalfa/shared-utils/utils';
import { api } from '../lib/api';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import { SearchBar } from '../components/search/SearchBar';
import { SearchTab } from '../components/search/SearchTabs';
import { TripType } from '../components/search/TripTypeSelector';
import { TravelerConfig } from '../components/search/TravelerSelector';
import { FlightSearchData } from '../components/search/FlightSearchForm';
import { HotelSearchData } from '../components/search/HotelSearchForm';

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

interface Destination {
  city: string;
  price: number;
  image?: string;
}

const DESTINATION_IMAGES = [
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80&w=600',
];

function Home() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [activeTab, setActiveTab] = React.useState<SearchTab>('flights');
  const [cartCount, setCartCount] = useState(0);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [tripType, setTripType] = useState<TripType>('roundtrip');
  const [travelers, setTravelers] = useState<TravelerConfig>({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('economy');
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const marketingHome = contentConfig.marketing.home;
  const homeFlightSearchLabels = marketingHome.searchFormLabels.flight;
  const homeHotelSearchLabels = marketingHome.searchFormLabels.hotel;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [content, flightsResponse, destinations, cart] = await Promise.all([
          loadTenantContentConfig().catch(() => DEFAULT_CONTENT_CONFIG),
          api.get('/search/flights/popular').catch(() => []),
          import('../lib/api').then(m => m.fetchPopularDestinations(8)).catch(() => []),
          (globalThis as any).fetch?.('/api/cart/summary?sessionId=guest-session')
            .then((res: Response) => res.ok ? res.json() : { data: { itemCount: 0 } })
            .catch(() => ({ data: { itemCount: 0 } })),
        ]);

        setContentConfig(content || DEFAULT_CONTENT_CONFIG);
        setFeaturedFlights(Array.isArray(flightsResponse) ? flightsResponse.slice(0, 4) : []);
        setPopularDestinations(Array.isArray(destinations) ? destinations : []);
        setCartCount(cart?.data?.itemCount || 0);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFlightSearch = (data: FlightSearchData) => {
    const params = new URLSearchParams();
    if (data.origin) params.set('origin', data.origin.code || String(data.origin));
    if (data.destination) params.set('destination', data.destination.code || String(data.destination));
    if (data.departureDate) params.set('departureDate', data.departureDate);
    if (data.returnDate) params.set('returnDate', data.returnDate);
    params.set('tripType', data.tripType);
    navigate(`/flights/search?${params.toString()}`);
  };

  const handleHotelSearch = (data: HotelSearchData) => {
    const params = new URLSearchParams();
    if (data.destination) params.set('destination', data.destination);
    if (data.checkInDate) params.set('checkIn', data.checkInDate);
    if (data.checkOutDate) params.set('checkOut', data.checkOutDate);
    params.set('guests', String(data.adults + data.children));
    params.set('rooms', String(data.rooms));
    navigate(`/hotels/search?${params.toString()}`);
  };

  const destinationsToRender = popularDestinations.length > 0
    ? popularDestinations
    : [
        { city: 'Dubai', price: 450 },
        { city: 'London', price: 620 },
        { city: 'Paris', price: 580 },
        { city: 'New York', price: 750 },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Cart Button - Fixed position */}
      {cartCount > 0 && (
        <div className="fixed top-20 right-4 z-40">
          <button
            className="relative w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform border border-gray-200"
            aria-label={`Cart with ${cartCount} items`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#242424]">
              <path d="M9 6L7 6C5.48 6 4 7.48 4 9v10c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V9c0-1.52-1.48-3-3-3H15M9 6V4c0-1.1 0.9-2 2-2h4c1.1 0 2 0.9 2 2v2M9 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-[#ff5722] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        </div>
      )}

      {/* Hero Section - Clean gradient */}
      <section className="bg-gradient-to-b from-[#003b95] to-[#002a6e] relative">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Hero Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {marketingHome.hero.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8">
              {marketingHome.hero.subtitle}
            </p>

            {/* Search Widget */}
            <SearchBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tripType={tripType}
              onTripTypeChange={setTripType}
              travelers={travelers}
              onTravelersChange={setTravelers}
              cabinClass={cabinClass}
              onCabinChange={setCabinClass}
              directFlightsOnly={directFlightsOnly}
              onDirectFlightsChange={setDirectFlightsOnly}
              isFlightBookingEnabled={runtimeConfig.features.flightBookingEnabled}
              isHotelBookingEnabled={runtimeConfig.features.hotelBookingEnabled}
              flightSearchLabels={homeFlightSearchLabels}
              hotelSearchLabels={homeHotelSearchLabels}
              onFlightSearch={handleFlightSearch}
              onHotelSearch={handleHotelSearch}
            />
          </div>
        </div>
      </section>

      {/* Popular Destinations - Clean section */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#003b95]">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
                <span className="text-xs font-semibold text-[#003b95] uppercase tracking-wider">
                  Explore
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#242424]">
                {marketingHome.popularDestinations.title}
              </h2>
              <p className="text-sm text-[#5e5e5e] mt-1">{marketingHome.popularDestinations.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {destinationsToRender.map((dest, idx) => (
              <div
                key={dest.city || idx}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
              >
                <img
                  src={dest.image || DESTINATION_IMAGES[idx % 4]}
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{dest.city}</h3>
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                    </svg>
                    <p className="text-sm text-white/90">
                      From ${dest.price || Math.floor(Math.random() * 500) + 200}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flights - Clean card design */}
      <section className="py-12 md:py-16 bg-[#f7f7f7]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#003b95]">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                </svg>
                <span className="text-xs font-semibold text-[#003b95] uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-[#242424]">
                {marketingHome.featuredFlights.title}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {featuredFlights.length > 0 ? (loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-5 animate-pulse border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))
            ) : (
              featuredFlights.map(flight => (
                <div
                  key={flight.id}
                  className="bg-white rounded-lg p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/flights/detail?id=${flight.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center p-1">
                        <img
                          src={flight.airlineLogo}
                          alt={flight.airline}
                          className="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#242424]">{flight.airline}</h3>
                        <p className="text-sm text-[#9e9e9e]">{flight.flightNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#003b95]">
                        {formatCurrency(flight.price, flight.currency)}
                      </p>
                      <p className="text-xs text-[#9e9e9e]">
                        {marketingHome.featuredFlights.perPersonLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-base font-semibold text-[#242424]">{flight.departureTime}</p>
                      <p className="text-sm text-[#9e9e9e]">{flight.origin}</p>
                    </div>
                    <div className="flex-1 px-4 text-center">
                      <p className="text-xs text-[#9e9e9e] mb-1">{flight.duration}</p>
                      <div className="relative flex items-center justify-center">
                        <div className="flex-1 h-px bg-gray-200" />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#003b95] mx-2 shrink-0">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                        </svg>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      <p className="text-xs text-[#9e9e9e] mt-1">
                        {flight.stops === 0
                          ? marketingHome.featuredFlights.directLabel
                          : `${flight.stops} ${marketingHome.featuredFlights.stopSuffix}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-[#242424]">{flight.arrivalTime}</p>
                      <p className="text-sm text-[#9e9e9e]">{flight.destination}</p>
                    </div>
                  </div>

                  <button
                    className="w-full mt-4 py-2.5 rounded-md border border-[#003b95] text-[#003b95] font-medium text-sm hover:bg-[#003b95] hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/flights/detail?id=${flight.id}`);
                    }}
                    aria-label={`View details for flight ${flight.flightNumber}`}
                  >
                    {marketingHome.featuredFlights.viewDetailsLabel}
                  </button>
                </div>
              ))
            )) : (
              <div className="md:col-span-2 text-center py-8 text-[#9e9e9e]">
                {marketingHome.featuredFlights.emptyLabel}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Clean, minimal */}
      <section className="bg-[#242424] py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Start Your Next Adventure
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Join millions of travelers who trust TripAlfa for their journeys. 
            Book flights, hotels, and more with confidence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              className="px-6 py-3 rounded-md bg-[#ff5722] text-white font-semibold hover:bg-[#e64a19] transition-colors"
              onClick={() => navigate('/')}
            >
              Start Searching
            </button>
            <button className="px-6 py-3 rounded-md border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
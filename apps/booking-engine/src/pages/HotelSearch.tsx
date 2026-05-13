import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Waves,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Building2,
  Zap,
  Map,
  List,
  Grid3X3,
} from 'lucide-react';
import hotelApi from '../api/hotelApi';
import { formatCurrency } from '@tripalfa/ui-components';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { usePopularDestinations } from '../hooks/useStaticData';
import { useFacilities } from '../hooks/useFacilities';
import { useHotelFilters } from '../hooks/useHotelFilters';
import { Button } from '../components/ui/button';
import { HotelMap } from '../components/map/HotelMap';
import { HotelSearchFilters } from '../components/hotel/HotelSearchFilters';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

// View modes
type ViewMode = 'list' | 'grid' | 'map';

function HotelSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config: runtimeConfig } = useTenantRuntime();
  const popularDestinations = usePopularDestinations(5);

  // Form State
  const [location, setLocation] = useState(searchParams.get('location') || 'Dubai');
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 2);
  const [children, setChildren] = useState(Number(searchParams.get('children')) || 0);
  const [rooms, setRooms] = useState(Number(searchParams.get('rooms')) || 1);

  // Results State
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // Filter State - using custom hook for URL persistence
  const { filters, setFilters, resetFilters, activeFilterCount, filterQueryParams } =
    useHotelFilters();

  // Fetch facilities from API
  const { facilities, isLoading: facilitiesLoading } = useFacilities();

  // Calculate result counts for filter badges
  const resultCounts = useMemo(() => {
    const byStar: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const byFacility: Record<number, number> = {};

    hotels.forEach(hotel => {
      // Count by star rating
      if (hotel.rating) {
        const stars = Math.floor(hotel.rating);
        if (stars >= 1 && stars <= 5) {
          byStar[stars]++;
        }
      }

      // Count by facility
      (hotel.facilityIds || []).forEach((id: number) => {
        byFacility[id] = (byFacility[id] || 0) + 1;
      });
    });

    return { total: hotels.length, byStar, byFacility };
  }, [hotels]);

  // Sort hotels based on filter selection
  const sortedHotels = useMemo(() => {
    let sorted = [...hotels];

    switch (filters.sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // top_picks - keep original order
        break;
    }

    return sorted;
  }, [hotels, filters.sortBy]);

  // Filter hotels based on all filters (client-side additional filtering)
  const filteredHotels = useMemo(() => {
    return sortedHotels.filter(hotel => {
      // Star filter
      if (filters.starRating.length > 0) {
        const hotelStars = Math.floor(hotel.rating || 0);
        const matchesStar = filters.starRating.some(s => hotelStars >= s);
        if (!matchesStar) return false;
      }

      // Price filter
      if (filters.priceMin && (hotel.price?.amount || 0) < filters.priceMin) return false;
      if (filters.priceMax && (hotel.price?.amount || 0) > filters.priceMax) return false;

      // Refundable only
      if (filters.refundableOnly && !hotel.refundable) return false;

      return true;
    });
  }, [sortedHotels, filters]);

  // Perform search using LITEAPI with filters
  const handleSearch = async () => {
    if (!runtimeConfig.features.hotelBookingEnabled) {
      setHasSearched(true);
      setHotels([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const searchPayload: any = {
        location,
        checkin,
        checkout,
        adults,
        children: children > 0 ? [children] : undefined,
        rooms,
        // Include all filter params
        ...filterQueryParams,
      };

      // Add facility filtering if facilities are selected
      if (filters.facilityIds.length > 0) {
        searchPayload.facilityIds = filters.facilityIds;
        searchPayload.strictFacilitiesFiltering = filters.strictFacilitiesFiltering;
      }

      const result = await hotelApi.search(searchPayload);
      // API returns { results, total }
      const hotelList = result.results || [];
      setHotels(Array.isArray(hotelList) ? hotelList : []);
      setIsCached(false);

      // Update URL params with search criteria
      const params = new URLSearchParams(searchParams);
      params.set('location', location);
      params.set('checkin', checkin);
      params.set('checkout', checkout);
      params.set('adults', String(adults));
      params.set('children', String(children));
      params.set('rooms', String(rooms));
      setSearchParams(params, { replace: true });
    } catch (error) {
      console.error('Search failed:', error);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter apply
  const handleApplyFilters = useCallback(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [hasSearched, filters]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    resetFilters();
    if (hasSearched) {
      handleSearch();
    }
  }, [hasSearched]);

  // Handle hotel click from map
  const handleHotelClick = useCallback((hotelId: string) => {
    setSelectedHotelId(hotelId);
    // Scroll to hotel in list
    const element = document.getElementById(`hotel-${hotelId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Auto-search on mount if params exist
  useEffect(() => {
    if (runtimeConfig.features.hotelBookingEnabled && searchParams.get('location')) {
      handleSearch();
    }
  }, [runtimeConfig.features.hotelBookingEnabled]);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen pt-28 flex items-center justify-center px-4">
          <div className="w-full max-w-xl p-10 text-center bg-white rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Hotel Search Disabled
            </h1>
            <p className="text-sm font-bold text-gray-500 mb-6">
              Your admin has currently disabled hotel booking for this tenant.
            </p>
            <Button onClick={() => navigate('/')} className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200">
              Back to Home
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      {/* Hero Section with Search */}
      <section className="bg-[#003b95] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80')" }}
          />
        </div>

        <div className="container-apple relative z-10 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Find Your Perfect Stay
            </h1>
            <p className="text-white/70 font-bold text-sm uppercase tracking-wider">
              Curated Hotels Worldwide
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 md:p-8">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                Best Price Guaranteed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
              {/* Destination */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-2">
                  Destination
                </label>
                <div className="relative group">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-hover:scale-110 transition-transform"
                    size={18}
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/10 border-2 border-transparent rounded-xl text-sm font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all"
                    placeholder="Where are you going?"
                  />
                </div>
              </div>

              {/* Check-in */}
              <div>
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-2">
                  Check-in
                </label>
                <div className="relative group">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-hover:text-white transition-colors"
                    size={16}
                  />
                  <input
                    type="date"
                    value={checkin}
                    onChange={e => setCheckin(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/10 border-2 border-transparent rounded-xl text-sm font-bold text-white focus:outline-none focus:border-white/30 focus:bg-white/15 cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Check-out */}
              <div>
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-2">
                  Check-out
                </label>
                <div className="relative group">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-hover:text-white transition-colors"
                    size={16}
                  />
                  <input
                    type="date"
                    value={checkout}
                    onChange={e => setCheckout(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/10 border-2 border-transparent rounded-xl text-sm font-bold text-white focus:outline-none focus:border-white/30 focus:bg-white/15 cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-2">
                  Guests
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-hover:text-white transition-colors"
                    size={16}
                  />
                  <select
                    value={adults}
                    onChange={e => setAdults(Number(e.target.value))}
                    className="w-full h-14 pl-12 pr-4 bg-white/10 border-2 border-transparent rounded-xl text-sm font-bold text-white focus:outline-none focus:border-white/30 focus:bg-white/15 cursor-pointer transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n} className="bg-gray-900">
                        {n} Adult{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} className="mr-2" /> Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-gray-50">
        <div className="container-apple py-12 md:py-16">
          {!hasSearched ? (
            /* Popular Destinations */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Popular Destinations
                </h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-2">
                  Explore trending hotels worldwide
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {(popularDestinations.data || []).slice(0, 5).map((dest: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => {
                      setLocation(dest.city);
                      handleSearch();
                    }}
                    className="group relative h-64 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                  >
                    <img
                      src={dest.imageUrl || '/images/placeholder-hotel.jpg'}
                      alt={dest.city}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-6 left-6">
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {dest.city}
                      </h3>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider mt-1">
                        {dest.hotelCount ? `${dest.hotelCount}+ Hotels` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Results with Filters */
            <div className="flex gap-8">
              {/* Desktop Sidebar Filters */}
              {!isMobile && (
                <div className="w-72 shrink-0">
                  <div className="sticky top-32">
                    <HotelSearchFilters
                      facilities={facilities}
                      facilitiesLoading={facilitiesLoading}
                      filters={filters}
                      onFiltersChange={setFilters}
                      onApply={handleApplyFilters}
                      onReset={handleResetFilters}
                      resultCounts={resultCounts}
                    />
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-12 h-12 border-4 border-[#003b95] border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Searching the globe...
                    </p>
                  </div>
                ) : filteredHotels.length === 0 ? (
                  /* No Results */
                  <div className="text-center py-32 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Building2 size={64} className="mx-auto text-gray-300 mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      No hotels found
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Try adjusting your search criteria</p>
                    <Button
                      onClick={handleResetFilters}
                      className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {filteredHotels.length} Hotels
                          </h2>
                          {isCached && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider">
                              <Zap size={12} />
                              Cached
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">
                          in {location}
                        </p>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-2">
                        <div className="flex bg-gray-50 rounded-lg p-1 gap-1 border border-gray-100">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewMode('list')}
                              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-[#003b95]' : 'text-gray-400 hover:text-gray-700'}`}
                          >
                            <List size={18} />
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewMode('grid')}
                              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#003b95]' : 'text-gray-400 hover:text-gray-700'}`}
                          >
                            <Grid3X3 size={18} />
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewMode('map')}
                              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'map' ? 'bg-white shadow-sm text-[#003b95]' : 'text-gray-400 hover:text-gray-700'}`}
                          >
                            <Map size={18} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Map View */}
                    {viewMode === 'map' && (
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[600px]">
                        <HotelMap
                          hotels={filteredHotels.map(h => ({
                            id: h.id,
                            name: h.name,
                            latitude: h.latitude,
                            longitude: h.longitude,
                            rating: h.rating,
                            price: h.price?.amount,
                            currency: h.price?.currency,
                            image: h.image,
                          }))}
                          onHotelClick={handleHotelClick}
                          selectedHotelId={selectedHotelId || undefined}
                          height="600px"
                          showLocationCard={false}
                        />
                      </div>
                    )}

                    {/* List/Grid View */}
                    {viewMode !== 'map' && (
                      <div
                        className={
                          viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                            : 'space-y-6'
                        }
                      >
                        {filteredHotels.map((hotel: any) => (
                          <div
                            key={hotel.id}
                            id={`hotel-${hotel.id}`}
                            className={`group overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ${
                              viewMode === 'list'
                                ? 'flex h-72'
                                : 'hover:shadow-md'
                            } ${selectedHotelId === hotel.id ? 'ring-2 ring-[#003b95]/20' : ''}`}
                          >
                            {/* Hotel Image */}
                            <div
                              className={`${viewMode === 'list' ? 'w-[35%]' : 'h-48'} relative overflow-hidden bg-gray-50`}
                            >
                              <img
                                src={hotel.image}
                                alt={hotel.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                              />
                              <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#003b95] shadow-sm">
                                  {hotel.refundable ? 'Free Cancellation' : 'Top Rated'}
                                </span>
                              </div>
                            </div>

                            {/* Hotel Info */}
                            <div
                              className={`flex-1 p-6 ${viewMode === 'list' ? 'flex flex-col' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 pr-4">
                                  <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className={
                                          i < (hotel.rating || 4)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-200'
                                        }
                                      />
                                    ))}
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#003b95] transition-colors leading-tight mb-2">
                                    {hotel.name}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <MapPin size={14} className="text-[#003b95]" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">
                                      {hotel.location}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    From
                                  </p>
                                  <p className="text-2xl font-bold text-[#003b95] tracking-tight">
                                    {formatCurrency(
                                      hotel.price?.amount || hotel.pricePerNight || 500
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 font-bold mt-1">
                                    per night
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 p-3 bg-gray-50 rounded-xl flex flex-wrap gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                                  <Wifi size={14} className="text-[#003b95]" /> WiFi
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                                  <Coffee size={14} className="text-[#FF9500]" /> Breakfast
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                                  <Waves size={14} className="text-[#5AC8FA]" /> Pool
                                </span>
                              </div>

                              <div className="mt-auto flex items-center justify-between pt-4 gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="bg-[#003b95] text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                                    {hotel.rating || '4.5'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter leading-none">
                                      Excellent
                                    </p>
                                    <p className="text-xs text-gray-500 font-bold uppercase leading-none mt-1">
                                      {hotel.reviews || 420} Reviews
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center"
                                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                                >
                                  View Rooms <ChevronRight size={16} className="ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet */}
      {isMobile && hasSearched && !isLoading && filteredHotels.length > 0 && (
        <HotelSearchFilters
          facilities={facilities}
          facilitiesLoading={facilitiesLoading}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          resultCounts={resultCounts}
          isMobile={true}
        />
      )}
    </TripLogerLayout>
  );
}

export default HotelSearch;

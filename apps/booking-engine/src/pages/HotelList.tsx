import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Wifi,
  Coffee,
  Waves,
  Search,
  RotateCcw,
  ChevronDown,
  Calendar,
  User,
  Check,
  LayoutList,
  LayoutGrid,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useLiteApiHotels } from '../hooks/useLiteApiHotels';
import { fetchHotelResults } from '../services/liteApiManager';
import { Button } from '../components/ui/button';
import { SearchAutocomplete } from '../components/ui/SearchAutocomplete';
import { formatCurrency } from '@tripalfa/ui-components';
import { BookingStepper } from '../components/ui/BookingStepper';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { useBoardTypes, useHotelAmenities, useHotelTypes } from '../hooks/useStaticData';
import { HotelMap } from '../components/map';
import type { HotelSearchParams } from '../services/liteApiManager';
import { Label } from '../components/ui/label';
type Suggestion = Record<string, any>;

interface Hotel {
  id: string | number;
  name?: string;
  location?: string;
  image?: string;
  price?: { amount: number; currency?: string };
  stars?: number;
  rating?: number;
  type?: string;
  propertyType?: string;
  facilities?: string[];
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface FilterState {
  stars: string[];
  price: string[];
  board: string[];
  type: string[];
  rating: string[];
  facilities: string[];
}

function HotelList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use LiteAPI Hotels hook for search with Redis caching
  const {
    hotels: initialHotels,
    loading: searchLoading,
    error,
    search,
    isCached,
    total,
    searchId,
  } = useLiteApiHotels({
    enableCache: true,
    cacheTTL: 15 * 60 * 1000, // 15 min cache
  });

  const [displayHotels, setDisplayHotels] = useState<Hotel[]>([]);
  const [totalHotels, setTotalHotels] = useState(0);
  const [filterLoading, setFilterLoading] = useState(false);

  // Use DB-backed hooks for filter options via React Query
  const amenitiesQuery = useHotelAmenities();
  const hotelTypesQuery = useHotelTypes();
  const boardTypesQuery = useBoardTypes();

  // Build filter options from DB-backed data with loading states
  const filterOptions = useMemo(
    () => ({
      facilities: (amenitiesQuery.data || []).map(a => a.name),
      types: (hotelTypesQuery.data || []).map(t => t.name),
      boardTypes: (boardTypesQuery.data || []).map(b => b.name),
      starRatings: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    }),
    [amenitiesQuery.data, hotelTypesQuery.data, boardTypesQuery.data]
  );

  // Determine if filters are loading
  const isLoadingFilters =
    amenitiesQuery.isLoading || hotelTypesQuery.isLoading || boardTypesQuery.isLoading;

  // Destination Search State (managed via SearchAutocomplete)
  const [destination, setDestination] = useState(searchParams.get('location') || '');

  // Fetch hotel data using LiteAPI hook
  useEffect(() => {
    const location = searchParams.get('location') || 'Dubai';
    const checkin = searchParams.get('check-in') || '2024-10-25';
    const checkout = searchParams.get('checkout') || '2024-10-26';
    const adults = parseInt(searchParams.get('adults') || '2');

    const searchParamsLite: HotelSearchParams = {
      location,
      checkin,
      checkout,
      adults,
      rooms: 1,
    };

    search(searchParamsLite);
  }, [searchParams]);

  // We can remove mappedHotels as a standalone memo because we handle it in fetch results.
  // We keep it just to map initial results if needed.
  useEffect(() => {
    if (initialHotels && initialHotels.length > 0 && displayHotels.length === 0) {
      const mapped = initialHotels.map((h: any) => ({
        id: h.id,
        name: h.name,
        location: h.location,
        image: h.image,
        price: h.price,
        stars: h.rating,
        rating: h.rating,
        facilities: h.amenities,
        latitude: h.latitude,
        longitude: h.longitude,
      }));
      setDisplayHotels(mapped);
      setTotalHotels(initialHotels.length); // will be corrected by Redis
    }
  }, [initialHotels]);

  // Update destination state when URL changes
  useEffect(() => {
    setDestination(searchParams.get('location') || '');
  }, [searchParams]);

  // Interactive Filter State
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('Recommended');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState<FilterState>({
    stars: [],
    price: [],
    board: [],
    type: [],
    rating: [],
    facilities: [],
  });

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const exists = current.includes(value);
      if (
        value === 'Any' ||
        value === 'Any Price' ||
        value === 'Any Rating' ||
        value === 'Any Facility' ||
        value === 'Any Type' ||
        value === 'Any Basis'
      ) {
        return { ...prev, [category]: [] };
      }
      return {
        ...prev,
        [category]: exists ? current.filter(item => item !== value) : [...current, value],
      };
    });
  };

  // Fetch results from Redis session when filters or sort change
  useEffect(() => {
    if (!searchId) return;

    setFilterLoading(true);

    const payload: any = {
      limit: 20,
      offset: 0,
      sortBy:
        sortBy === 'Price: Low to High'
          ? 'price'
          : sortBy === 'Price: High to Low'
            ? 'price'
            : sortBy === 'Rating: High to Low'
              ? 'rating'
              : 'recommended',
      sortOrder: sortBy.includes('High to Low') ? 'desc' : 'asc',
    };

    if (filters.price.length > 0) {
      let minP = 99999;
      let maxP = 0;
      for (const p of filters.price) {
        if (p === 'Under $100') {
          minP = Math.min(minP, 0);
          maxP = Math.max(maxP, 100);
        }
        if (p === '$100 - $300') {
          minP = Math.min(minP, 100);
          maxP = Math.max(maxP, 300);
        }
        if (p === '$300 - $500') {
          minP = Math.min(minP, 300);
          maxP = Math.max(maxP, 500);
        }
        if (p === '$500+') {
          minP = Math.min(minP, 500);
          maxP = Math.max(maxP, 99999);
        }
      }
      if (minP !== 99999) payload.minPrice = minP;
      if (maxP !== 0) payload.maxPrice = maxP;
    }

    if (filters.rating.length > 0) {
      let minR = 0;
      if (filters.rating.some(r => r.startsWith('9+'))) minR = 9;
      else if (filters.rating.some(r => r.startsWith('8+'))) minR = 8;
      else if (filters.rating.some(r => r.startsWith('7+'))) minR = 7;
      if (minR > 0) payload.minRating = minR;
    }

    if (filters.facilities.length > 0) {
      payload.amenities = filters.facilities;
    }

    fetchHotelResults(searchId, payload)
      .then(res => {
        const mapped = res.results.map((h: any) => ({
          id: h.id,
          name: h.name,
          location: h.location,
          image: h.image,
          price: h.price,
          stars: h.rating,
          rating: h.rating,
          facilities: h.amenities,
          latitude: h.latitude,
          longitude: h.longitude,
        }));
        setDisplayHotels(mapped);
        setTotalHotels(res.total);
        setFilterLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch hotel results:', err);
        setFilterLoading(false);
      });
  }, [searchId, filters, sortBy]);

  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (searchLoading) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#003b95] animate-spin" />
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider animate-pulse">
              Searching the globe...
            </p>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-gray-50">
        <BookingStepper currentStep={1} />

        <div className="container mx-auto px-4 max-w-6xl pt-8">
          {/* Top Search Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex flex-wrap lg:flex-nowrap items-end gap-4">
              <div className="flex-1 min-w-[220px] relative">
                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Destination
                </Label>
                <div className="relative">
                  <SearchAutocomplete
                    type="hotel"
                    placeholder="Where are you going?"
                    icon={<MapPin size={16} className="text-gray-400" />}
                    value={destination}
                    onChange={setDestination}
                    onSelect={(item: Suggestion) => {
                      setDestination(item.title);
                      const params = new URLSearchParams(searchParams);
                      params.set('location', item.title);
                      if (item.countryCode) params.set('countryCode', item.countryCode);
                      navigate(`/hotels/list?${params.toString()}`);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200">
                  <Search size={14} className="mr-2 inline" /> Search
                </button>
              </div>
            </div>
          </div>

          {/* Subfilter Bar */}
          <div className="flex flex-wrap gap-3 mb-8 relative z-50">
            {[{
              id: 'stars',
              label: 'Hotel Categories',
              placeholder: 'Any Stars',
              options: ['Any', '1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            },
            {
              id: 'price',
              label: 'Price Range',
              placeholder: 'Any Price',
              options: ['Any Price', 'Under $100', '$100 - $300', '$300 - $500', '$500+'],
            },
            {
              id: 'board',
              label: 'Board Basis',
              placeholder: 'Any Basis',
              options: ['Any', ...(boardTypesQuery.data || []).map(b => b.name)],
            },
            {
              id: 'type',
              label: 'Property Type',
              placeholder: 'Any Type',
              options: ['Any', ...filterOptions.types],
            },
            {
              id: 'rating',
              label: 'Guest Rating',
              placeholder: 'Any Rating',
              options: ['Any', '7+ Good', '8+ Very Good', '9+ Superb'],
            },
            {
              id: 'facilities',
              label: 'Facilities',
              placeholder: 'Any Facility',
              options: ['Any', ...filterOptions.facilities],
            },
            ].map((f, i) => {
              const selectedCount = filters[f.id as keyof typeof filters].length;
              return (
                <div key={i} className="flex flex-col gap-1 min-w-[130px] flex-1 relative">
                  <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    {f.label}
                  </Label>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setActiveFilter(activeFilter === i ? null : i);
                    }}
                    className={`h-10 px-3 bg-white border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${activeFilter === i || selectedCount > 0 ? 'border-[#003b95] ring-2 ring-[#003b95]/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className={`text-xs font-bold ${selectedCount > 0 ? 'text-[#003b95]' : 'text-gray-500'}`}>
                      {selectedCount > 0 ? `${selectedCount} Selected` : f.placeholder}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-300 ${activeFilter === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {activeFilter === i && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-[60]">
                      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                        {isLoadingFilters && (f.id === 'facilities' || f.id === 'type')
                          ? // Loading skeleton for amenities and types filters
                            Array.from({ length: 4 }).map((_, idx) => (
                              <div key={idx} className="px-4 py-2.5 rounded-xl">
                                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                              </div>
                            ))
                          : f.options.map((opt, idx) => {
                              const isSelected =
                                filters[f.id as keyof typeof filters].includes(opt);
                              return (
                                <div
                                  key={idx}
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleFilter(f.id as keyof typeof filters, opt);
                                  }}
                                  className={`px-4 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#003b95]/5' : 'hover:bg-gray-50'}`}
                                >
                                  <span className={`text-sm font-medium ${isSelected ? 'text-[#003b95]' : 'text-gray-700'}`}>
                                    {opt}
                                  </span>
                                  {isSelected && (
                                    <Check size={12} className="text-[#003b95]" />
                                  )}
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start relative z-0">
            {/* Left Column: Result List */}
            <div className="lg:w-[58%] space-y-6">
              <div className="flex items-center justify-between mb-4 px-2 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Recommended Stays
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on {totalHotels} verified properties found
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* View Mode Toggles */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#003b95] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <LayoutList size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#003b95] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Sort by:
                    </span>
                    <select
                      id="hotel-list-sort"
                      name="hotel-list-sort"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="h-12 lg:h-14 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 cursor-pointer"
                    >
                      <option value="Recommended">Recommended</option>
                      <option value="Price: Low to High">Price: Low to High</option>
                      <option value="Price: High to Low">Price: High to Low</option>
                      <option value="Rating: High to Low">Rating: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {filterLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 size={32} className="text-[#003b95] animate-spin" />
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider animate-pulse">
                    Updating results...
                  </p>
                </div>
              ) : displayHotels.length > 0 ? (
                <>
                  {viewMode === 'list' ? (
                    displayHotels.map(h => (
                      <div
                        key={h.id}
                        className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex h-64"
                      >
                        {/* Hotel Image */}
                        <div className="w-[38%] relative overflow-hidden">
                          <img
                            src={h.image}
                            alt={h.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#003b95] shadow-sm border border-gray-100">
                              Top Rated
                            </span>
                          </div>
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1 p-6 flex flex-col gap-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 pr-4 gap-4">
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={12} className="text-yellow-400 fill-current" />
                                ))}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#003b95] transition-colors leading-tight mb-2">
                                {h.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <MapPin size={14} className="text-[#003b95]" />
                                <span className="text-xs font-bold uppercase tracking-tighter">
                                  {h.location}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                Total Stay
                              </p>
                              <p className="text-2xl font-bold text-[#1d1d1f] tracking-tighter">
                                {formatCurrency(h.price?.amount || 0)}
                              </p>
                              <p className="text-[10px] text-gray-500 font-bold mt-1">
                                {' '}Taxes Included
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-gray-50 rounded-xl flex flex-wrap gap-4">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase">
                              <Wifi size={14} className="text-blue-500" /> WiFi
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase">
                              <Coffee size={14} className="text-orange-500" /> Breakfast
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase">
                              <Waves size={14} className="text-cyan-500" /> Pool
                            </span>
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="bg-[#003b95] text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                                {h.rating}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-tighter text-gray-900 leading-none">
                                  Excellent
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase leading-none mt-1">
                                  420 Reviews
                                </p>
                              </div>
                            </div>
                            <button
                              className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                              onClick={() => navigate(`/hotels/${h.id}`)}
                            >
                              Select Room
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {displayHotels.map(h => (
                        <div
                          key={h.id}
                          className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                        >
                          <div className="h-48 relative overflow-hidden">
                            <img
                              src={h.image}
                              alt={h.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4">
                              <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#003b95] shadow-sm border border-gray-100">
                                Top Rated
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col gap-3 flex-1">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className="text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#003b95] transition-colors leading-tight">
                              {h.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                              <MapPin size={14} className="text-[#003b95]" />
                              <span className="text-xs font-bold uppercase tracking-tighter">
                                {h.location}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase">
                                <Wifi size={12} className="text-blue-500" /> WiFi
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase">
                                <Coffee size={12} className="text-orange-500" /> Breakfast
                              </span>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-[#1d1d1f]">
                                  {formatCurrency(h.price?.amount || 0)}
                                </p>
                              </div>
                              <button
                                className="bg-[#003b95] text-white rounded-lg px-5 py-2 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                                onClick={() => navigate(`/hotels/${h.id}`)}
                              >
                                Select Room
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 gap-2">
                    <Search size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No hotels found</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                    Try adjusting your filters or search criteria to find available hotels.
                  </p>
                  <button
                    onClick={() =>
                      setFilters({
                        stars: [],
                        price: [],
                        board: [],
                        type: [],
                        rating: [],
                        facilities: [],
                      })
                    }
                    className="mt-8 bg-gray-900 hover:bg-gray-700 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-12 pb-10">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-[#003b95] hover:text-[#003b95] transition-all bg-white">
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#003b95] text-white font-bold text-sm shadow-sm">
                  1
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-[#003b95] hover:text-[#003b95] transition-all bg-white">
                  2
                </button>
                <span className="text-gray-400 font-bold">...</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:border-[#003b95] hover:text-[#003b95] transition-all bg-white">
                  10
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-[#003b95] hover:text-[#003b95] transition-all bg-white">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Column: Sticky Map */}
            <div className="hidden lg:block lg:w-[42%] sticky top-24 h-[calc(100vh-120px)] rounded-xl overflow-hidden shadow-lg border border-gray-100 relative bg-white">
              {/* Refresh button overlay */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white rounded-lg px-4 py-2 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-gray-100"
                >
                  <RotateCcw size={18} className="text-[#003b95]" /> Refresh Map
                </button>
              </div>

              <HotelMap
                hotels={displayHotels
                  .filter((h: any) => h.latitude != null && h.longitude != null)
                  .map(h => ({
                    id: String(h.id),
                    name: h.name || 'Hotel',
                    address: h.location,
                    latitude: h.latitude,
                    longitude: h.longitude,
                    rating: h.rating,
                    price: h.price?.amount,
                    currency: h.price?.currency,
                  }))}
                height="100%"
                className="w-full h-full"
                onHotelClick={hotelId =>
                  navigate(`/hotels/${hotelId}`, {
                    state: {
                      checkin: searchParams.get('checkin'),
                      checkout: searchParams.get('checkout'),
                      adults: parseInt(searchParams.get('adults') || '2'),
                    },
                  })
                }
                showLocationCard={false}
              />
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default HotelList;

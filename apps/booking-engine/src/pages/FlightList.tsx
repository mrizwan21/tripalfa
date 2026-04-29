import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  X,
  Plane,
  Clock,
  Shield,
  Briefcase,
  Info,
  ChevronRight,
  Check,
  Luggage,
  Filter,
  SlidersHorizontal,
  ArrowRightLeft,
  Search,
  Calendar,
  User,
  ChevronDown,
  Map as MapIcon,
  RefreshCw,
  Star,
  ShieldCheck,
  Heart,
  Share2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatCurrency } from '@tripalfa/ui-components';
import { FLIGHT_STATIC_DATA } from '../lib/constants/flight-static-data';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { FlightDetailPopup } from '../components/FlightDetailPopup';
import { FareUpsellPopup } from '../components/FareUpsellPopup';
import { AncillaryPopup } from '../components/AncillaryPopup';
import { searchFlights, fetchAirlines, fetchFlightResults } from '../lib/api';
import { BookingFilters } from '../components/booking/BookingFilters';
import { ModifySearchPanel } from '../components/booking/ModifySearchPanel';
import type { Flight } from '../lib/srs-types';
import { Label } from '../components/ui/label';

function FlightList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isAncillaryOpen, setIsAncillaryOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedAncillaries, setSelectedAncillaries] = useState<string[]>([]);

  // Flight data state - populated from location state or API
  const [flights, setFlights] = useState<Flight[]>([]);
  const [totalFlights, setTotalFlights] = useState(0);
  const [searchSessionId, setSearchSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [dbAirlinesMap, setDbAirlinesMap] = useState<
    Map<string, { name: string; logo_url: string }>
  >(new Map());

  // Load airlines from PostgreSQL (with logos) for filter + logo lookup
  useEffect(() => {
    fetchAirlines()
      .then(airlinesData => {
        setAirlines([...(airlinesData || [])] as any[]);
        const map = new Map<string, { name: string; logo_url: string }>();
        (airlinesData || []).forEach((a: any) => {
          map.set(a.iata_code, { name: a.name, logo_url: a.logo_url });
        });
        setDbAirlinesMap(map);
      })
      .catch(console.error);
  }, []);

  // Get airline logo from DB (primary) or fallback
  const getAirlineLogo = (flight: Flight) => {
    const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
    const dbAirline = dbAirlinesMap.get(code);
    if (dbAirline?.logo_url) return dbAirline.logo_url;
    // Fallback to local logos folder
    return `/airline-logos/${code}.png`;
  };

  // Filter and Sort State
  const [sortBy, setSortBy] = useState('Best Value');
  const [filters, setFilters] = useState({
    search: '',
    product: '',
    minPrice: 0,
    maxPrice: 10000,
    stops: [] as string[],
    time: [] as string[], // e.g., 'morning', 'afternoon'
    airlines: [] as string[],
    cabinClass: '',
  });

  // Load flights from location state or fetch from API
  useEffect(() => {
    // Check if flights were passed via navigation (from search page)
    if (location.state?.flights && Array.isArray(location.state.flights)) {
      console.log(
        '[FlightList] Using flights from navigation state:',
        location.state.flights.length
      );
      setFlights(location.state.flights);
      return;
    }

    // Otherwise, try to search using URL params
    const origin = searchParams.get('origin') || searchParams.get('from');
    const destination = searchParams.get('destination') || searchParams.get('to');
    const departureDate = searchParams.get('departureDate') || searchParams.get('date');

    console.log('[FlightList] Search params:', {
      origin,
      destination,
      departureDate,
    });

    if (origin && destination && departureDate) {
      setLoading(true);
      setError(null);

      searchFlights({
        origin,
        destination,
        departureDate,
        adults: parseInt(searchParams.get('adults') || '1'),
        cabinClass: searchParams.get('cabinClass') || 'ECONOMY',
      })
        .then((results: any) => {
          console.log('[FlightList] searchFlights returned:', results);
          const data = results?.data || results;
          if (data?.searchId) {
            // Session-based search - store session ID and fetch results
            setSearchSessionId(data.searchId);
            // Fetch results using the session
            fetchFlightResults(data.searchId, {})
              .then((flightResults: any) => {
                const flightData = Array.isArray(flightResults)
                  ? flightResults
                  : flightResults?.data?.offers ||
                    flightResults?.offers ||
                    flightResults?.results ||
                    [];
                setFlights(flightData);
                setTotalFlights(flightData.length);
              })
              .catch(err => {
                console.error('[FlightList] Failed to fetch flight results:', err);
                setError('Failed to load flight results. Please try again.');
              })
              .finally(() => setLoading(false));
          } else if (data?.error) {
            // API returned an error
            setError(data.error || 'Failed to search flights.');
            setLoading(false);
          } else {
            // Direct results returned
            const flightData = Array.isArray(results)
              ? results
              : data?.offers || data?.results || [];
            setFlights(flightData);
            setTotalFlights(flightData.length);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('[FlightList] Failed to fetch flights:', err);
          setError('Failed to load flights. Please try again.');
          setLoading(false);
        });
    } else {
      console.log('[FlightList] No search params, loading default flights');
      setLoading(true);
      searchFlights({
        origin: 'JFK',
        destination: 'DXB',
        departureDate: '2026-10-24',
      })
        .then((results: any) => {
          const data = results?.data || results;
          if (data?.searchId) {
            // Session-based search - store session ID and fetch results
            setSearchSessionId(data.searchId);
            fetchFlightResults(data.searchId, {})
              .then((flightResults: any) => {
                const flightData = Array.isArray(flightResults)
                  ? flightResults
                  : flightResults?.data?.offers ||
                    flightResults?.offers ||
                    flightResults?.results ||
                    [];
                setFlights(flightData);
                setTotalFlights(flightData.length);
              })
              .catch(() => {
                setError('Failed to load default flights.');
              })
              .finally(() => setLoading(false));
          } else {
            const flightData = Array.isArray(results)
              ? results
              : data?.offers || data?.results || [];
            setFlights(flightData);
            setTotalFlights(flightData.length);
            setLoading(false);
          }
        })
        .catch(() => {
          setError('Failed to load default flights.');
          setLoading(false);
        });
    }
  }, [location.state, searchParams]);

  const handleBookNow = (flight: Flight) => {
    setSelectedFlight(flight);
    setSelectedAncillaries([]);
    setIsDetailOpen(true);
  };

  const toggleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  // Fetch results from Redis session when filters or sort change
  useEffect(() => {
    if (!searchSessionId) return;

    setLoading(true);

    const payload: any = {
      limit: 50,
      offset: 0,
      sortBy:
        sortBy === 'Price: Low to High'
          ? 'price'
          : sortBy === 'Duration: Shortest'
            ? 'duration'
            : 'best value',
      sortOrder: sortBy.includes('Low to High') ? 'asc' : 'asc',
    };

    if (filters.maxPrice < 10000) payload.maxPrice = filters.maxPrice;
    if (filters.airlines.length > 0) payload.airlines = filters.airlines;
    if (filters.stops.length > 0) {
      if (filters.stops.includes('Non-stop')) payload.stops = 0;
      else if (filters.stops.includes('1 Stop')) payload.stops = 1;
      else payload.stops = 2; // Approximation for 2+ stops
    }

    fetchFlightResults(searchSessionId, payload)
      .then((res: any) => {
        const data = res.data || res;
        setFlights(data.results || []);
        setTotalFlights(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch results:', err);
        setLoading(false);
      });
  }, [searchSessionId, filters, sortBy]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookingFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderDropdown = (type: string) => {
    if (activeFilter !== type) return null;

    const dropdownClasses =
      'absolute top-full left-0 mt-4 bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border z-50 p-8 min-w-[320px] animate-in fade-in zoom-in-95 duration-300';

    switch (type) {
      case 'price':
        return (
          <div className={dropdownClasses}>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">
              Price Range
            </h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Min
                  </p>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={e => updateFilter('minPrice', Number(e.target.value))}
                    className="w-full h-11 px-4 bg-muted border border-border rounded-xl flex items-center text-xs font-bold text-foreground outline-none focus:border-[hsl(var(--primary))] gap-2"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Max
                  </p>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={e => updateFilter('maxPrice', Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
              <Button variant="primary" onClick={() => setActiveFilter(null)} className="w-full">
                Apply Filter
              </Button>
            </div>
          </div>
        );
      case 'time':
        // Simplified time filter UI
        return (
          <div className={dropdownClasses + ' min-w-[380px]'}>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">
              Departure Time
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Early Morning',
                  time: '00:00 - 08:00',
                  icon: <RefreshCw size={16} />,
                },
                {
                  label: 'Morning',
                  time: '08:01 - 12:00',
                  icon: <RefreshCw size={16} />,
                },
                {
                  label: 'Afternoon',
                  time: '12:01 - 18:00',
                  icon: <RefreshCw size={16} />,
                },
                {
                  label: 'Night',
                  time: '18:01 - 23:59',
                  icon: <RefreshCw size={16} />,
                },
              ].map(t => {
                const isActive = filters.time.includes(t.label);
                return (
                  <Button
                    variant="outline"
                    size="md"
                    key={t.label}
                    onClick={() => {
                      const newTimes = isActive
                        ? filters.time.filter(x => x !== t.label)
                        : [...filters.time, t.label];
                      updateFilter('time', newTimes);
                    }}
                    className={`p-5 rounded-2xl border transition-all group text-left ${isActive ? 'border-[hsl(var(--primary))] bg-purple-50 ring-1 ring-[hsl(var(--primary))]' : 'border-border hover:border-[hsl(var(--primary))] hover:bg-purple-50'}`}
                  >
                    <p
                      className={`text-[11px] font-black mb-1 ${isActive ? 'text-[hsl(var(--primary))]' : 'text-foreground'}`}
                    >
                      {t.label}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{t.time}</p>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      case 'stops':
        return (
          <div className={dropdownClasses}>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">
              Stops Count
            </h4>
            <div className="space-y-4">
              {['Non-stop', '1 Stop', '2+ Stops'].map(s => (
                <Label
                  key={s}
                  className="flex items-center justify-between cursor-pointer group gap-2 text-sm font-medium"
                >
                  <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                    {s}
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.stops.includes(s)}
                    onChange={e => {
                      const newStops = e.target.checked
                        ? [...filters.stops, s]
                        : filters.stops.filter(stop => stop !== s);
                      updateFilter('stops', newStops);
                    }}
                    className="w-4 h-4 rounded border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                  />
                </Label>
              ))}
            </div>
          </div>
        );
      case 'more':
        return (
          <div className={dropdownClasses}>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">
              Additional Filters
            </h4>

            {/* Airlines */}
            <div className="mb-6">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Preferred Airlines
              </h5>
              <div className="space-y-3">
                {airlines.length > 0 ? (
                  airlines.map((airline: any) => {
                    const airlineName = typeof airline === 'string' ? airline : airline.name;
                    return (
                      <Label
                        key={airlineName}
                        className="flex items-center justify-between cursor-pointer group gap-2 text-sm font-medium"
                      >
                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                          {airlineName}
                        </span>
                        <input
                          id={`flight-airline-${airlineName.toLowerCase().replace(' ', '-')}`}
                          name="flight-airlines"
                          type="checkbox"
                          value={airlineName}
                          checked={filters.airlines.includes(airlineName)}
                          onChange={e => {
                            const newAirlines = e.target.checked
                              ? [...filters.airlines, airlineName]
                              : filters.airlines.filter(a => a !== airlineName);
                            updateFilter('airlines', newAirlines);
                          }}
                          className="w-4 h-4 rounded border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        />
                      </Label>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Search for flights to see airline filters
                  </p>
                )}
              </div>
            </div>

            {/* Cabin Class - from static IATA enumeration */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cabin Class
              </h5>
              <div className="space-y-3">
                {FLIGHT_STATIC_DATA.CABINS.all.map(cabin => (
                  <Label
                    key={cabin.code}
                    className="flex items-center justify-between cursor-pointer group gap-2 text-sm font-medium"
                  >
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                      {cabin.name}
                    </span>
                    <input
                      id={`flight-cabin-${cabin.code.toLowerCase()}`}
                      name="flight-cabin"
                      type="radio"
                      value={cabin.code.toLowerCase()}
                      checked={filters.cabinClass === cabin.code.toLowerCase()}
                      onChange={e => updateFilter('cabinClass', e.target.value)}
                      className="w-4 h-4 border-border text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    />
                  </Label>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex gap-4">
              <Button variant="secondary" onClick={() => setActiveFilter(null)} className="flex-1">
                Reset
              </Button>
              <Button variant="primary" onClick={() => setActiveFilter(null)} className="flex-[2]">
                Apply Filter
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-muted/50 pb-20">
        {/* Header Section */}
        <div className="bg-card border-b border-border sticky top-16 z-40 supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <ModifySearchPanel />
          </div>

          {/* Quick Filters */}
          <div className="container mx-auto px-4 pb-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => toggleFilter('price')}
                className={`h-11 px-6 rounded-2xl border flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  activeFilter === 'price'
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                Price Range
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${activeFilter === 'price' ? 'rotate-180' : ''}`}
                />
              </Button>
              {renderDropdown('price')}

              <Button
                variant="outline"
                size="md"
                onClick={() => toggleFilter('time')}
                className={`h-11 px-6 rounded-2xl border flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  activeFilter === 'time'
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                Departure Time
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${activeFilter === 'time' ? 'rotate-180' : ''}`}
                />
              </Button>
              {renderDropdown('time')}

              <Button
                variant="outline"
                size="md"
                onClick={() => toggleFilter('stops')}
                className={`h-11 px-6 rounded-2xl border flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  activeFilter === 'stops'
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                Stops
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${activeFilter === 'stops' ? 'rotate-180' : ''}`}
                />
              </Button>
              {renderDropdown('stops')}

              <div className="h-8 w-px bg-border mx-2" />

              <Button
                variant="outline"
                size="md"
                onClick={() => toggleFilter('more')}
                className={`h-11 px-6 rounded-2xl border flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                  activeFilter === 'more'
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <SlidersHorizontal size={14} />
                More Filters
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${activeFilter === 'more' ? 'rotate-180' : ''}`}
                />
              </Button>
              {renderDropdown('more')}
            </div>
          </div>
        </div>

        {/* Flight Results */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8 gap-2">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight text-2xl font-semibold tracking-tight">
                {totalFlights} Flights Found
              </h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Showing best results for your trip
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Sort by:
              </span>
              <select
                id="flight-list-sort"
                name="flight-list-sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-black text-foreground uppercase tracking-widest outline-none cursor-pointer"
              >
                <option value="Best Value">Best Value</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Duration: Shortest">Duration: Shortest</option>
              </select>
            </div>
          </div>

          <div className="space-y-6" data-testid="flight-results">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider animate-pulse">
                  Searching best flights...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-20 card shadow-sm">
                <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-6 gap-2">
                  <X size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Search Failed</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{error}</p>
                <Button variant="primary" onClick={() => window.location.reload()} className="mt-6">
                  Try Again
                </Button>
              </div>
            ) : flights.length > 0 ? (
              flights.map((flight, index) => (
                <div
                  key={flight.id}
                  data-testid={`flight-result-card-${index}`}
                  onClick={() => handleBookNow(flight)}
                  className="group relative card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="absolute top-6 right-6 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Heart size={18} />
                    </Button>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    {/* Airline Logo & Info */}
                    <div className="flex flex-col items-center md:items-start gap-3 min-w-[120px]">
                      <img
                        src={getAirlineLogo(flight)}
                        alt={flight.airline}
                        className="h-12 w-12 object-contain rounded-xl bg-background p-1.5 border border-border"
                        onError={e => {
                          // Fallback if logo fails
                          (e.target as HTMLImageElement).src =
                            'https://cdn-icons-png.flaticon.com/512/723/723955.png';
                        }}
                      />
                      <div className="text-center md:text-left">
                        <h3 className="text-base font-bold text-foreground">{flight.airline}</h3>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {flight.flightNumber}
                        </p>
                      </div>
                    </div>

                    {/* Journey Timeline */}
                    <div className="flex-1 w-full md:w-auto gap-4">
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div className="text-center">
                          {/* Departure Date */}
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {flight.departureTime
                              ? format(parseISO(flight.departureTime), 'd MMM')
                              : '--'}
                          </p>
                          {/* Departure Time */}
                          <p className="text-2xl font-black text-foreground tracking-tight">
                            {flight.departureTime
                              ? format(parseISO(flight.departureTime), 'HH:mm')
                              : '--:--'}
                          </p>
                          {/* Origin City + Code */}
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-sm font-black text-muted-foreground">
                              {flight.origin}
                            </span>
                            {flight.segments?.[0]?.departureTerminal && (
                              <span className="text-[9px] font-black bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                                T{flight.segments?.[0]?.departureTerminal}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            {flight.originCity || ''}
                          </p>
                        </div>
                        <div className="flex-1 px-8 relative gap-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {flight.duration}
                            </span>
                          </div>
                          <div className="h-0.5 bg-border relative">
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between gap-4">
                              <div className="w-2 h-2 rounded-full bg-border ring-4 ring-card" />
                              <div className="w-2 h-2 rounded-full bg-border ring-4 ring-card" />
                            </div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                              <Plane size={14} className="text-border rotate-90" />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-[hsl(var(--primary))] text-center mt-3 uppercase tracking-widest">
                            {flight.stops === 0
                              ? 'Non-stop'
                              : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="text-center">
                          {/* Arrival Date */}
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            {flight.arrivalTime
                              ? format(parseISO(flight.arrivalTime), 'd MMM')
                              : '--'}
                          </p>
                          {/* Arrival Time */}
                          <p className="text-2xl font-black text-foreground tracking-tight">
                            {flight.arrivalTime
                              ? format(parseISO(flight.arrivalTime), 'HH:mm')
                              : '--:--'}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-sm font-black text-muted-foreground">
                              {flight.destination}
                            </span>
                            {flight.segments &&
                              flight.segments.length > 0 &&
                              flight.segments[flight.segments.length - 1]?.arrivalTerminal && (
                                <span className="text-[9px] font-black bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                                  T{flight.segments?.[flight.segments.length - 1]?.arrivalTerminal}
                                </span>
                              )}
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            {flight.destinationCity || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col items-center gap-3 min-w-[140px] pl-6 border-l border-border/50">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Economy From
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(flight.amount)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={e => {
                          e.stopPropagation();
                          handleBookNow(flight);
                        }}
                        className="w-full"
                      >
                        Select Flight
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Details Banner */}
                  <div className="bg-muted/50 border-t border-border/40 px-8 py-3 rounded-b-[2.3rem] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Luggage size={14} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Included: {flight.includedBags?.[0]?.quantity || 0}x{' '}
                          {flight.includedBags?.[0]?.weight || 0}
                          {flight.includedBags?.[0]?.unit || 'kg'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Travel Insurance Available
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setSelectedFlight(flight);
                        setIsDetailOpen(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-widest hover:text-[hsl(var(--primary)/0.9)] transition-colors"
                    >
                      Flight Details <ChevronRight size={12} />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-card rounded-[2.5rem] border border-border shadow-sm">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 gap-2">
                  <Search size={32} className="text-border" />
                </div>
                <h3 className="text-lg font-black text-foreground">No flights found</h3>
                <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wide max-w-xs mx-auto">
                  Try adjusting your filters or search criteria to find available flights.
                </p>
                <Button
                  onClick={() =>
                    setFilters({
                      search: '',
                      product: '',
                      minPrice: 0,
                      maxPrice: 10000,
                      stops: [],
                      time: [],
                      airlines: [],
                      cabinClass: '',
                    })
                  }
                  className="mt-8 bg-foreground hover:bg-foreground/80 text-background rounded-xl text-xs font-black uppercase tracking-widest px-8 py-4"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popups */}
      {selectedFlight && (
        <FlightDetailPopup
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          flight={selectedFlight}
          onSelect={() => {
            setIsDetailOpen(false);
            // Business Logic: Only show upsell if available
            if (selectedFlight.upsells && selectedFlight.upsells.length > 0) {
              setIsUpsellOpen(true);
            } else if (selectedFlight.ancillaries && selectedFlight.ancillaries.length > 0) {
              setIsAncillaryOpen(true);
            } else {
              navigate('/add-ons', {
                state: {
                  flight: selectedFlight,
                  passengers: {
                    adults: parseInt(searchParams.get('adults') || '1'),
                    children: parseInt(searchParams.get('children') || '0'),
                    infants: parseInt(searchParams.get('infants') || '0'),
                  },
                },
              });
            }
          }}
        />
      )}

      {selectedFlight && (
        <FareUpsellPopup
          isOpen={isUpsellOpen}
          onClose={() => setIsUpsellOpen(false)}
          flight={selectedFlight}
          onSelect={fare => {
            setIsUpsellOpen(false);
            // Business Logic: Only show ancillary if available
            if (selectedFlight.ancillaries && selectedFlight.ancillaries.length > 0) {
              setIsAncillaryOpen(true);
            } else {
              navigate('/add-ons', {
                state: {
                  flight: selectedFlight,
                  selectedFare: fare,
                  passengers: {
                    adults: parseInt(searchParams.get('adults') || '1'),
                    children: parseInt(searchParams.get('children') || '0'),
                    infants: parseInt(searchParams.get('infants') || '0'),
                  },
                },
              });
            }
          }}
        />
      )}

      {selectedFlight && (
        <AncillaryPopup
          isOpen={isAncillaryOpen}
          onClose={() => setIsAncillaryOpen(false)}
          selectedServices={selectedAncillaries}
          title="Customize Your Trip"
          // Dynamic mapping of ancillaries from API
          services={selectedFlight.ancillaries?.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            type: s.type,
          }))}
          onConfirm={() =>
            navigate('/add-ons', {
              state: {
                flight: selectedFlight,
                passengers: {
                  adults: parseInt(searchParams.get('adults') || '1'),
                  children: parseInt(searchParams.get('children') || '0'),
                  infants: parseInt(searchParams.get('infants') || '0'),
                },
                selectedAncillaries,
              },
            })
          }
          onToggleService={id => {
            setSelectedAncillaries(prev =>
              prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
            );
          }}
        />
      )}
    </TripLogerLayout>
  );
}

export default FlightList;

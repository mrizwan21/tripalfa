import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plane, ArrowRight, Clock, Calendar, ChevronDown, Luggage, ShieldCheck, Star, ArrowLeft, Zap, Server } from 'lucide-react';
import { createOfferRequest, fetchAirlines } from '../lib/api';
import { searchKiwiMultiCity, type KiwiFlightResult } from '../services/kiwiNomadApi';
import { formatCurrency } from '@tripalfa/ui-components';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { FLIGHT_STATIC_DATA } from '@tripalfa/static-data/frontend-index';

export default function FlightSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  
  // Filter state
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());

  // Airlines from DB (with logos)
  const [dbAirlines, setDbAirlines] = useState<Map<string, { name: string; logo_url: string }>>(new Map());

  // Load airlines from PostgreSQL on mount
  useEffect(() => {
    fetchAirlines().then((airlines) => {
      const map = new Map<string, { name: string; logo_url: string }>();
      (airlines || []).forEach((a: any) => {
        map.set(a.iata_code, { name: a.name, logo_url: a.logo_url });
      });
      setDbAirlines(map);
    }).catch(console.error);
  }, []);

  // Get search params
  const origin = searchParams.get('origin') || 'NYC';
  const destination = searchParams.get('destination') || 'LON';
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate');
  const travelers = searchParams.get('travelers') || '1';
  const cabinClass = searchParams.get('cabinClass') || 'Economy';
  const tripTypeParam = searchParams.get('tripType') || 'roundTrip';
  
  // Multi-city legs: leg[0].origin, leg[0].destination, leg[0].date, etc.
  const legsFromParams = useMemo(() => {
    const legs: Array<{ origin: string; destination: string; date: string }> = [];
    let i = 0;
    while (searchParams.has(`leg[${i}][origin]`)) {
      legs.push({
        origin:      searchParams.get(`leg[${i}][origin]`)      || '',
        destination: searchParams.get(`leg[${i}][destination]`) || '',
        date:        searchParams.get(`leg[${i}][date]`)        || '',
      });
      i++;
    }
    return legs;
  }, [searchParams]);
  
  // HYBRID FILTER: Extract unique airlines from real-time results (Redis cached)
  const realtimeAirlines = useMemo(() => {
    const airlineMap = new Map<string, { code: string; name: string; count: number }>();
    flights.forEach(flight => {
      const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
      if (code && !airlineMap.has(code)) {
        airlineMap.set(code, {
          code,
          name: flight.airline || 'Unknown Airline',
          count: 1
        });
      } else if (code) {
        airlineMap.get(code)!.count++;
      }
    });
    return Array.from(airlineMap.values()).sort((a, b) => b.count - a.count);
  }, [flights]);
  
  // HYBRID FILTER: Extract stops options from real-time results
  const stopsOptions = useMemo(() => {
    const stopsSet = new Set<number>();
    flights.forEach(flight => {
      if (flight.stops !== undefined) {
        stopsSet.add(flight.stops);
      }
    });
    return Array.from(stopsSet).sort((a, b) => a - b);
  }, [flights]);
  
  // HYBRID FILTER: Get airline info from DB (primary) or offer data (fallback)
  const getAirlineInfo = (code: string) => {
    // Primary: from PostgreSQL via /static/airlines
    const dbAirline = dbAirlines.get(code);
    if (dbAirline) {
      return {
        name: dbAirline.name,
        logo: dbAirline.logo_url || `/airline-logos/${code}.png`
      };
    }
    // Fallback:loo from realtime airlines (from flight search results) or use code as name
    const realtimeAirline = realtimeAirlines.find(a => a.code === code);
    return {
      name: realtimeAirline?.name || code,
      logo: realtimeAirline?.logo || `/airline-logos/${code}.png`
    };
  };
  
  // Filtered flights based on selected filters
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
      // Filter by stops
      if (selectedStops.size > 0) {
        const stopLabel = flight.stops === 0 ? 'non-stop' : 
                          flight.stops === 1 ? '1-stop' : '2-plus-stops';
        if (!selectedStops.has(stopLabel)) return false;
      }
      
      // Filter by airlines
      if (selectedAirlines.size > 0) {
        const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
        if (!selectedAirlines.has(code)) return false;
      }
      
      return true;
    });
  }, [flights, selectedStops, selectedAirlines]);

  // Toggle filter handlers
  const toggleStopFilter = (stop: string) => {
    setSelectedStops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stop)) {
        newSet.delete(stop);
      } else {
        newSet.add(stop);
      }
      return newSet;
    });
  };
  
  const toggleAirlineFilter = (code: string) => {
    setSelectedAirlines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };
  
  const resetFilters = () => {
    setSelectedStops(new Set());
    setSelectedAirlines(new Set());
  };

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      
      // ── MULTI-CITY: Kiwi Nomad ──────────────────────────────────────────────
      if (tripTypeParam === 'multiCity' && legsFromParams.length >= 2) {
        try {
          const kiwiResults = await searchKiwiMultiCity(
            legsFromParams.map(l => ({ origin: l.origin, destination: l.destination, date: l.date })),
            parseInt(travelers) || 1,
            'USD'
          );
          setFlights(kiwiResults);
          setLoading(false);
          return;
        } catch (err) {
          console.error('[FlightSearch] Kiwi multi-city failed:', err);
          setError('Multi-city search failed. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // ── ONE-WAY / ROUND-TRIP: Duffel ────────────────────────────────────────
      try {
        // Map search parameters to Duffel OfferRequestParams
        const slices = [
          {
            origin,
            destination,
            departure_date: departureDate
          }
        ];

        // Add return slice if returnDate exists (round-trip)
        if (returnDate && tripTypeParam === 'roundTrip') {
          slices.push({
            origin: destination,
            destination: origin,
            departure_date: returnDate
          });
        }

        // Create passengers array - using placeholder data that will be updated during checkout
        const passengers = Array(parseInt(travelers))
          .fill(null)
          .map((_, index) => ({
            type: 'adult' as const,
            given_name: `Passenger${index + 1}`,
            family_name: 'Unknown'
          }));

        const cabinClassMap: Record<string, 'economy' | 'premium_economy' | 'business' | 'first'> = {
          'economy': 'economy',
          'premium_economy': 'premium_economy',
          'business': 'business',
          'first': 'first'
        };

        const offerRequestParams = {
          slices,
          passengers,
          cabin_class: cabinClassMap[cabinClass.toLowerCase()] || 'economy' as 'economy' | 'premium_economy' | 'business' | 'first'
        };

        // Call Duffel API to search for flights
        const result = await createOfferRequest(offerRequestParams);

        // Helper: ISO 8601 duration → "2h 30m"
        const parseDuration = (d?: string) => {
          if (!d) return '--';
          const h = d.match(/(\d+)H/)?.[1] || '0';
          const m = d.match(/(\d+)M/)?.[1] || '0';
          return `${h}h ${m}m`;
        };

        // Helper: extract a clean time string from an ISO datetime
        const timeOf = (iso?: string) => iso?.split('T')[1]?.substring(0, 5) ?? '--:--';

        // Map Duffel offers to flight display format — supports 1-way, return, multi-city
        const formattedFlights = result.offers?.map((offer: any) => {
          const slices: any[] = offer.slices ?? [];
          if (slices.length === 0) return null;

          const tripType: 'one-way' | 'round-trip' | 'multi-city' =
            slices.length === 1 ? 'one-way' :
            slices.length === 2 ? 'round-trip' :
            'multi-city';

          // ── Outbound (slice 0) ──────────────────────────────────
          const outSlice    = slices[0];
          const outSegs     = outSlice?.segments ?? [];
          const outFirst    = outSegs[0];
          const outLast     = outSegs[outSegs.length - 1];

          // ── Return / other slices ───────────────────────────────
          const extraSlices = slices.slice(1).map((sl: any) => {
            const segs  = sl?.segments ?? [];
            const first = segs[0];
            const last  = segs[segs.length - 1];
            return {
              origin:        first?.origin?.iata_code      || first?.origin_iata      || '--',
              originCity:    first?.origin?.city_name      || '',
              destination:   last?.destination?.iata_code  || last?.destination_iata  || '--',
              destCity:      last?.destination?.city_name  || '',
              departureTime: timeOf(first?.departing_at || first?.departure_time),
              arrivalTime:   timeOf(last?.arriving_at   || last?.arrival_time),
              duration:      parseDuration(sl?.duration),
              stops:         (segs.length || 1) - 1,
            };
          });

          return {
            id: offer.id,
            offerId: offer.id,
            tripType,
            airline: outFirst?.operating_carrier?.name || outFirst?.marketing_carrier?.name || 'Unknown Airline',
            carrierCode: outFirst?.operating_carrier?.iata_code || outFirst?.marketing_carrier?.iata_code || '',
            flightNumber: `${outFirst?.marketing_carrier?.iata_code ?? ''}${outFirst?.marketing_carrier_flight_number ?? ''}`,
            departureTime: timeOf(outFirst?.departing_at || outFirst?.departure_time),
            origin: outFirst?.origin?.iata_code      || outFirst?.origin_iata      || origin,
            originCity:    outFirst?.origin?.city_name  || '',
            destination: outLast?.destination?.iata_code || outLast?.destination_iata || destination,
            destCity:    outLast?.destination?.city_name || '',
            arrivalTime: timeOf(outLast?.arriving_at || outLast?.arrival_time),
            duration:    parseDuration(outSlice?.duration),
            stops: (outSegs.length || 1) - 1,
            extraSlices, // return / multi-city legs
            amount: parseFloat(offer.total_amount) || 0,
            currency: offer.total_currency || 'USD',
            refundable: offer.conditions?.refund_before_departure?.allowed === true,
            includedBags: offer.passengers?.[0]?.baggages?.map((b: any) => ({
              quantity: b.quantity ?? 1,
              weight:   b.maximum_weight_kg,
              unit:     'kg',
              type:     b.type,
            })) ?? [],
            rawOffer: offer,
          };
        }).filter(Boolean) ?? [];

        setFlights(formattedFlights);
      } catch (error) {
        console.error('Failed to fetch flights:', error);
        setError('Failed to find flights for this route. Please try another search.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departureDate, returnDate, travelers, cabinClass, tripTypeParam, legsFromParams]);

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-20 font-sans">
        {/* Elite Search Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ArrowLeft size={16} className="text-gray-400" />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                    <Plane size={16} />
                  </div>
                  <h1 className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Available Itineraries</h1>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{origin}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Origin</p>
                  </div>
                  <ArrowRight className="text-gray-300 mb-4" size={24} strokeWidth={3} />
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{destination}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Departure</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-none">{departureDate}</p>
                </div>
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Travelers</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-none">{travelers} Traveler, {cabinClass}</p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="h-10 px-6 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-900 hover:border-[#8B5CF6] transition-all"
                >
                  Modify Search
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Filters Sidebar - HYBRID APPROACH */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-8 sticky top-32">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Global Filters</h3>
                  <button 
                    onClick={resetFilters}
                    className="text-[10px] font-black text-[#8B5CF6] uppercase underline"
                  >
                    Reset All
                  </button>
                </div>
                
                {/* Data Source Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Server size={12} className="text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Filters: Real-time + Static
                  </span>
                </div>

                <div className="space-y-10">
                  {/* Stops Filter - From Real-time Results */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stops</h4>
                      <Zap size={10} className="text-yellow-500" aria-label="Real-time data" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Non-stop', value: 'non-stop', count: flights.filter(f => f.stops === 0).length },
                        { label: '1 Stop', value: '1-stop', count: flights.filter(f => f.stops === 1).length },
                        { label: '2+ Stops', value: '2-plus-stops', count: flights.filter(f => f.stops >= 2).length }
                      ].map((stop) => (
                        <label 
                          key={stop.value} 
                          className={`flex items-center justify-between cursor-pointer group ${stop.count === 0 ? 'opacity-50' : ''}`}
                        >
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                            {stop.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-gray-400">({stop.count})</span>
                            <input 
                              type="checkbox" 
                              checked={selectedStops.has(stop.value)}
                              onChange={() => toggleStopFilter(stop.value)}
                              className="w-4 h-4 rounded border-gray-200 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Airlines Filter - HYBRID: Real-time results + Static logos */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Airlines</h4>
                      <Zap size={10} className="text-yellow-500" aria-label="Real-time data from Redis" />
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {realtimeAirlines.length > 0 ? (
                        realtimeAirlines.map((airline) => {
                          const staticInfo = getAirlineInfo(airline.code);
                          return (
                            <label 
                              key={airline.code} 
                              className="flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <img 
                                  src={staticInfo.logo} 
                                  alt={airline.name}
                                  className="w-5 h-5 object-contain rounded"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                  {airline.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-400">({airline.count})</span>
                                <input 
                                  type="checkbox" 
                                  checked={selectedAirlines.has(airline.code)}
                                  onChange={() => toggleAirlineFilter(airline.code)}
                                  className="w-4 h-4 rounded border-gray-200 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                                />
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        // Loading skeleton when no airlines available yet
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded flex-1 max-w-[120px] animate-pulse" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-4 bg-gray-200 rounded w-6 animate-pulse" />
                                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Found {filteredFlights.length} of {flights.length} results
                  </p>
                  {(selectedStops.size > 0 || selectedAirlines.size > 0) && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[9px] font-black uppercase">
                      Filtered
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By:</span>
                  <select id="flight-search-sort" name="flight-search-sort" className="bg-transparent text-[11px] font-black text-[#8B5CF6] uppercase tracking-widest outline-none border-none py-0">
                    <option>Recommended</option>
                    <option>Cheapest</option>
                    <option>Fastest</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Searching the skies...</p>
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {flights.length > 0 ? 'No flights match your filters' : 'No flights found matching your criteria'}
                  </p>
                  {flights.length > 0 && (
                    <button 
                      onClick={resetFilters}
                      className="mt-4 text-[10px] font-black text-[#8B5CF6] uppercase underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : filteredFlights.map((flight) => {
                const airlineInfo = getAirlineInfo(flight.carrierCode || flight.flightNumber?.slice(0, 2) || '');
                const isRoundTrip = flight.tripType === 'round-trip';
                const isMultiCity = flight.tripType === 'multi-city';
                const hasExtraLegs = flight.extraSlices && flight.extraSlices.length > 0;

                // Reusable leg timeline renderer
                const LegTimeline = ({ leg, label }: { leg: { origin: string; originCity?: string; destination: string; destCity?: string; departureTime: string; arrivalTime: string; duration: string; stops: number }; label?: string }) => (
                  <div className="space-y-1">
                    {label && (
                      <p className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-[0.3em] mb-2">{label}</p>
                    )}
                    <div className="flex items-center justify-between gap-6">
                      <div className="space-y-0.5">
                        <p className="text-xl font-black text-gray-900 tracking-tighter">{leg.departureTime}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{leg.origin}</p>
                        {leg.originCity && <p className="text-[9px] text-gray-300 font-bold">{leg.originCity}</p>}
                      </div>
                      <div className="flex-1 flex flex-col items-center min-w-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">{leg.duration}</span>
                        <div className="w-full h-px bg-gray-100 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] shadow-sm">
                            <Plane size={11} />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${leg.stops === 0 ? 'bg-green-500' : 'bg-amber-400'}`} />
                          <span className="text-[9px] font-black text-gray-700 uppercase tracking-wider">
                            {leg.stops === 0 ? 'Direct' : `${leg.stops} Stop${leg.stops > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-xl font-black text-gray-900 tracking-tighter">{leg.arrivalTime}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{leg.destination}</p>
                        {leg.destCity && <p className="text-[9px] text-gray-300 font-bold">{leg.destCity}</p>}
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div key={flight.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#8B5CF6]/20 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#8B5CF6] scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />

                    {/* Card header — airline + trip type badge + price + CTA */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 px-8 pt-8 pb-6">
                      {/* Airline info */}
                      <div className="flex items-center gap-4 shrink-0 lg:w-44">
                        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100">
                          <img
                            src={airlineInfo.logo}
                            className="w-full h-full object-contain"
                            alt={flight.airline}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/723/723955.png'; }}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900 tracking-tight leading-tight">{flight.airline}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{flight.flightNumber}</p>
                          {/* Trip type badge */}
                          <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            isRoundTrip ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            isMultiCity ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>
                            {isRoundTrip ? '↔ Round Trip' : isMultiCity ? '⤳ Multi-City' : '→ One Way'}
                          </span>
                        </div>
                      </div>

                      {/* All legs stacked */}
                      <div className="flex-1 w-full space-y-0">
                        {/* Outbound leg */}
                        <div className="px-0 lg:px-4">
                          <LegTimeline
                            leg={{
                              origin: flight.origin,
                              originCity: flight.originCity,
                              destination: flight.destination,
                              destCity: flight.destCity,
                              departureTime: flight.departureTime,
                              arrivalTime: flight.arrivalTime,
                              duration: flight.duration,
                              stops: flight.stops,
                            }}
                            label={hasExtraLegs ? 'Outbound' : undefined}
                          />
                        </div>

                        {/* Divider + extra legs (return / multi-city) */}
                        {hasExtraLegs && flight.extraSlices.map((sl: any, idx: number) => (
                          <div key={idx}>
                            {/* Visual divider */}
                            <div className="flex items-center gap-3 my-3 px-4">
                              <div className="flex-1 h-px border-t border-dashed border-gray-200" />
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-[2px] flex items-center gap-1">
                                <ArrowRight size={8} className="rotate-180" />
                                {isRoundTrip ? 'Return' : `Leg ${idx + 2}`}
                                <ArrowRight size={8} />
                              </span>
                              <div className="flex-1 h-px border-t border-dashed border-gray-200" />
                            </div>
                            <div className="px-0 lg:px-4">
                              <LegTimeline
                                leg={sl}
                                label={isMultiCity ? `Leg ${idx + 2}` : undefined}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price & CTA */}
                      <div className="w-full lg:w-52 flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:border-l border-gray-100 lg:pl-8 pt-4 lg:pt-0 shrink-0">
                        <div className="text-right lg:text-center">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                            {isRoundTrip ? 'Round Trip' : isMultiCity ? 'All Legs' : 'Per Person'}
                          </p>
                          <p className="text-2xl font-black text-[#8B5CF6] tracking-tighter">
                            {formatCurrency(flight.amount, flight.currency)}
                          </p>
                          <div className="flex items-center gap-1 justify-end lg:justify-center text-[9px] font-bold mt-1 uppercase tracking-widest">
                            {flight.refundable
                              ? <span className="text-green-500 flex items-center gap-1"><ShieldCheck size={9} />Refundable</span>
                              : <span className="text-gray-400 flex items-center gap-1"><Luggage size={9} />{flight.includedBags?.[0]?.weight ? `${flight.includedBags[0].weight}kg bag` : 'See bags'}</span>
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/flights/detail?id=${flight.id}&offerId=${flight.offerId}`)}
                          className="h-11 px-8 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                        >
                          Select Deal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}


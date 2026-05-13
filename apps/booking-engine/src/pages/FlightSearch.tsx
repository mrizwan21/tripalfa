import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOfferRequest } from '../services/duffelApiManager';
import { formatCurrency } from '@tripalfa/ui-components';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Button } from '../components/ui/button';
import { useAirlines } from '../hooks/useStaticData';
import { useBundledStaticData } from '../hooks/useBundledStaticData';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { Zap } from 'lucide-react';

const FILTER_HEADING_CLASS =
  'text-sm font-bold text-[#003b95] uppercase tracking-wider';
const FILTER_CHECKBOX_CLASS =
  'w-4 h-4 rounded border-gray-200 text-[#003b95] focus:ring-[#003b95]/30';
const AIRPORT_LABEL_CLASS =
  'text-[11px] font-bold text-gray-500 uppercase tracking-wider';

function FlightSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { config: runtimeConfig } = useTenantRuntime();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Filter state
  const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string>>(new Set());
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [selectedAlliances, setSelectedAlliances] = useState<Set<string>>(new Set());

  // Static data lookups
  const staticData = useBundledStaticData();
  const airportsByIata = useMemo(() => {
    return (staticData.airports.data || []).reduce((acc: any, a: any) => {
      acc[a.code] = a;
      return acc;
    }, {});
  }, [staticData.airports.data]);
  const citiesByIata = useMemo(() => {
    return (staticData.cities.data || []).reduce((acc: any, c: any) => {
      acc[c.iata_code] = c;
      return acc;
    }, {});
  }, [staticData.cities.data]);
  const airlinesByIata = useMemo(() => {
    return (staticData.airlines.data || []).reduce((acc: any, a: any) => {
      acc[a.iata_code] = a;
      return acc;
    }, {});
  }, [staticData.airlines.data]);
  const countriesByCode = useMemo(() => {
    return (staticData.countries.data || []).reduce((acc: any, c: any) => {
      acc[c.code] = c;
      return acc;
    }, {});
  }, [staticData.countries.data]);
  const alliances = useMemo(() => {
    const all = new Set<string>();
    (staticData.airlines.data || []).forEach((a: any) => {
      if (a.alliance) all.add(a.alliance);
    });
    return Array.from(all).filter(Boolean);
  }, [staticData.airlines.data]);

  // Get search params
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
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
        origin: searchParams.get(`leg[${i}][origin]`) || '',
        destination: searchParams.get(`leg[${i}][destination]`) || '',
        date: searchParams.get(`leg[${i}][date]`) || '',
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
          count: 1,
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

  // Enhanced: Get airline info from static data (O(1) lookup)
  const getAirlineInfo = (code: string) => {
    const airline = airlinesByIata[code];
    if (airline) {
      return {
        name: airline.name,
        logo: airline.logo_url || `/airline-logos/${code}.png`,
        alliance: airline.alliance || '',
        country: airline.country_code || '',
      };
    }
    // Fallback: from realtime results or code
    const realtimeAirline = realtimeAirlines.find(a => a.code === code);
    return {
      name: realtimeAirline?.name || code,
      logo: (realtimeAirline as any)?.logo || `/airline-logos/${code}.png`,
      alliance: '',
      country: '',
    };
  };

  // Filtered flights based on selected filters (stops, airline, country, alliance)
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
      // Filter by stops
      if (selectedStops.size > 0) {
        const stopLabel =
          flight.stops === 0 ? 'non-stop' : flight.stops === 1 ? '1-stop' : '2-plus-stops';
        if (!selectedStops.has(stopLabel)) return false;
      }
      // Filter by airlines
      if (selectedAirlines.size > 0) {
        const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
        if (!selectedAirlines.has(code)) return false;
      }
      // Filter by country
      if (selectedCountries.size > 0) {
        const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
        const airline = airlinesByIata[code];
        if (!airline || !selectedCountries.has(airline.country_code)) return false;
      }
      // Filter by alliance
      if (selectedAlliances.size > 0) {
        const code = flight.flightNumber?.slice(0, 2) || flight.airline?.slice(0, 2).toUpperCase();
        const airline = airlinesByIata[code];
        if (!airline || !selectedAlliances.has(airline.alliance)) return false;
      }
      return true;
    });
  }, [
    flights,
    selectedStops,
    selectedAirlines,
    selectedCountries,
    selectedAlliances,
    airlinesByIata,
  ]);
  // Filter toggles for new filters
  const toggleCountryFilter = (code: string) => {
    setSelectedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      return newSet;
    });
  };
  const toggleAllianceFilter = (alliance: string) => {
    setSelectedAlliances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alliance)) newSet.delete(alliance);
      else newSet.add(alliance);
      return newSet;
    });
  };
  // ---
  // Enhance flight display: resolve airport/city names
  const resolveAirportName = (iata: string) => {
    const airport = airportsByIata[iata];
    if (airport) return `${airport.name} (${airport.code})`;
    const city = citiesByIata[iata];
    if (city) return `${city.name} (${city.iata_code})`;
    return iata;
  };
  // ---

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
      if (!origin || !destination) {
        setFlights([]);
        setError('Missing search parameters. Please start from the flight search form.');
        setLoading(false);
        return;
      }

      if (!runtimeConfig.features.flightBookingEnabled) {
        setFlights([]);
        setError('Flight search is currently disabled by admin settings.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // ── ONE-WAY / ROUND-TRIP / MULTI-CITY: Duffel ─────────────────────────
      try {
        // Build slices based on trip type
        let slices: Array<{
          origin: string;
          destination: string;
          departure_date: string;
        }> = [];

        if (tripTypeParam === 'multiCity' && legsFromParams.length >= 2) {
          // Multi-city: use all legs from params
          slices = legsFromParams.map(l => ({
            origin: l.origin,
            destination: l.destination,
            departure_date: l.date,
          }));
        } else {
          // One-way or round-trip: single slice
          slices = [
            {
              origin,
              destination,
              departure_date: departureDate,
            },
          ];

          // Add return slice if returnDate exists (round-trip)
          if (returnDate && tripTypeParam === 'roundTrip') {
            slices.push({
              origin: destination,
              destination: origin,
              departure_date: returnDate,
            });
          }
        }

        // Create passengers array - using placeholder data that will be updated during checkout
        const passengers = Array(parseInt(travelers))
          .fill(null)
          .map((_, index) => ({
            type: 'adult' as const,
            given_name: `Passenger${index + 1}`,
            family_name: 'Unknown',
          }));

        const cabinClassMap: Record<string, 'economy' | 'premium_economy' | 'business' | 'first'> =
          {
            economy: 'economy',
            premium_economy: 'premium_economy',
            business: 'business',
            first: 'first',
          };

        const offerRequestParams = {
          slices,
          passengers,
          cabin_class:
            cabinClassMap[cabinClass.toLowerCase()] ||
            ('economy' as 'economy' | 'premium_economy' | 'business' | 'first'),
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
        const formattedFlights =
          result.offers
            ?.map((offer: any) => {
              const slices: any[] = offer.slices ?? [];
              if (slices.length === 0) return null;

              const tripType: 'one-way' | 'round-trip' | 'multi-city' =
                slices.length === 1 ? 'one-way' : slices.length === 2 ? 'round-trip' : 'multi-city';

              // ── Outbound (slice 0) ──────────────────────────────────
              const outSlice = slices[0];
              const outSegs = outSlice?.segments ?? [];
              const outFirst = outSegs[0];
              const outLast = outSegs[outSegs.length - 1];

              // ── Return / other slices ───────────────────────────────
              const extraSlices = slices.slice(1).map((sl: any) => {
                const segs = sl?.segments ?? [];
                const first = segs[0];
                const last = segs[segs.length - 1];
                return {
                  origin: first?.origin?.iata_code || first?.origin_iata || '--',
                  originCity: first?.origin?.city_name || '',
                  destination: last?.destination?.iata_code || last?.destination_iata || '--',
                  destCity: last?.destination?.city_name || '',
                  departureTime: timeOf(first?.departing_at || first?.departure_time),
                  arrivalTime: timeOf(last?.arriving_at || last?.arrival_time),
                  duration: parseDuration(sl?.duration),
                  stops: (segs.length || 1) - 1,
                };
              });

              return {
                id: offer.id,
                offerId: offer.id,
                tripType,
                airline:
                  outFirst?.operating_carrier?.name ||
                  outFirst?.marketing_carrier?.name ||
                  'Unknown Airline',
                carrierCode:
                  outFirst?.operating_carrier?.iata_code ||
                  outFirst?.marketing_carrier?.iata_code ||
                  '',
                flightNumber: `${outFirst?.marketing_carrier?.iata_code ?? ''}${outFirst?.marketing_carrier_flight_number ?? ''}`,
                departureTime: timeOf(outFirst?.departing_at || outFirst?.departure_time),
                origin: outFirst?.origin?.iata_code || outFirst?.origin_iata || origin,
                originCity: outFirst?.origin?.city_name || '',
                destination:
                  outLast?.destination?.iata_code || outLast?.destination_iata || destination,
                destCity: outLast?.destination?.city_name || '',
                arrivalTime: timeOf(outLast?.arriving_at || outLast?.arrival_time),
                duration: parseDuration(outSlice?.duration),
                stops: (outSegs.length || 1) - 1,
                extraSlices, // return / multi-city legs
                amount: parseFloat(offer.total_amount) || 0,
                currency: offer.total_currency || 'USD',
                refundable: offer.conditions?.refund_before_departure?.allowed === true,
                changeable: offer.conditions?.change_before_departure?.allowed === true,
                refundPenalty: offer.conditions?.refund_before_departure?.penalty_amount
                  ? `${offer.conditions.refund_before_departure.penalty_currency || 'USD'} ${offer.conditions.refund_before_departure.penalty_amount}`
                  : null,
                changePenalty: offer.conditions?.change_before_departure?.penalty_amount
                  ? `${offer.conditions.change_before_departure.penalty_currency || 'USD'} ${offer.conditions.change_before_departure.penalty_amount}`
                  : null,
                includedBags:
                  offer.passengers?.[0]?.baggages?.map((b: any) => ({
                    quantity: b.quantity ?? 1,
                    weight: b.maximum_weight_kg,
                    unit: 'kg',
                    type: b.type,
                  })) ?? [],
                rawOffer: offer,
              };
            })
            .filter(Boolean) ?? [];

        // Enhance: Attach resolved airport/city names to each flight
        setFlights(
          formattedFlights.map(flight => ({
            ...flight,
            originResolved: resolveAirportName(flight.origin),
            destinationResolved: resolveAirportName(flight.destination),
          }))
        );
      } catch (error) {
        console.error('Failed to fetch flights:', error);
        setError('Failed to find flights for this route. Please try another search.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [
    origin,
    destination,
    departureDate,
    returnDate,
    travelers,
    cabinClass,
    tripTypeParam,
    legsFromParams,
    runtimeConfig.features.flightBookingEnabled,
  ]);

  if (!runtimeConfig.features.flightBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="bg-gray-50 min-h-screen pb-20 font-sans flex items-center justify-center gap-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center max-w-xl mx-4 space-y-4">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Flight Search Disabled
            </h1>
            <p className="text-sm font-bold text-gray-500">
              Your admin has currently disabled flight booking for this tenant.
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
      <div className="bg-gray-50 min-h-screen pb-20 font-sans">
        {/* Search Header */}
        <section className="bg-white border-b border-gray-100 overflow-hidden">
          <div className="container-apple pt-12 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    aria-label="Back to home"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                  <div className="w-8 h-8 rounded-lg bg-[#003b95] flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h1 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                    Available Itineraries
                  </h1>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {origin}
                    </h2>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Origin
                    </p>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400 mb-4">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {destination}
                    </h2>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Destination
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    Departure
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-none">
                    {departureDate}
                  </p>
                </div>
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    Travelers
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-none">
                    {travelers} Traveler, {cabinClass}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Modify Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container-apple mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Filters Sidebar */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-32">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                    Global Filters
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-xs font-bold text-gray-500 uppercase hover:text-gray-900 transition-colors"
                  >
                    Reset All
                  </Button>
                </div>

                {/* Data Source Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-500">
                    <rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 6h4M6 18h4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Filters: Real-time + Static
                  </span>
                </div>

                <div className="space-y-10">
                  {/* Stops Filter - From Real-time Results */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className={FILTER_HEADING_CLASS}>Stops</h4>
                      <Zap size={10} className="text-yellow-500" aria-label="Real-time data" />
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Non-stop',
                          value: 'non-stop',
                          count: flights.filter(f => f.stops === 0).length,
                        },
                        {
                          label: '1 Stop',
                          value: '1-stop',
                          count: flights.filter(f => f.stops === 1).length,
                        },
                        {
                          label: '2+ Stops',
                          value: '2-plus-stops',
                          count: flights.filter(f => f.stops >= 2).length,
                        },
                      ].map(stop => (
                        <label
                          key={stop.value}
                          className={`flex items-center justify-between cursor-pointer group ${stop.count === 0 ? 'opacity-50' : ''}`}
                        >
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                            {stop.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">
                              ({stop.count})
                            </span>
                            <input
                              type="checkbox"
                              checked={selectedStops.has(stop.value)}
                              onChange={() => toggleStopFilter(stop.value)}
                              className={FILTER_CHECKBOX_CLASS}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Airlines Filter - HYBRID: Real-time results + Static logos */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className={FILTER_HEADING_CLASS}>Airlines</h4>
                      <Zap
                        size={10}
                        className="text-yellow-500"
                        aria-label="Real-time data from Redis"
                      />
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {realtimeAirlines.length > 0 ? (
                        realtimeAirlines.map(airline => {
                          const staticInfo = getAirlineInfo(airline.code);
                          return (
                             <label
                              key={airline.code}
                              className="flex items-center justify-between cursor-pointer group gap-2 text-sm font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={staticInfo.logo}
                                  alt={airline.name}
                                  className="w-5 h-5 object-contain rounded"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                  {airline.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">
                                  ({airline.count})
                                </span>
                                <input
                                  type="checkbox"
                                  checked={selectedAirlines.has(airline.code)}
                                  onChange={() => toggleAirlineFilter(airline.code)}
                                  className={FILTER_CHECKBOX_CLASS}
                                />
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        // Loading skeleton when no airlines available yet
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded flex-1 max-w-[120px] animate-pulse gap-4" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-4 bg-gray-100 rounded w-6 animate-pulse" />
                                <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
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
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Found {filteredFlights.length} of {flights.length} results
                  </p>
                  {(selectedStops.size > 0 || selectedAirlines.size > 0) && (
                    <span className="px-2 py-1 bg-[#003b95]/10 text-[#003b95] rounded-full text-xs font-bold uppercase">
                      Filtered
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#003b95] uppercase tracking-wider">Sort By:</span>
                  <select
                    id="flight-search-sort"
                    name="flight-search-sort"
                    className="h-12 lg:h-14 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
                  >
                    <option>Recommended</option>
                    <option>Cheapest</option>
                    <option>Fastest</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 gap-4">
                  <div className="w-12 h-12 border-4 border-[#003b95] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Searching the skies...
                  </p>
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 gap-4">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {flights.length > 0
                      ? 'No flights match your filters'
                      : 'No flights found matching your criteria'}
                  </p>
                  {flights.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={resetFilters}
                      className="mt-4 bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                              ) : (
                filteredFlights.map(flight => {
                  const airlineInfo = getAirlineInfo(
                    flight.carrierCode || flight.flightNumber?.slice(0, 2) || ''
                  );
                  const isRoundTrip = flight.tripType === 'round-trip';
                  const isMultiCity = flight.tripType === 'multi-city';
                  const hasExtraLegs = flight.extraSlices && flight.extraSlices.length > 0;

                  // Reusable leg timeline renderer (with resolved names)
                  const LegTimeline = ({
                    leg,
                    label,
                  }: {
                    leg: {
                      origin: string;
                      originCity?: string;
                      destination: string;
                      destCity?: string;
                      departureTime: string;
                      arrivalTime: string;
                      duration: string;
                      stops: number;
                    };
                    label?: string;
                  }) => (
                    <div className="space-y-2">
                      {label && (
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {label}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-6">
                        <div className="space-y-0.5">
                          <p className="text-xl font-bold text-gray-900 tracking-tight">
                            {leg.departureTime}
                          </p>
                          <p className={AIRPORT_LABEL_CLASS}>{resolveAirportName(leg.origin)}</p>
                          {leg.originCity && (
                            <p className="text-xs text-gray-500 font-bold">
                              {leg.originCity}
                            </p>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center min-w-0 gap-4">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {leg.duration}
                          </span>
                          <div className="w-full h-px bg-gray-200 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                              </svg>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${leg.stops === 0 ? 'bg-green-500' : 'bg-amber-400'}`}
                            />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {leg.stops === 0
                                ? 'Direct'
                                : `${leg.stops} Stop${leg.stops > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-xl font-bold text-gray-900 tracking-tight">
                            {leg.arrivalTime}
                          </p>
                          <p className={AIRPORT_LABEL_CLASS}>
                            {resolveAirportName(leg.destination)}
                          </p>
                          {leg.destCity && (
                            <p className="text-xs text-gray-500 font-bold">
                              {leg.destCity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <div
                      key={flight.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                    >
                      {/* Card header — airline + trip type badge + price + CTA */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 px-6 pt-6 pb-5">
                        {/* Airline info */}
                        <div className="flex items-center gap-4 shrink-0 lg:w-44">
                          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                            <img
                              src={airlineInfo.logo}
                              className="w-full h-full object-contain"
                              alt={flight.airline}
                              onError={e => {
                                (e.target as HTMLImageElement).src =
                                  'https://cdn-icons-png.flaticon.com/512/723/723955.png';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 tracking-tight leading-tight">
                              {flight.airline}
                            </h4>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                              {flight.flightNumber}
                            </p>
                            {/* Trip type badge */}
                            <span
                              className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isRoundTrip
                                  ? 'bg-[#003b95]/10 text-[#003b95] border-[#003b95]/20'
                                  : isMultiCity
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {isRoundTrip
                                ? '↔ Round Trip'
                                : isMultiCity
                                  ? '⤳ Multi-City'
                                  : '→ One Way'}
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
                          {hasExtraLegs &&
                            flight.extraSlices.map((sl: any, idx: number) => (
                              <div key={idx}>
                                {/* Visual divider */}
                                <div className="flex items-center gap-3 my-3 px-4">
                                  <div className="flex-1 h-px border-t border-dashed border-gray-200" />
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" className="rotate-180">
                                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {isRoundTrip ? 'Return' : `Leg ${idx + 2}`}
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
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
                        <div className="w-full lg:w-52 flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:border-l lg:border-gray-100 lg:pl-6 pt-4 lg:pt-0 shrink-0">
                          <div className="text-right lg:text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                              {isRoundTrip ? 'Round Trip' : isMultiCity ? 'All Legs' : 'Per Person'}
                            </p>
                            <p className="text-2xl font-bold text-[#003b95] tracking-tight">
                              {formatCurrency(flight.amount, flight.currency)}
                            </p>
                            <div className="flex flex-col items-end lg:items-center gap-1 text-xs font-bold mt-1 uppercase tracking-widest">
                              {flight.refundable ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                                  </svg>
                                  Refundable
                                  {flight.refundPenalty && flight.refundPenalty !== 'USD 0' && (
                                    <span className="text-green-500 font-normal">
                                      (-{flight.refundPenalty})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-500 flex items-center gap-1">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 7h-5V4c0-1.1-.9-2-2-2h-6c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM9 4h6v3H9V4zm11 16H4V9h5c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2h5v11z" fill="currentColor"/>
                                  </svg>
                                  {flight.includedBags?.[0]?.weight
                                    ? `${flight.includedBags[0].weight}kg bag`
                                    : 'See bags'}
                                </span>
                              )}
                              {flight.changeable && (
                                <span className="text-[#003b95] flex items-center gap-1">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 3h-4V1H9v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
                                  </svg>
                                  Changes OK
                                  {flight.changePenalty && flight.changePenalty !== 'USD 0' && (
                                    <span className="text-[#003b95]/80 font-normal">
                                      (-{flight.changePenalty})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              navigate(`/flights/detail?id=${flight.id}&offerId=${flight.offerId}`)
                            }
                            className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                            aria-label={`Select flight ${flight.flightNumber}`}
                          >
                            Select Deal
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default FlightSearch;

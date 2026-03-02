/**
 * DuffelFlightResults Component
 *
 * Displays flight search results from Duffel API with filtering,
 * sorting, and selection capabilities.
 */

import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@tripalfa/ui-components";
import {
  Plane,
  Clock,
  ArrowRight,
  ShieldCheck,
  Luggage,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Heart,
  Share2,
  Zap,
  Server,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import type {
  FlightSearchResult,
  FlightSearchFilters,
} from "../../types/duffel";

// ============================================================================
// TYPES
// ============================================================================

interface DuffelFlightResultsProps {
  /** Flight results to display */
  flights: FlightSearchResult[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Whether results are from cache */
  isCached?: boolean;
  /** Callback when flight is selected */
  onSelectFlight?: (flight: FlightSearchResult) => void;
  /** Callback to refresh results */
  onRefresh?: () => void;
  /** Origin airport code */
  origin?: string;
  /** Destination airport code */
  destination?: string;
  /** Departure date */
  departureDate?: string;
  /** Additional className */
  className?: string;
}

interface AirlineInfo {
  code: string;
  name: string;
  logo: string;
  alliance?: string;
  country?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAirlineLogo(carrierCode: string): string {
  if (!carrierCode)
    return "https://cdn-icons-png.flaticon.com/512/723/723955.png";
  return `/airline-logos/${carrierCode}.png`;
}

function resolveAirportName(
  iata: string,
  airportsByIata: Record<string, any>,
): string {
  const airport = airportsByIata[iata];
  if (airport) return `${airport.name} (${airport.code})`;
  return iata;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LegTimelineProps {
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
  resolveAirport: (code: string) => string;
}

const LegTimeline: React.FC<LegTimelineProps> = ({
  leg,
  label,
  resolveAirport,
}) => (
  <div className="space-y-2">
    {label && (
      <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">
        {label}
      </p>
    )}
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-0.5">
        <p className="text-xl font-black text-gray-900 tracking-tighter">
          {leg.departureTime}
        </p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {resolveAirport(leg.origin)}
        </p>
        {leg.originCity && (
          <p className="text-[9px] text-gray-300 font-bold">{leg.originCity}</p>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center min-w-0 gap-4">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
          {leg.duration}
        </span>
        <div className="w-full h-px bg-gray-100 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm gap-2">
            <Plane size={11} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              leg.stops === 0 ? "bg-green-500" : "bg-amber-400"
            }`}
          />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-wider">
            {leg.stops === 0
              ? "Direct"
              : `${leg.stops} Stop${leg.stops > 1 ? "s" : ""}`}
          </span>
        </div>
      </div>
      <div className="text-right space-y-0.5">
        <p className="text-xl font-black text-gray-900 tracking-tighter">
          {leg.arrivalTime}
        </p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {resolveAirport(leg.destination)}
        </p>
        {leg.destCity && (
          <p className="text-[9px] text-gray-300 font-bold">{leg.destCity}</p>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DuffelFlightResults({
  flights,
  loading = false,
  error = null,
  isCached = false,
  onSelectFlight,
  onRefresh,
  origin = "",
  destination = "",
  departureDate = "",
  className = "",
}: DuffelFlightResultsProps) {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FlightSearchFilters>({
    stops: new Set(),
    airlines: new Set(),
    countries: new Set(),
    alliances: new Set(),
  });

  // Sort state
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">(
    "price",
  );

  // Extract unique airlines from results
  const realtimeAirlines = useMemo(() => {
    const airlineMap = new Map<string, AirlineInfo>();
    flights.forEach((flight) => {
      const code = flight.carrierCode || flight.flightNumber?.slice(0, 2);
      if (code && !airlineMap.has(code)) {
        airlineMap.set(code, {
          code,
          name: flight.airline || "Unknown Airline",
          logo: getAirlineLogo(code),
        });
      }
    });
    return Array.from(airlineMap.values());
  }, [flights]);

  // Extract stops options
  const stopsOptions = useMemo(() => {
    const stopsSet = new Set<number>();
    flights.forEach((flight) => {
      stopsSet.add(flight.stops);
    });
    return Array.from(stopsSet).sort((a, b) => a - b);
  }, [flights]);

  // Apply filters and sorting
  const filteredFlights = useMemo(() => {
    let result = [...flights];

    // Apply filters
    if (filters.stops.size > 0) {
      result = result.filter((flight) => {
        const stopLabel =
          flight.stops === 0
            ? "non-stop"
            : flight.stops === 1
              ? "1-stop"
              : "2-plus-stops";
        return filters.stops.has(stopLabel);
      });
    }

    if (filters.airlines.size > 0) {
      result = result.filter((flight) => {
        const code = flight.carrierCode || flight.flightNumber?.slice(0, 2);
        return filters.airlines.has(code);
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        result.sort((a, b) => a.amount - b.amount);
        break;
      case "duration":
        result.sort((a, b) => {
          const aDur = parseInt(a.duration) || 0;
          const bDur = parseInt(b.duration) || 0;
          return aDur - bDur;
        });
        break;
      case "departure":
        result.sort((a, b) => {
          const aTime = a.departureTime || "";
          const bTime = b.departureTime || "";
          return aTime.localeCompare(bTime);
        });
        break;
    }

    return result;
  }, [flights, filters, sortBy]);

  // Toggle filter handlers
  const toggleStopFilter = useCallback((stop: string) => {
    setFilters((prev) => {
      const newStops = new Set(prev.stops);
      if (newStops.has(stop)) {
        newStops.delete(stop);
      } else {
        newStops.add(stop);
      }
      return { ...prev, stops: newStops };
    });
  }, []);

  const toggleAirlineFilter = useCallback((code: string) => {
    setFilters((prev) => {
      const newAirlines = new Set(prev.airlines);
      if (newAirlines.has(code)) {
        newAirlines.delete(code);
      } else {
        newAirlines.add(code);
      }
      return { ...prev, airlines: newAirlines };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      stops: new Set(),
      airlines: new Set(),
      countries: new Set(),
      alliances: new Set(),
    });
  }, []);

  // Handle flight selection
  const handleSelectFlight = useCallback(
    (flight: FlightSearchResult) => {
      if (onSelectFlight) {
        onSelectFlight(flight);
      } else {
        navigate(`/flights/detail?id=${flight.id}&offerId=${flight.offerId}`);
      }
    },
    [navigate, onSelectFlight],
  );

  // Resolve airport name (placeholder - would use static data in production)
  const resolveAirport = useCallback((code: string) => code, []);

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 ${className}`}
      >
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Searching the skies...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-red-100 ${className}`}
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 gap-2">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900">Search Failed</h3>
        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide max-w-xs mx-auto">
          {error}
        </p>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            className="mt-8 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-widest px-8 py-4"
          >
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (flights.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 ${className}`}
      >
        <Plane size={48} className="text-gray-300 mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          No flights found matching your criteria
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Found {filteredFlights.length} of {flights.length} results
          </p>
          {isCached && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase">
              Cached
            </span>
          )}
          {(filters.stops.size > 0 || filters.airlines.size > 0) && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[9px] font-black uppercase">
              Filtered
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[11px] font-black text-primary uppercase tracking-widest outline-none border-none py-0"
          >
            <option value="price">Cheapest</option>
            <option value="duration">Fastest</option>
            <option value="departure">Departure</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 space-y-6 sticky top-32">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest text-xl font-semibold tracking-tight">
                Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-[10px] font-black text-primary uppercase underline px-4 py-2 rounded-md"
              >
                Reset All
              </button>
            </div>

            {/* Data Source Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Server size={12} className="text-gray-400" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                Real-time Results
              </span>
            </div>

            {/* Stops Filter */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Stops
                </h4>
                <Zap size={10} className="text-yellow-500" />
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Non-stop",
                    value: "non-stop",
                    count: flights.filter((f) => f.stops === 0).length,
                  },
                  {
                    label: "1 Stop",
                    value: "1-stop",
                    count: flights.filter((f) => f.stops === 1).length,
                  },
                  {
                    label: "2+ Stops",
                    value: "2-plus-stops",
                    count: flights.filter((f) => f.stops >= 2).length,
                  },
                ].map((stop) => (
                  <label
                    key={stop.value}
                    className={`flex items-center justify-between cursor-pointer group ${
                      stop.count === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                      {stop.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-400">
                        ({stop.count})
                      </span>
                      <input
                        type="checkbox"
                        checked={filters.stops.has(stop.value)}
                        onChange={() => toggleStopFilter(stop.value)}
                        className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Airlines Filter */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Airlines
                </h4>
                <Zap size={10} className="text-yellow-500" />
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {realtimeAirlines.map((airline) => (
                  <label
                    key={airline.code}
                    className="flex items-center justify-between cursor-pointer group gap-2 text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={airline.logo}
                        alt={airline.name}
                        className="w-5 h-5 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                        {airline.name}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={filters.airlines.has(airline.code)}
                      onChange={() => toggleAirlineFilter(airline.code)}
                      className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Cards */}
        <div className="lg:col-span-9 space-y-4">
          {filteredFlights.map((flight) => {
            const airlineInfo: AirlineInfo = {
              code: flight.carrierCode || "",
              name: flight.airline,
              logo: getAirlineLogo(flight.carrierCode || ""),
            };

            const isRoundTrip = flight.tripType === "round-trip";
            const isMultiCity = flight.tripType === "multi-city";
            const hasExtraLegs =
              flight.extraSlices && flight.extraSlices.length > 0;

            return (
              <div
                key={flight.id}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                onClick={() => handleSelectFlight(flight)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />

                {/* Card Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 px-8 pt-8 pb-6">
                  {/* Airline Info */}
                  <div className="flex items-center gap-4 shrink-0 lg:w-44">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100 gap-2">
                      <img
                        src={airlineInfo.logo}
                        className="w-full h-full object-contain"
                        alt={flight.airline}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://cdn-icons-png.flaticon.com/512/723/723955.png";
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 tracking-tight leading-tight">
                        {flight.airline}
                      </h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                        {flight.flightNumber}
                      </p>
                      {/* Trip type badge */}
                      <span
                        className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          isRoundTrip
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : isMultiCity
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-gray-50 text-gray-500 border-gray-100"
                        }`}
                      >
                        {isRoundTrip
                          ? "↔ Round Trip"
                          : isMultiCity
                            ? "⤳ Multi-City"
                            : "→ One Way"}
                      </span>
                    </div>
                  </div>

                  {/* Flight Timeline */}
                  <div className="flex-1 w-full space-y-0">
                    {/* Outbound */}
                    <div className="px-0 lg:px-4">
                      <LegTimeline
                        leg={{
                          origin: flight.origin,
                          originCity: flight.originCity,
                          destination: flight.destination,
                          destCity: flight.destinationCity,
                          departureTime: flight.departureTime,
                          arrivalTime: flight.arrivalTime,
                          duration: flight.duration,
                          stops: flight.stops,
                        }}
                        label={hasExtraLegs ? "Outbound" : undefined}
                        resolveAirport={resolveAirport}
                      />
                    </div>

                    {/* Extra Legs */}
                    {hasExtraLegs &&
                      flight.extraSlices!.map((sl, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-3 my-3 px-4">
                            <div className="flex-1 h-px border-t border-dashed border-gray-200 gap-4" />
                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[2px] flex items-center gap-1">
                              <ArrowRight size={8} className="rotate-180" />
                              {isRoundTrip ? "Return" : `Leg ${idx + 2}`}
                              <ArrowRight size={8} />
                            </span>
                            <div className="flex-1 h-px border-t border-dashed border-gray-200 gap-4" />
                          </div>
                          <div className="px-0 lg:px-4">
                            <LegTimeline
                              leg={sl}
                              label={isMultiCity ? `Leg ${idx + 2}` : undefined}
                              resolveAirport={resolveAirport}
                            />
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="w-full lg:w-52 flex lg:flex-col items-center justify-between lg:justify-center gap-4 lg:border-l border-gray-100 lg:pl-8 pt-4 lg:pt-0 shrink-0">
                    <div className="text-right lg:text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                        {isRoundTrip
                          ? "Round Trip"
                          : isMultiCity
                            ? "All Legs"
                            : "Per Person"}
                      </p>
                      <p className="text-2xl font-black text-primary tracking-tighter">
                        {formatCurrency(flight.amount, flight.currency)}
                      </p>
                      <div className="flex items-center gap-1 justify-end lg:justify-center text-[9px] font-bold mt-1 uppercase tracking-widest">
                        {flight.refundable ? (
                          <span className="text-green-500 flex items-center gap-1">
                            <ShieldCheck size={9} />
                            Refundable
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Luggage size={9} />
                            {flight.includedBags?.[0]?.weight
                              ? `${flight.includedBags[0].weight}kg bag`
                              : "See bags"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectFlight(flight);
                      }}
                      className="h-11 px-8 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-foreground/90 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                    >
                      Select Deal
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DuffelFlightResults;

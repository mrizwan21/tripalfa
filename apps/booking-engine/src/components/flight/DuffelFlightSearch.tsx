/**
 * DuffelFlightSearch Component
 *
 * A comprehensive flight search form integrated with Duffel API.
 * Supports one-way, round-trip, and multi-city searches.
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  ArrowRightLeft,
  Plus,
  X,
  Plane,
  Search,
  Loader2,
} from "lucide-react";
import { SearchAutocomplete, Suggestion } from "../ui/SearchAutocomplete";
import { TravelerSelector } from "../ui/TravelerSelector";
import { CabinSelector } from "../ui/CabinSelector";
import { DualMonthCalendar } from "../ui/DualMonthCalendar";
import { Button } from "../ui/button";
import { useDuffelFlights } from "../../hooks/useDuffelFlights";
import type { CabinClass } from "../../types/duffel";

// ============================================================================
// TYPES
// ============================================================================

interface FlightLeg {
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  date: Date | null;
}

interface DuffelFlightSearchProps {
  /** Initial trip type */
  initialTripType?: "roundTrip" | "oneWay" | "multiCity";
  /** Initial cabin class */
  initialCabinClass?: CabinClass;
  /** Callback when search completes */
  onSearchComplete?: (flights: any[]) => void;
  /** Custom navigate function */
  onNavigate?: (params: URLSearchParams) => void;
  /** Show compact version */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DuffelFlightSearch({
  initialTripType = "roundTrip",
  initialCabinClass = "economy",
  onSearchComplete,
  onNavigate,
  compact = false,
  className = "",
}: DuffelFlightSearchProps) {
  const navigate = useNavigate();

  // Trip configuration
  const [tripType, setTripType] = useState<
    "roundTrip" | "oneWay" | "multiCity"
  >(initialTripType);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialCabinClass);

  // Origin/Destination
  const [from, setFrom] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [to, setTo] = useState("");
  const [toCode, setToCode] = useState("");

  // Dates
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);

  // Travelers
  const [travelers, setTravelers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });

  // Multi-city legs
  const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>([
    { from: "", fromCode: "", to: "", toCode: "", date: null },
    { from: "", fromCode: "", to: "", toCode: "", date: null },
  ]);

  // Search hook
  const { search, loading, error, flights } = useDuffelFlights({
    onSuccess: onSearchComplete,
  });

  // Swap origin and destination
  const handleSwap = useCallback(() => {
    const tmpFrom = from;
    const tmpFromCode = fromCode;
    setFrom(to);
    setFromCode(toCode);
    setTo(tmpFrom);
    setToCode(tmpFromCode);
  }, [from, fromCode, to, toCode]);

  // Add multi-city leg
  const addMultiCityLeg = useCallback(() => {
    if (multiCityLegs.length < 6) {
      setMultiCityLegs((prev) => [
        ...prev,
        { from: "", fromCode: "", to: "", toCode: "", date: null },
      ]);
    }
  }, [multiCityLegs.length]);

  // Remove multi-city leg
  const removeMultiCityLeg = useCallback(
    (idx: number) => {
      if (multiCityLegs.length > 2) {
        setMultiCityLegs((prev) => prev.filter((_, i) => i !== idx));
      }
    },
    [multiCityLegs.length],
  );

  // Update multi-city leg
  const updateMultiCityLeg = useCallback(
    (idx: number, field: string, value: any) => {
      setMultiCityLegs((prev) =>
        prev.map((leg, i) => (i === idx ? { ...leg, [field]: value } : leg)),
      );
    },
    [],
  );

  // Handle search
  const handleSearch = useCallback(async () => {
    // Build search params
    const params = new URLSearchParams();
    params.set("tripType", tripType);
    params.set("cabinClass", cabinClass);
    params.set("adults", travelers.adults.toString());
    params.set("children", travelers.children.toString());
    params.set("infants", travelers.infants.toString());

    if (tripType === "multiCity") {
      // Multi-city search
      multiCityLegs.forEach((leg, i) => {
        if (leg.fromCode) params.set(`leg[${i}][origin]`, leg.fromCode);
        else if (leg.from) params.set(`leg[${i}][origin]`, leg.from);
        if (leg.toCode) params.set(`leg[${i}][destination]`, leg.toCode);
        else if (leg.to) params.set(`leg[${i}][destination]`, leg.to);
        if (leg.date)
          params.set(`leg[${i}][date]`, format(leg.date, "yyyy-MM-dd"));
      });

      // Navigate to results page
      if (onNavigate) {
        onNavigate(params);
      } else {
        navigate(`/flights/search?${params.toString()}`);
      }
    } else {
      // One-way or round-trip
      if (fromCode) params.set("origin", fromCode);
      else if (from) params.set("origin", from);
      if (toCode) params.set("destination", toCode);
      else if (to) params.set("destination", to);
      if (departureDate)
        params.set("departureDate", format(departureDate, "yyyy-MM-dd"));
      if (returnDate && tripType === "roundTrip") {
        params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
      }

      // Navigate to results page
      if (onNavigate) {
        onNavigate(params);
      } else {
        navigate(`/flights/search?${params.toString()}`);
      }
    }
  }, [
    tripType,
    cabinClass,
    travelers,
    from,
    fromCode,
    to,
    toCode,
    departureDate,
    returnDate,
    multiCityLegs,
    navigate,
    onNavigate,
  ]);

  // Handle location selection
  const handleFromSelect = useCallback((loc: Suggestion) => {
    if (loc.type === "AIRPORT") {
      setFrom(`${loc.title} (${loc.code})`);
      setFromCode(String(loc.code));
    } else {
      setFrom(loc.title);
      setFromCode(loc.title);
    }
  }, []);

  const handleToSelect = useCallback((loc: Suggestion) => {
    if (loc.type === "AIRPORT") {
      setTo(`${loc.title} (${loc.code})`);
      setToCode(String(loc.code));
    } else {
      setTo(loc.title);
      setToCode(loc.title);
    }
  }, []);

  // Render multi-city leg
  const renderMultiCityLeg = (leg: FlightLeg, idx: number) => (
    <div
      key={idx}
      className="grid grid-cols-12 gap-3 items-center bg-white/5 rounded-xl p-3"
    >
      <div className="col-span-3">
        <SearchAutocomplete
          type="flight"
          placeholder={`Leg ${idx + 1} From`}
          icon={<MapPin size={16} />}
          value={leg.from}
          onChange={(v) => updateMultiCityLeg(idx, "from", v)}
          onSelect={(loc: Suggestion) => {
            if (loc.type === "AIRPORT") {
              updateMultiCityLeg(idx, "from", `${loc.title} (${loc.code})`);
              updateMultiCityLeg(idx, "fromCode", String(loc.code));
            } else {
              updateMultiCityLeg(idx, "from", loc.title);
              updateMultiCityLeg(idx, "fromCode", loc.title);
            }
          }}
        />
      </div>
      <div className="col-span-3">
        <SearchAutocomplete
          type="flight"
          placeholder={`Leg ${idx + 1} To`}
          icon={<MapPin size={16} />}
          value={leg.to}
          onChange={(v) => updateMultiCityLeg(idx, "to", v)}
          onSelect={(loc: Suggestion) => {
            if (loc.type === "AIRPORT") {
              updateMultiCityLeg(idx, "to", `${loc.title} (${loc.code})`);
              updateMultiCityLeg(idx, "toCode", String(loc.code));
            } else {
              updateMultiCityLeg(idx, "to", loc.title);
              updateMultiCityLeg(idx, "toCode", loc.title);
            }
          }}
        />
      </div>
      <div className="col-span-3">
        <input
          type="date"
          value={leg.date ? format(leg.date, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const d = e.target.value ? new Date(e.target.value) : null;
            updateMultiCityLeg(idx, "date", d);
          }}
          className="w-full h-10 px-3 rounded-lg bg-white/90 text-gray-900 text-sm font-medium border-0 focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="col-span-3 flex items-center gap-2">
        {multiCityLegs.length > 2 && (
          <button
            onClick={() => removeMultiCityLeg(idx)}
            className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1"
          >
            <X size={14} /> Remove
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`} data-testid="duffel-flight-search">
      {/* Trip Type Selection */}
      <div className="flex gap-4 mb-4 text-white text-xs font-bold px-2 items-center flex-wrap uppercase tracking-wider">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          <input
            type="radio"
            name="trip"
            checked={tripType === "roundTrip"}
            onChange={() => setTripType("roundTrip")}
            className="accent-accent"
          />
          Round Trip
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          <input
            type="radio"
            name="trip"
            checked={tripType === "oneWay"}
            onChange={() => setTripType("oneWay")}
            className="accent-accent"
          />
          One Way
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          <input
            type="radio"
            name="trip"
            checked={tripType === "multiCity"}
            onChange={() => setTripType("multiCity")}
            className="accent-accent"
          />
          Multi-City
        </label>
        <div className="ml-auto flex items-center gap-4">
          <CabinSelector />
          <TravelerSelector />
        </div>
      </div>

      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {tripType === "multiCity" ? (
          // Multi-city form
          <div className="col-span-12 space-y-3">
            {multiCityLegs.map((leg, idx) => renderMultiCityLeg(leg, idx))}
            <button
              onClick={addMultiCityLeg}
              disabled={multiCityLegs.length >= 6}
              className="text-white/80 hover:text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} /> Add another leg
            </button>
            <div className="pt-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Search Multi-City
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // One-way / Round-trip form
          <>
            {/* From Input */}
            <div className="col-span-12 md:col-span-3 h-12">
              <SearchAutocomplete
                type="flight"
                placeholder="From where?"
                icon={<MapPin size={20} />}
                value={from}
                onChange={setFrom}
                onSelect={handleFromSelect}
                dataTestId="flight-from"
              />
            </div>

            {/* Swap Button */}
            <div className="hidden md:flex col-span-1 items-center justify-center">
              <button
                onClick={handleSwap}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
              >
                <div className="bg-white rounded-full p-1 shadow-lg">
                  <ArrowRightLeft size={16} className="text-primary" />
                </div>
              </button>
            </div>

            {/* To Input */}
            <div className="col-span-12 md:col-span-3 h-12">
              <SearchAutocomplete
                type="flight"
                placeholder="To where?"
                icon={<MapPin size={20} />}
                value={to}
                onChange={setTo}
                onSelect={handleToSelect}
                dataTestId="flight-to"
              />
            </div>

            {/* Date Picker */}
            <div className="col-span-12 md:col-span-3">
              <DualMonthCalendar
                departureDate={departureDate}
                returnDate={returnDate}
                onDepartureDateChange={setDepartureDate}
                onReturnDateChange={setReturnDate}
                mode="flight"
                departureLabel="Departure"
                returnLabel={tripType === "roundTrip" ? "Return" : undefined}
              />
            </div>

            {/* Search Button */}
            <div className="col-span-12 md:col-span-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                data-testid="flight-search-submit"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default DuffelFlightSearch;

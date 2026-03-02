import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { SearchAutocomplete, Suggestion } from "../ui/SearchAutocomplete";
import { DualMonthCalendar } from "../ui/DualMonthCalendar";
import { format } from "date-fns";

export function ModifySearchPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper to safely parse dates
  const safeParseDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Initialize state from URL params
  const [from, setFrom] = useState(
    searchParams.get("from") || searchParams.get("origin") || "",
  );
  const [to, setTo] = useState(
    searchParams.get("to") || searchParams.get("destination") || "",
  );
  const [fromCode, setFromCode] = useState(searchParams.get("origin") || "");
  const [toCode, setToCode] = useState(searchParams.get("destination") || "");

  // safeParseDate prevents "Invalid Date" which crashes date-fns
  const [departureDate, setDepartureDate] = useState<Date | null>(
    safeParseDate(searchParams.get("date")) ||
      safeParseDate(searchParams.get("departureDate")),
  );
  const [returnDate, setReturnDate] = useState<Date | null>(
    safeParseDate(searchParams.get("returnDate")),
  );

  const [adults, setAdults] = useState(
    searchParams.get("adults") || searchParams.get("travelers") || "1",
  );
  const [cabinClass, setCabinClass] = useState(
    searchParams.get("cabinClass") || "Economy",
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (fromCode) params.set("origin", fromCode);
    else if (from) params.set("origin", from);

    if (toCode) params.set("destination", toCode);
    else if (to) params.set("destination", to);

    if (departureDate)
      params.set("departureDate", format(departureDate, "yyyy-MM-dd"));
    if (returnDate) params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
    params.set("adults", adults);
    params.set("cabinClass", cabinClass);

    navigate(`/flights/list?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Location Inputs */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="h-12">
            <SearchAutocomplete
              type="flight"
              placeholder="From where?"
              icon={<MapPin size={16} className="text-primary" />}
              value={from}
              onChange={setFrom}
              onSelect={(item: Suggestion) => {
                if (item.type === "AIRPORT") {
                  setFrom(`${item.title} (${item.code})`);
                  setFromCode(String(item.code));
                } else {
                  setFrom(item.title);
                  setFromCode(item.title);
                }
              }}
            />
          </div>
          <div className="h-12">
            <SearchAutocomplete
              type="flight"
              placeholder="To where?"
              icon={<MapPin size={16} className="text-primary" />}
              value={to}
              onChange={setTo}
              onSelect={(item: Suggestion) => {
                if (item.type === "AIRPORT") {
                  setTo(`${item.title} (${item.code})`);
                  setToCode(String(item.code));
                } else {
                  setTo(item.title);
                  setToCode(item.title);
                }
              }}
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="w-full lg:w-auto min-w-[300px]">
          <DualMonthCalendar
            departureDate={departureDate}
            returnDate={returnDate}
            onDepartureDateChange={setDepartureDate}
            onReturnDateChange={setReturnDate}
            mode="flight"
            departureLabel="Departure"
            returnLabel="Return"
          />
        </div>

        {/* Travelers & Class (Simplified for compact view) */}
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className="h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary"
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num} Traveler{num > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-primary"
          >
            <option value="Economy">Economy</option>
            <option value="Premium Economy">Premium Eco</option>
            <option value="Business">Business</option>
            <option value="First">First Class</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full lg:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
        >
          <Search size={16} />
          <span>Update</span>
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useLiteApiHotels } from "../hooks/useLiteApiHotels";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { SearchAutocomplete } from "../components/ui/SearchAutocomplete";
import { formatCurrency } from "@tripalfa/ui-components";
import { BookingStepper } from "../components/ui/BookingStepper";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
import {
  useBoardTypes,
  useHotelAmenities,
  useHotelTypes,
} from "../hooks/useStaticData";
import { HotelMap } from "../components/map";
import type { HotelSearchParams } from "../services/liteApiManager";
import { Label } from "@/components/ui/label";
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

export default function HotelList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use LiteAPI Hotels hook for search with Redis caching
  const { hotels, loading, error, search, isCached, total } = useLiteApiHotels({
    enableCache: true,
    cacheTTL: 15 * 60 * 1000, // 15 min cache
  });

  // Use DB-backed hooks for filter options via React Query
  const amenitiesQuery = useHotelAmenities();
  const hotelTypesQuery = useHotelTypes();
  const boardTypesQuery = useBoardTypes();

  // Build filter options from DB-backed data with loading states
  const filterOptions = useMemo(
    () => ({
      facilities: (amenitiesQuery.data || []).map((a) => a.name),
      types: (hotelTypesQuery.data || []).map((t) => t.name),
      boardTypes: (boardTypesQuery.data || []).map((b) => b.name),
      starRatings: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    }),
    [amenitiesQuery.data, hotelTypesQuery.data, boardTypesQuery.data],
  );

  // Determine if filters are loading
  const isLoadingFilters =
    amenitiesQuery.isLoading ||
    hotelTypesQuery.isLoading ||
    boardTypesQuery.isLoading;

  // Destination Search State (managed via SearchAutocomplete)
  const [destination, setDestination] = useState(
    searchParams.get("location") || "",
  );

  // Fetch hotel data using LiteAPI hook
  useEffect(() => {
    const location = searchParams.get("location") || "Dubai";
    const checkin = searchParams.get("checkin") || "2024-10-25";
    const checkout = searchParams.get("checkout") || "2024-10-26";
    const adults = parseInt(searchParams.get("adults") || "2");

    const searchParamsLite: HotelSearchParams = {
      location,
      checkin,
      checkout,
      adults,
      rooms: 1,
    };

    search(searchParamsLite);
  }, [searchParams]);

  // Map LiteAPI results to Hotel interface
  const mappedHotels: Hotel[] = useMemo(() => {
    return hotels.map((h) => ({
      id: h.id,
      name: h.name,
      location: h.location,
      image: h.image,
      price: h.price,
      stars: h.rating,
      rating: h.rating,
      facilities: h.amenities,
    }));
  }, [hotels]);

  // Update destination state when URL changes
  useEffect(() => {
    setDestination(searchParams.get("location") || "");
  }, [searchParams]);

  // Interactive Filter State
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    stars: [],
    price: [],
    board: [],
    type: [],
    rating: [],
    facilities: [],
  });

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const exists = current.includes(value);
      if (
        value === "Any" ||
        value === "Any Price" ||
        value === "Any Rating" ||
        value === "Any Facility" ||
        value === "Any Type" ||
        value === "Any Basis"
      ) {
        return { ...prev, [category]: [] };
      }
      return {
        ...prev,
        [category]: exists
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const filteredHotels = React.useMemo(() => {
    return mappedHotels.filter((h) => {
      // Price Filter
      if (filters.price.length > 0) {
        const price = h.price?.amount || 0;
        const matchesPrice = filters.price.some((range) => {
          if (range === "Under $100") return price < 100;
          if (range === "$100 - $300") return price >= 100 && price <= 300;
          if (range === "$300 - $500") return price > 300 && price <= 500;
          if (range === "$500+") return price > 500;
          return true;
        });
        if (!matchesPrice) return false;
      }

      // Star Rating Filter (Assuming h.stars is present in data, defaulting to match if missing)
      if (filters.stars.length > 0) {
        const starCount = h.stars || 0;
        const matchesStars = filters.stars.some((s) => {
          if (s === "1 Star") return starCount === 1;
          if (s === "2 Stars") return starCount === 2;
          if (s === "3 Stars") return starCount === 3;
          if (s === "4 Stars") return starCount === 4;
          if (s === "5 Stars") return starCount === 5;
          return true;
        });
        if (!matchesStars) return false;
      }

      // Guest Rating Filter
      if (filters.rating.length > 0) {
        const rating = h.rating || 0;
        const matchesRating = filters.rating.some((r) => {
          if (r.startsWith("7+")) return rating >= 7;
          if (r.startsWith("8+")) return rating >= 8;
          if (r.startsWith("9+")) return rating >= 9;
          return true;
        });
        if (!matchesRating) return false;
      }

      // Property Type
      if (filters.type.length > 0) {
        // Assuming h.type or h.propertyType exists
        const type = h.type || h.propertyType || "";
        if (!filters.type.includes(type)) return false;
      }

      // Facilities
      if (filters.facilities.length > 0) {
        const hotelFacilities = (h.facilities || []).map((f: string) =>
          f.toLowerCase(),
        );
        const matchesFacilities = filters.facilities.every((f) =>
          hotelFacilities.includes(f.toLowerCase()),
        );
        if (!matchesFacilities) return false;
      }

      return true;
    });
  }, [hotels, filters]);

  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (loading) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-foreground font-bold uppercase tracking-widest text-sm">
            Searching the globe...
          </p>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="bg-[hsl(var(--background))] min-h-screen pt-32">
        <BookingStepper currentStep={1} />

        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top Search & Filter Bar (Homepage Glass Finish & Standardized Width) */}
          <Card className="p-0 mb-6 bg-card/20 backdrop-blur-md shadow-2xl border border-border/30 overflow-visible rounded-3xl relative z-20 w-full">
            <div className="flex flex-wrap lg:flex-nowrap items-end gap-0 px-5 py-2.5">
              <div className="flex-1 min-w-[220px] relative border-r border-white/10 pr-4 mr-4 gap-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block text-sm font-medium">
                  Destination
                </Label>
                <div className="relative">
                  <SearchAutocomplete
                    type="hotel"
                    placeholder="Where are you going?"
                    icon={
                      <MapPin
                        size={16}
                        className="text-[hsl(var(--secondary))]"
                      />
                    }
                    value={destination}
                    onChange={setDestination}
                    onSelect={(item: Suggestion) => {
                      setDestination(item.title);
                      const params = new URLSearchParams(searchParams);
                      params.set("location", item.title);
                      if (item.countryCode)
                        params.set("countryCode", item.countryCode);
                      navigate(`/hotels/list?${params.toString()}`);
                    }}
                  />
                </div>
              </div>

              <div className="w-full sm:w-36 relative border-r border-white/10 pr-4 mr-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block text-sm font-medium">
                  Check-in
                </Label>
                <div className="relative">
                  <Calendar
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    defaultValue={searchParams.get("checkin") || ""}
                    className="w-full h-8 pl-6 bg-transparent border-none text-sm font-bold text-foreground cursor-pointer truncate focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="w-full sm:w-36 relative border-r border-white/10 pr-4 mr-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block text-sm font-medium">
                  Check-out
                </Label>
                <div className="relative">
                  <Calendar
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    defaultValue={searchParams.get("checkout") || ""}
                    className="w-full h-8 pl-6 bg-transparent border-none text-sm font-bold text-foreground cursor-pointer truncate focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48 relative mr-6">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block text-sm font-medium">
                  Guests & Rooms
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    defaultValue={`${searchParams.get("adults") || 2} Adults, ${searchParams.get("children") || 0} Child`}
                    readOnly
                    className="w-full h-8 pl-6 bg-transparent border-none text-sm font-bold text-foreground cursor-pointer truncate focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="flex gap-2 shrink-0 py-1">
                <Button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    if (destination) params.set("location", destination);
                    // Add other params update logic if needed (dates are currently not managed by state here but inputs should be)
                    navigate(`/hotels/list?${params.toString()}`);
                  }}
                  className="bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] h-9 px-5 font-black rounded-xl shadow-lg shadow-indigo-100 uppercase text-[8px] tracking-wide"
                >
                  <Search size={14} className="mr-1" /> Search
                </Button>
              </div>
            </div>
          </Card>

          {/* Subfilter Bar with Placeholders (Interactive) */}
          <div className="flex flex-wrap gap-3 mb-10 mt-8 relative z-10">
            {[
              {
                id: "stars",
                label: "Hotel Categories",
                placeholder: "Any Stars",
                options: [
                  "Any",
                  "1 Star",
                  "2 Stars",
                  "3 Stars",
                  "4 Stars",
                  "5 Stars",
                ],
              },
              {
                id: "price",
                label: "Price Range",
                placeholder: "Any Price",
                options: [
                  "Any Price",
                  "Under $100",
                  "$100 - $300",
                  "$300 - $500",
                  "$500+",
                ],
              },
              {
                id: "board",
                label: "Board Basis",
                placeholder: "Any Basis",
                options: [
                  "Any",
                  ...(boardTypesQuery.data || []).map((b) => b.name),
                ],
              },
              {
                id: "type",
                label: "Property Type",
                placeholder: "Any Type",
                options: ["Any", ...filterOptions.types],
              },
              {
                id: "rating",
                label: "Guest Rating",
                placeholder: "Any Rating",
                options: ["Any", "7+ Good", "8+ Very Good", "9+ Superb"],
              },
              {
                id: "facilities",
                label: "Facilities",
                placeholder: "Any Facility",
                options: ["Any", ...filterOptions.facilities],
              },
            ].map((f, i) => {
              const selectedCount =
                filters[f.id as keyof typeof filters].length;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-1 min-w-[130px] flex-1 relative"
                >
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1 text-sm font-medium">
                    {f.label}
                  </Label>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter(activeFilter === i ? null : i);
                    }}
                    className={`h-10 px-3 bg-card border rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:border-[hsl(var(--secondary))] hover:shadow-md transition-all group ${activeFilter === i || selectedCount > 0 ? "border-[hsl(var(--secondary))] ring-2 ring-indigo-50" : "border-border"}`}
                  >
                    <span
                      className={`text-[10px] font-bold ${selectedCount > 0 ? "text-[hsl(var(--secondary))]" : "text-muted-foreground"} group-hover:text-foreground`}
                    >
                      {selectedCount > 0
                        ? `${selectedCount} Selected`
                        : f.placeholder}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground group-hover:text-[hsl(var(--secondary))] transition-transform duration-300 ${activeFilter === i ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {activeFilter === i && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                        {isLoadingFilters &&
                        (f.id === "facilities" || f.id === "type")
                          ? // Loading skeleton for amenities and types filters
                            Array.from({ length: 4 }).map((_, idx) => (
                              <div key={idx} className="px-4 py-2.5 rounded-xl">
                                <div className="h-4 bg-muted rounded animate-pulse" />
                              </div>
                            ))
                          : f.options.map((opt, idx) => {
                              const isSelected =
                                filters[f.id as keyof typeof filters].includes(
                                  opt,
                                );
                              return (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFilter(
                                      f.id as keyof typeof filters,
                                      opt,
                                    );
                                  }}
                                  className={`px-4 py-2.5 rounded-xl hover:bg-muted/10 flex items-center justify-between group cursor-pointer transition-colors ${isSelected ? "bg-indigo-50" : ""}`}
                                >
                                  <span
                                    className={`text-xs font-bold ${isSelected ? "text-[hsl(var(--secondary))]" : "text-foreground"}`}
                                  >
                                    {opt}
                                  </span>
                                  {isSelected && (
                                    <Check
                                      size={12}
                                      className="text-[hsl(var(--secondary))]"
                                    />
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
                  <h2 className="text-xl font-black text-foreground text-2xl font-semibold tracking-tight">
                    Recommended Stays
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Based on {hotels.length} verified properties found
                  </p>
                </div>
              </div>

              {filteredHotels.map((h) => (
                <Card
                  key={h.id}
                  className="group overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex h-64 bg-card rounded-3xl"
                >
                  {/* Hotel Image */}
                  <div className="w-[38%] relative overflow-hidden">
                    <img
                      src={h.image}
                      alt={h.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[hsl(var(--secondary))] shadow-xl border border-border/50">
                        Top Rated
                      </span>
                    </div>
                  </div>

                  {/* Hotel Info (Refined Alignment) */}
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 pr-4 gap-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className="text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                        <h3 className="text-xl font-black text-foreground group-hover:text-[hsl(var(--secondary))] transition-colors leading-tight mb-2">
                          {h.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin
                            size={14}
                            className="text-[hsl(var(--secondary))]"
                          />
                          <span className="text-[11px] font-black uppercase tracking-tighter">
                            {h.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                          Total Stay
                        </p>
                        <p className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tighter">
                          {formatCurrency(h.price?.amount || 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1">
                          ✓ Taxes Included
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/10 rounded-2xl flex flex-wrap gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-foreground uppercase">
                        <Wifi size={14} className="text-blue-500" /> WiFi
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-foreground uppercase">
                        <Coffee size={14} className="text-orange-500" />{" "}
                        Breakfast
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-foreground uppercase">
                        <Waves size={14} className="text-cyan-500" /> Pool
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm gap-2">
                          {h.rating}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tighter text-foreground leading-none">
                            Excellent
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mt-1">
                            420 Reviews
                          </p>
                        </div>
                      </div>
                      <Button
                        className="bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] h-10 px-5 font-black rounded-xl shadow-lg shadow-indigo-100 uppercase text-[8px] tracking-wide"
                        onClick={() => navigate(`/hotels/${h.id}`)}
                      >
                        Select Room
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-12 pb-10">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-border text-muted-foreground hover:bg-card/90 transition-all gap-2"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-black text-sm shadow-lg shadow-indigo-100 gap-2"
                >
                  1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-card/90 text-foreground font-black text-sm border-2 border-transparent gap-2"
                >
                  2
                </Button>
                <span className="text-muted-foreground font-black">...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-card/90 text-foreground font-black text-sm border-2 border-transparent gap-2"
                >
                  10
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-border text-muted-foreground hover:bg-card/90 transition-all gap-2"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>

            {/* Right Column: Sticky Mapbox Map */}
            <div className="hidden lg:block lg:w-[42%] sticky top-24 h-[calc(100vh-120px)] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white relative">
              {/* Refresh button overlay */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-card/90 backdrop-blur-xl text-foreground hover:bg-card/90 shadow-2xl h-12 px-8 font-black border-none rounded-2xl transition-all scale-95 hover:scale-100"
                >
                  <RotateCcw
                    size={18}
                    className="mr-3 text-[hsl(var(--secondary))]"
                  />{" "}
                  Refresh Map
                </Button>
              </div>

              {/* Real Mapbox map showing hotel locations */}
              <HotelMap
                hotels={filteredHotels
                  .filter((h) => h.latitude != null && h.longitude != null)
                  .map((h) => ({
                    id: String(h.id),
                    name: h.name || "Hotel",
                    address: h.location,
                    latitude: h.latitude,
                    longitude: h.longitude,
                    rating: h.rating,
                    price: h.price?.amount,
                    currency: h.price?.currency,
                  }))}
                height="100%"
                className="w-full h-full"
                onHotelClick={(hotelId) =>
                  navigate(`/hotels/${hotelId}`, {
                    state: {
                      checkin: searchParams.get("checkin"),
                      checkout: searchParams.get("checkout"),
                      adults: parseInt(searchParams.get("adults") || "2"),
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
